# P9-web

Companion site for the FHNW master's thesis **P9 — Mars Rover Autonomy**
(Sandro Covo). A short overview of the project, and — the actual point — the
interactive demos a PDF cannot carry.

Astro + Tailwind v4, static output. See [PLAN.md](PLAN.md) for the full design
and the phase plan.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static build → dist/
npm run preview    # serve the production build
```

Node 20+ (developed on Node 24).

## Editing content

Site copy lives in **`content/p9-content.json`** — one file the whole page
renders from, typed by `src/lib/p9.ts`, so a wrong shape is a build error
rather than a blank section.

## External URLs

Everything pointing outside this repo is in **`src/config.ts`**. Each entry is
optional: when one is `null` the corresponding tile degrades from an embed to
a link-out and the site still builds, so no phase blocks on DNS.

| Host | Serves |
|---|---|
| `p9.fhnw-rover.sacovo.ch` | this site |
| `n8n-demo.fhnw-rover.sacovo.ch` | the n8n editor |
| `n8n-turtle.fhnw-rover.sacovo.ch` | read-only turtlesim viewer + `/api/status` |
| `n8n-preview.fhnw-rover.sacovo.ch` | data-less workflow-canvas renderer |
| `recap-demo.fhnw-rover.sacovo.ch` | the PushT / RECAP demo |

The zone and the subdomain labels live in **`site.config.json`** at the repo
root — read by `src/config.ts` for page links, by `astro.config.mjs` for
canonical URLs and the sitemap, and by `deploy/` for the Caddy sites. Moving
the stack to `fhnw-rover.ch` later is that one file.

> **Do not set `N8N_PREVIEW_MODE=true` on `n8n-demo`.** It disables
> `X-Frame-Options` instance-wide and skips the owner-setup redirect. That is
> why the canvas renderer is a second, credential-free container. PLAN.md §6.1.

## The report PDF

Not committed. When the thesis is frozen:

```bash
node scripts/sync-report.mjs            # or pass a path to main.pdf
```

then set `report.pdf` in `src/config.ts`. Every download link appears on its
own once it is non-null. Check the PDF was built **without** todonotes first —
the working build carries a "List of Tasks and Topics to Cover" page.

## The talk deck

`/smolvla-presentation/` is the Slidev deck from `../smolvla-presentation`,
vendored into `public/` as a plain static build — no submodule, because the
site has to build with no sibling checkout present. Refresh it with:

```bash
node scripts/sync-deck.mjs              # or pass the deck's path
```

It is a single-page app, so `/smolvla-presentation/7` is a client route rather
than a file. The fallback to the deck's own index is stated three times, once
per host: `vercel.json`, `public/_redirects` and `deploy/Caddyfile`. Change one
and change the other two.

## Design

The FHNW student-project styleguide is the base; its tokens in
`src/styles/global.css` are taken verbatim from
`web0.fhnw.ch/ht/informatik/css/` rather than eyeballed. The FHNW Rover team
site supplies the structure — eyebrow kickers, tabular readouts, hairline
rules, corner brackets — with its dark ground, film grain, marquee and
smooth-scroll deliberately left out.

Element defaults live in `@layer base`. Unlayered CSS beats every Tailwind
layer, so an unlayered `a { color }` would win over `.btn` and paint button
labels black on black.

## Deploy

Static `dist/`. `vercel.json` and `public/_headers` carry the same headers, so
Vercel and Cloudflare Pages behave identically. Set the real domain in
`astro.config.mjs` (`site:`) before the first production build.
