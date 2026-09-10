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

`content/pusht-scenarios.json` is the exception: it is **generated**, not
edited. Every figure on `/demos/pusht` comes from it, derived from the
`pusht-web-demo` checkout by

```bash
node scripts/sync-pusht-scenarios.mjs [path/to/pusht-web-demo]
```

Re-run it after that repo re-measures — it reads `web/src/ui/scenarios.json`
and the `parity_eval.py` outputs, computes the paired guidance comparison
itself, and weighs the ONNX export for the download figure in the precheck.
Nothing on that page is typed by hand, which is the point: the demo's own
explainer prose quoted a superseded checkpoint's numbers for a while, and prose
is where that happens.

## External URLs

Everything pointing outside this repo is in **`src/config.ts`**. Each entry is
optional: when one is `null` the corresponding tile degrades from an embed to
a link-out and the site still builds, so no phase blocks on DNS.

| Host | Serves |
|---|---|
| `p9.fhnw-rover.ch` | this site |
| `n8n-demo.fhnw-rover.ch` | the n8n editor |
| `n8n-turtle.fhnw-rover.ch` | read-only turtlesim viewer + `/api/status` |
| `n8n-preview.fhnw-rover.ch` | data-less workflow-canvas renderer |
| `recap-demo.fhnw-rover.ch` | the PushT / RECAP demo |

The zone and the subdomain labels live in **`site.config.json`** at the repo
root — read by `src/config.ts` for page links, by `astro.config.mjs` for
canonical URLs and the sitemap, and by `deploy/` for the Caddy sites. Moving
the zone again is that one file, plus `BASE_DOMAIN` in `deploy/.env` — which
`deploy.sh` refuses to run while the two disagree.

The stack moved off `fhnw-rover.sacovo.ch`. The edge still answers on all five
old names with a permanent redirect to the matching host above, configured by
`LEGACY_DOMAIN` in `deploy/.env`. Retire it by withdrawing the old DNS records
first, then deleting that variable and the Caddyfile block it drives.

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

## The talk decks

Two Slidev decks live here, each an npm workspace of this repo:

| Workspace | URL | What |
|---|---|---|
| `presentation/` | `/smolvla-presentation/` | the SmolVLA + RECAP *Fachvortrag* |
| `defense/` | `/defense/` | the thesis defence — the whole project, 45 min |

`npm install` at the root installs the site and both decks together, and
`npm run build` runs `scripts/sync-deck.mjs` once per deck before `astro
build`, so one command produces the site with both already in it. Their output
under `public/` is generated and gitignored.

```bash
npm run dev:deck        # live Fachvortrag, press `p` for presenter mode
npm run dev:defense     # live defence deck
npm run build:decks     # both → public/
npm run export:defense  # → defense/dist/p9-defense.pdf
```

Neither deck is linked from the hero or the nav; each stands on its own at its
URL. See `defense/README.md` and `presentation/README.md` for the decks
themselves, and `src/components/Nav.astro` for the note about the missing link.

They are single-page apps, so `/defense/7` is a client route rather than a
file. The fallback to each deck's own index is stated three times, once per
host: `vercel.json`, `public/_redirects` and `deploy/Caddyfile`. Adding a deck
means adding it in all three, plus `DECKS` in `scripts/sync-deck.mjs` and the
smoke test in `.github/workflows/deploy.yml`.

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
