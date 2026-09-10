# P9-web — plan

A static companion site for the master's thesis *P9 — Mars Rover Autonomy*
(Sandro Covo, FHNW). It carries a short project overview and, mainly, the
things a PDF cannot: the live n8n/ROS 2 rover demo and the browser-native
PushT policy demo.

Decisions already taken: Astro + Tailwind v4; noVNC embedded with links to
n8n; PushT deployed separately and embedded; content beyond the overview is
the report download + figures, the workflow gallery, and the agent chat /
self-documenting manual. No dedicated code/repo index section — repos are
linked inline where they are relevant.

---

## 1. Repo setup

`P9-web/` is currently empty and not a git repo.

- `git init`; Astro 5 + `@tailwindcss/vite` + `@astrojs/sitemap`, Node 20+,
  static output — the same shape as `fhnw-mars-rover-website`, minus `gsap`
  and `lenis` (see §2, deviations).
- `vercel.json` + `public/_headers` mirrored from the rover site so Vercel and
  Cloudflare Pages behave identically.
- `content/p9-content.json`, typed by `src/lib/p9.ts` — the rover site's
  pattern: one JSON file the whole site renders from, so copy edits are not
  code edits.
- **`src/config.ts` holds every external URL** (§1.1). Each is optional; when
  one is unset the corresponding tile degrades from an embed to a link-out
  card and the site still builds, so no phase blocks on DNS.

## 1.1 Hosts

| Host | Serves | Where |
|---|---|---|
| `p9-sacovo.fhnw-rover.ch` | the thesis site | Vercel or Cloudflare Pages, static |
| `n8n-demo.fhnw-rover.ch` | the n8n editor (owner login) | demo box, Caddy → `n8n:5678` |
| `n8n-turtle.fhnw-rover.ch` | read-only turtlesim viewer + `/api/status` | demo box, Caddy → `ros2:6080` / `ros2:8081` |
| `n8n-preview.fhnw-rover.ch` | data-less workflow-canvas renderer (§6.1) | demo box, second n8n container |
| `recap-demo.fhnw-rover.ch` | the PushT / RECAP demo | Caddy on the p9 box, static; weights from the HF Hub |

`n8n-turtle` replaces the `robot.example.org` placeholder in
`demo/.env.example`; `VIEWER_DOMAIN` and `N8N_DOMAIN` get set accordingly.

## 2. Design system — FHNW styleguide as the base, rover site as the structure

I pulled the real stylesheets (`style.css`, `font.css`, `color.css`,
`grid.css` from `web0.fhnw.ch/ht/informatik/css/`) rather than working from
the rendered manual pages. The tokens below are verbatim from them.

### Tokens → `@theme`

| Token | Value | Role |
|---|---|---|
| `--color-fhnw-yellow` | `#fde70e` | the one saturated accent: link underlines, button hover, active states |
| `--color-black` | `#000` | text, borders, button fill |
| `--color-grey-1` | `#f1f1ee` | panel fill, blockquote, hover fill |
| `--color-grey-2` | `#deded9` | section rules (`h2.border`), footer text |
| `--color-grey-3` | `#767573` | secondary text, captions |
| `--font-body` | Inter 300/400/500/600/700 | everything |
| `--font-display` | Bricolage Grotesque | `h1` / hero only |
| `--font-mono` | Courier New | `pre`, `code` — the styleguide's own choice |

Inter is already the rover site's body face, so the two sites share type.

### Layout

FHNW's 12-column grid, reproduced as Tailwind utilities rather than by
importing `grid.css`: container `98%` → `90%` above 981px, `max-width:1280px`,
`--pad: 20px` gutters, breakpoints at **601px** and **981px** (note: not
Tailwind's defaults — override `--breakpoint-*`).

### Component vocabulary lifted from the styleguide

- links: black, `border-bottom: 3px solid #fde70e` → black on hover
- buttons: black fill, white uppercase text, `.5px` tracking, `0.8rem`;
  hover flips to yellow-on-black
- `.hoverable`: `box-shadow: 3px 3px 0 #000` + `1px solid black` on hover —
  the site's signature interaction, used on every demo tile and figure
- `ul.keyterms`: hairline-ruled two-column definition list. This is the right
  home for the ROS interface tables (topic/service/action → description).
- `h2.border` / `h3.border`: `3px solid #deded9` rule, `margin-top: 80px`
- type scale: `h1` 2rem→2.2rem/600, `h2` 1.4→1.6rem/400, `h3` 1.5rem/600,
  `h4` 1rem/600, `p` line-height 180%

### What is taken from the rover site, and what is deliberately dropped

Kept: eyebrow kickers, tabular-figure readouts, restrained corner brackets
(black, not gold), hairline section rules, scroll-reveal, the
instrument-panel information density.

Dropped, because the brief is "more formal": the dark `#0e0b09` ground, film
grain, the footer marquee, GSAP + Lenis smooth-scroll, and the Instrument
Serif italic accent. One display face, on `h1` only.

The result is a light, flat, black-on-white FHNW page that still reads as
mission-control in its structure.

## 3. Site map

```
/                     overview, contributions, demo tiles, report, figures
/demos/rover          turtlesim live view, interfaces, workflow gallery, agent
/demos/pusht          embedded PushT demo
```

## 4. `/` — the overview

Short on purpose; the report carries the detail.

- Hero: title, one-line framing, the rover photograph (`imgs/XT308242.JPG`),
  a "Download the report (PDF)" button.
- Two paragraphs distilled from the abstract, then the **six contributions**
  as a `s12 m6 l4` card grid (SmolVLA + RL post-training; n8n↔ROS 2 workflow
  automation and the on-board agent; TensorRT on the Jetson Orin; depth
  sensing into the policy state; the C++ visual-servoing approach phase;
  weighted Cartesian control behind heartbeat + latching e-stop).
- Two large demo tiles linking to `/demos/rover` and `/demos/pusht`.
- A short results readout strip, and the figure gallery (§8).

## 5. `/demos/rover` — the live n8n demo

### Live view

- `<iframe>` of `https://n8n-turtle.fhnw-rover.ch`, `aspect-square`, max
  720px, matching what
  `demo/ros2/web/index.html` already does — but wrapped in FHNW chrome.
- **HUD tiles** polling `https://n8n-turtle.fhnw-rover.ch/api/status` every 2s: state,
  battery (with the 25% low threshold marked), charging, e-stop, LED colour,
  target waypoint, pose, uptime. The rover's status server already sends
  `Access-Control-Allow-Origin: *`, so **the HUD needs no server change** and
  works cross-origin today.
- Copy stating why this is safe to expose: `x11vnc -viewonly`, rosbridge bound
  to `127.0.0.1` only, the read-only n8n credential, hourly reset.

### Required change in `n8n-nodes-ros2/demo/Caddyfile`

The viewer site currently sends `X-Frame-Options SAMEORIGIN`, which blocks the
iframe from any other origin. `X-Frame-Options` has no allow-list that current
browsers honour, so the fix is CSP:

```diff
   header {
-    X-Frame-Options SAMEORIGIN
+    Content-Security-Policy "frame-ancestors 'self' https://p9-sacovo.fhnw-rover.ch"
     X-Content-Type-Options nosniff
     Referrer-Policy no-referrer
   }
```

One line, and it stays a deny-by-default allow-list. The page ships a load
detector regardless: if the frame does not report ready within a few seconds,
it swaps itself for an "Open the live view" card, so a stale header degrades
rather than shows a blank box.

### Interfaces

The two actions, five services, four topics and the six landmarks, rendered
as `ul.keyterms` lists from a JSON file generated at build time from
`demo/ros2/rover_interfaces/` and the demo README tables — so the page cannot
drift from the robot. This is also where the two points that repo calls out
belong: custom nested types discovered at runtime, and the latched `/desc`
self-documentation convention.

### Actions a visitor can take

Buttons to: open the n8n editor, open the public `form/drive-rover` form,
fetch `webhook/rover-snapshot` and show the returned JPEG inline, and open the
generated operator manual.

## 6. Workflow gallery

The eleven demo workflows, each as a **live n8n canvas** rather than a
screenshot, using `@n8n_io/n8n-demo-component` (Lit web component, latest
1.0.20).

- Build-time script `scripts/import-workflows.mjs` reads
  `demo/workflows/*.json` → name, node types used, node/connection counts,
  which ROS interfaces each touches → `content/workflows.json`. The raw JSON
  is emitted alongside and handed to the component as its `workflow` prop.
- Each of the eleven gets a card: the README's "shows off" line, the ROS
  interfaces it uses, and the canvas. Workflow 11 is marked *inactive on
  purpose* with the reason (it races workflow 02).
- Props that matter here:

  ```html
  <n8n-demo
    src="https://n8n-preview.fhnw-rover.ch/workflows/demo"
    theme="light"
    frame="true"            <!-- adds the JSON + copy button: a visitor can
                                 import the workflow into their own n8n -->
    clicktointeract="true"  <!-- canvas does not swallow page scroll until
                                 clicked; this is what makes a page of eleven
                                 canvases actually scrollable -->
    collapseformobile="true"
    workflow="…encodeURIComponent(json)…"
  ></n8n-demo>
  ```

- The component is a Lit element with shadow DOM, so FHNW styling neither
  leaks in nor is needed; `theme="light"` keeps the canvas from fighting the
  page. Load it in an Astro island (`client:visible`) so eleven iframes are
  not created on first paint.
- Keep the SVG node-graph renderer as the no-JS / renderer-down fallback, and
  drop the manual screenshot pass — it is no longer needed. The report's
  `imgs/n8n_drill.png`, `imgs/toolchanger_workflow.png` and
  `imgs/n8n_ros2_agent.png` cover the *rover* workflows and stay in the figure
  gallery on `/`.

### 6.1 Why a second n8n container, and not the live one

The component renders into an iframe pointing at an n8n frontend's
`/workflows/demo` route. That route exists in self-hosted n8n
(`packages/frontend/editor-ui/src/app/router.ts:466`) but is behind
`middleware: ['authenticated']`, bypassed only when `settingsStore.isPreviewMode`
is true — which comes from `N8N_PREVIEW_MODE=true` on the server.

**That flag must not be set on `n8n-demo.fhnw-rover.ch`.** It does two other
things on the same instance:

- `packages/cli/src/server.ts:409` — `xFrameOptions: isPreviewMode ? false : {action:'sameorigin'}`.
  The whole editor becomes framable by any origin, which is clickjacking
  against a logged-in owner.
- `packages/cli/src/services/frontend.service.ts:170` — `getShowSetupOnFirstLoad`
  returns false, skipping the owner-setup redirect. The demo README already
  warns that an unclaimed n8n can be claimed by whoever reaches it first.

It also skips auth on routes marked `allowSkipPreviewAuth` (currently
`/rest/settings` and community-node-types) — narrow today, but it is an
instance-wide switch on the instance that holds the credentials and drives
the robot.

So: a **second n8n container on the same box**, `N8N_PREVIEW_MODE=true`, no
credentials, no imported workflows, a throwaway database, published at
`n8n-preview.fhnw-rover.ch`. The workflow JSON is postMessaged in from the
visitor's page, so this instance never needs any data of its own. It renders
canvases and nothing else.

Fallback, one config line away: the component's default `src`
(`n8n-preview-service.internal.n8n.cloud`). I verified it is live, serves the
editor SPA and sends no `X-Frame-Options`. Fine as a stopgap; not something a
thesis page should depend on long-term.

## 7. Agent chat and the self-documenting manual

- Embed the public chat (`/webhook/rover-chat/chat`, workflow 07) — either
  n8n's `@n8n/chat` widget or an iframe of the hosted chat page.
- **Click-to-activate**, not auto-loaded. The chat trigger is public and every
  message spends model tokens; a crawler or an idle tab should not. Pair with
  a spend cap on the key. The page says plainly that it is public and drives a
  real (simulated) robot.
- The operator manual (`/webhook/rover-manual`, workflow 10) is fetched
  client-side and rendered in a panel. Fetching it live rather than baking it
  in is the whole point — it is written from the graph as it exists now.

## 8. Report and figures

- PDF: build in the report repo (`make` → `build/main.pdf`) and copy into
  `public/` as an explicit release step, or link a GitHub release asset on
  `sacovo/P9-Mars-Rover-Autonomy`. Not a submodule, not a build-time LaTeX run.
- Figure selection (lightboxed, captioned, each linking to its report section):
  the n8n drill and tool-change canvases, the ROS 2 agent, the LIBERO
  filmstrips, the latency plots, the cloud-vs-finetuned agent vision pair, the
  dataset samples.
- Lightbox: reimplement FHNW's `.materialboxed` behaviour as a small Astro
  component. Do not import their `main.js`.

## 9. `/demos/pusht`

**Built.** `PushtEmbed.astro` plus the page around it.

- Full-bleed iframe of `https://recap-demo.fhnw-rover.ch/?embed=1`, plus an
  "open standalone" link. Full bleed rather than the page column because the
  demo's stage is two columns above ~950 px and one below: inside the shell it
  would drop to the tall single-column layout on screens that did not need to.
- **Click to activate.** The demo starts two workers on load and the real
  policy pulls 1.58 GB; neither should happen because someone scrolled past.
  The poster carries the precheck — `navigator.gpu.requestAdapter()` rather
  than just `navigator.gpu`, since Linux browsers ship the object behind a flag
  that yields no adapter — and the download size, weighed off the export rather
  than remembered. (The ~500 MB in the first draft was wrong by 3x.)
- **Height by postMessage.** 1414 px of content at 1024 px wide against
  3054 px below 950 px, so no fixed height works. `?embed=1` makes the demo
  post its own height (`main.ts`, `reportHeightToParent`) and the wrapper
  resizes to it. Scrolling stays enabled inside the frame so a dropped message
  degrades to an inner scrollbar rather than to clipped content.
- The measured numbers around the frame are read from
  `content/pusht-scenarios.json`, which `scripts/sync-pusht-scenarios.mjs`
  derives from `web/src/ui/scenarios.json` **and** the `parity_eval.py` outputs
  — the guidance sweep is in neither the demo's JSON nor its prose in a form
  that could be read, which is how that prose came to be quoting round 4 while
  the page served round 6. Nothing on the page is typed by hand.
- The prerequisite `frame-ancestors` grant is in `deploy/Caddyfile`; the demo
  cannot be framed from anywhere else, including localhost, so this page can
  only be checked against the deployed demo.
- The restyle of `pusht-web-demo/web/src/style.css` to the FHNW tokens is done
  in that repo — ported values, not an import, since it is a canvas app with no
  framework. Exactly the reskin-without-touching-the-app its AGENTS.md
  anticipated.

## 9.1 Repository links

Linked inline where each is relevant (no separate index section), on
`gitlab.fhnw.ch/fhnw-rover/…`:

| Repo | Path | Referenced from |
|---|---|---|
| n8n ROS 2 nodes + the demo | `autonomy/n8n-nodes-ros2` | `/demos/rover`, workflow gallery |
| rover autonomy stack | `autonomy/ros-fhnw-autonomy` | overview, TensorRT / servoing |
| SmolVLA + RECAP training | `autonomy/smolvla-rl` | overview, `/demos/pusht` |
| agent finetune | `autonomy/n8n-agent-finetune` | the on-board agent |
| rosbridge deployment | `ros-fhnw-rosbridge` | `/demos/rover` |
| PushT demo | *(needs a remote — see §11)* | `/demos/pusht` |

The rosapi fork the demo builds from is `github.com/sacovo/rosbridge_suite`
(branch `fhnw/rosapi-fixes`) and the thesis source is
`github.com/sacovo/P9-Mars-Rover-Autonomy` — both already public on GitHub, so
they are linked there rather than on GitLab.

**Check before launch:** these GitLab projects need to be public (or at least
visible to whoever reads the thesis), otherwise every link is a login wall.

## 10. Deployment

Static build to Vercel or Cloudflare Pages, `site:` set before the first
production build so canonical URLs and the sitemap are right. If the P9 site
sets its own CSP, `frame-src` must allow the viewer and PushT origins.

## 11. Open items

Resolved since the first draft: all four hosts are named (§1.1), the workflow
canvases are live rather than screenshots (§6), and the repo links are settled
(§9.1).

Remaining:

1. **DNS + Caddy.** Four A/AAAA records; two new Caddy sites on the demo box
   (`n8n-turtle`, `n8n-preview`) and the `frame-ancestors` change on the
   viewer (§5).
2. **`pusht-web-demo` has no git remote configured at all** — `git remote -v`
   is empty. It needs one before its source can be linked; the "The source"
   card on `/demos/pusht` degrades to a disabled tile until then. The demo
   itself deploys from the local checkout and does not need one.
3. **GitLab project visibility** (§9.1).
4. **Model-key spend cap** before the agent chat goes on the page (§7).
5. The rover team's own workflow canvases are labelled in German; the site is
   in English and will say so in those captions.

## 12. Build order

| Phase | Contents | Blocked on |
|---|---|---|
| 1 | Scaffold, design system, `/`, report + figures | nothing — ships standalone |
| 2 | Workflow gallery + `/demos/rover` interface tables, demos as link-outs | `n8n-preview` container |
| 3 | Live viewer embed, HUD, snapshot, operator manual | DNS + the Caddy changes |
| 4 | Agent chat, click-to-activate | model-key spend cap |
| 5 | `/demos/pusht` + restyle of that demo's stylesheet | done — PushT M5 shipped 2026-08-28 |
