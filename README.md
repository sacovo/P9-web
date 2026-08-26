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

`/smolvla-presentation/` is the Slidev deck in **`presentation/`**, an npm
workspace of this repo. `npm install` at the root installs the site and the
deck together, and `npm run build` runs `scripts/sync-deck.mjs` before
`astro build`, so one command produces the site with the deck already in it.
Its output under `public/smolvla-presentation/` is generated and gitignored.

```bash
npm run dev:deck     # live deck, press `p` for presenter mode
npm run build:deck   # just the deck → public/smolvla-presentation/
npm run export:deck  # → presentation/dist/smolvla-presentation.pdf
```

The deck is deliberately **not linked** from the hero or the nav while it is
still being reworked; it stands on its own at its URL. See
`presentation/README.md` for the deck itself, and `src/components/Nav.astro`
for the note about the missing link.

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

In practice it is served by the Caddy in `deploy/` on the box the site's own
hostname points at, and **a push to `main` publishes it**:
`.github/workflows/deploy.yml` runs `deploy/deploy.sh` — the same script you
would run by hand — and then checks the live site actually answers, including
a deep link into the Slidev deck. Pull requests run the build only; the deploy
steps are skipped, so a PR never touches the server.

| Piece | Where |
|---|---|
| `SSH_PRIVATE_KEY` | repo secret; its public half is `github@p9-web` in the server's `authorized_keys` |
| host key | pinned in `deploy/known_hosts`, so CI never trusts-on-first-use |
| target host | derived from `site.config.json` (`debian@<site label>.<baseDomain>`), overridable with `P9_SERVER` |

Deploying by hand still works and does exactly the same thing:

```bash
./deploy/deploy.sh
```
