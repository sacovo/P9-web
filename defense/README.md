# P9 — Mars Rover Autonomy — thesis defence

Slidev deck for the defence: 45 minutes of talk, 15–20 of questions, in English,
for the advisor and the expert — both of whom have the report — and written so
that someone who has not read it can still follow.

The deck is an npm **workspace of the site repo it is served from**, so one
`npm ci` at the repo root installs both, and `npm run build` produces the site
with the deck already inside it at `/defense/`. See `../README.md`.

It shares its chrome with the SmolVLA *Fachvortrag* in `../presentation/` —
`style.css`, `global-top.vue` and `components/Clip.vue` are copies, not
symlinks, so the two decks can drift apart without one breaking the other. The
figures are not copies: `assets/` pulls them from the two repositories that own
them.

## Structure

42 talk slides and 7 backup, in five parts, plus a cover, five dividers and a
closing slide — 57 in all. Every slide carries presenter notes, and the notes
on the dividers carry a **clock check**: where you should be at that point, and
what to drop first if you are late.

| Part | Talk slides | Reach it at |
|---|---:|---:|
| Opening — the task, the robot, the questions | 4 | 0 min |
| 1 — how the arm is commanded | 3 | 4 min |
| 2 — the policy: SmolVLA, RECAP, SnapFlow, TensorRT | 15 | 8 min |
| 3 — the workflow layer | 7 | 24 min |
| 4 — the agent, and the fine-tuned local model | 5 | 31 min |
| 5 — on the rover, closing, and the live demo | 8 | 38 min |

The deck is paced for 41 minutes and the live demo at the end is the other
three, so the 45-minute ceiling is met with the demo and comfortably beaten
without it. That is why the demo sits *after* the conclusions: skipping it
costs nothing.

Results are deliberately **not** re-created as slides. The companion site
carries the LIBERO rollouts, the workflow canvases, the datasets and two
browser demos, and the deck links to them (`p9.fhnw-rover.ch`). The final demo
slide links the two live n8n instances instead — the public simulator at
`n8n-demo.fhnw-rover.ch` and the rover's own at `172.16.10.121:5678`, which
only answers on the team network. Check both before the talk; the workflow
gallery on the companion site renders its canvases from JSON and needs no
instance at all, so it is the offline fallback.

## Usage

From this directory, after an `npm install` at the repo root:

```bash
npm run dev            # live deck, press `p` for presenter mode
npm run export         # → dist/p9-defense.pdf
npm run export:notes   # → dist/p9-speaker-notes.pdf
npm run build          # static site → dist/web
```

Or from the repo root, without changing directory:

```bash
npm run dev:defense       # the same live deck
npm run build:defense     # build it into ../public/defense/
npm run export:defense    # the PDF
```

PDF export needs a Chromium once: `npx playwright install chromium`.

To review the layout without opening a browser, export one PNG per slide —
this is what catches a takeaway box running into the footer:

```bash
npx slidev export --format png --output dist/png
```

Served from a sub-path rather than a domain root, the deck needs the matching
`--base`, or every asset in it 404s. `../scripts/sync-deck.mjs` is what passes
it; anything that builds an asset URL at runtime has to prefix
`import.meta.env.BASE_URL` itself, since Vite only rewrites the static ones.
`components/Clip.vue` is the case in point.

## Layout

| Path | What |
|---|---|
| `slides.md` | the deck; presenter notes in the trailing `<!-- -->` of each slide |
| `style.css` | FHNW HSI styleguide, self-hosted Inter, print-safe |
| `global-top.vue` | logo + page number overlay (must be `-top`, not `-bottom`) |
| `components/Clip.vue` | LIBERO rollout video; falls back to its poster during export |
| `components/flowfield.ts` | the 2-D flow-matching example, in closed form |
| `components/FlowMatching.vue` | the sampler, animated one Euler step at a time |
| `components/Guidance.vue` | classifier-free guidance, as a scrubbable weight |
| `components/SnapFlow.vue` | the shortcut and its bootstrap, in four beats |
| `assets/render_charts.sh` | renders the report's TikZ figures to SVG |
| `assets/sync_assets.sh` | copies the raster figures and photographs in |
| `assets/*.tex` | the two figures the report draws inline, lifted verbatim |

## The three animated figures

Flow matching, classifier-free guidance and the SnapFlow shortcut are the ideas
in the deck that a still image explains badly, so they are drawn live on a
`<canvas>` instead:

- **`FlowMatching`** (flow-matching slide) integrates the sampler one Euler step
  at a time, holding the field at the τ each step is taken from and redrawing it
  when the step advances. That is the point a static figure cannot make — the
  sampler integrates a *different* field at every step, and the two behaviour
  modes only separate near the end. The step-count control is the other half of
  the argument: at **1** every sample lands exactly on the mean of the two modes,
  which is where a direct regression would have had to predict.
- **`Guidance`** (threshold-and-guidance slide) sweeps *w* from 0 to 2 and
  redraws the whole bundle, so the endpoints walk from both modes, to the
  positive one, to past its centre. The inset decomposes the formula at one
  probe point: the guided velocity is a point on the line through the tips of
  `v_unc` and `v_pos`, and the line turns yellow past the `v_pos` tip, where
  there is no data behind it.
- **`SnapFlow`** (distillation slide) builds the shortcut in four beats — the
  ten-step integration, one Euler step missing badly, the teacher's two
  half-steps averaged into a chord, and then the 4- and 8-step paths closing on
  the ten-step curve. Beat 4 draws whole *paths* rather than endpoints on
  purpose: past two steps the endpoints land 26, 11 and 2 px from A at this
  scale and collapse into one illegible clump, while the paths stay distinct
  the whole way along. The beat buttons walk it by hand. Beat 3 shows an
  identity rather than an approximation: one jump along the averaged chord
  lands *exactly* where two half-steps land, which is why the same point is
  labelled both "one jump" and "= 2 steps". Beat 4 is the answer to "how can it
  teach itself without going in circles" — here the distance to the ten-step
  endpoint falls 1.39, 0.34, 0.14, 0.02, monotonically and for every sample
  tried, so each round's target really is ahead of the student.

None of them is an impression of the maths. The data distribution is a Gaussian
mixture with a shared variance, which puts the exact marginal velocity field in
closed form, so every arrow is the field a perfectly trained action expert would
have learned; `flowfield.ts` carries the derivation. The one-step result is
arithmetic rather than a drawing: at τ = 0 the field is the mean minus the
sample, so one full step of it cancels the sample and leaves the mean.

**Resolution.** A Slidev slide is laid out at a fixed logical width (980 px) and
then CSS-scaled to whatever it is shown or exported at, so a canvas is painted
across roughly twice the device pixels it asks for. Sizing the backing store
from `devicePixelRatio` alone therefore hands the browser a half-resolution
image to upscale, and the figures land soft on a projector and in the PDF.
`prepare()` measures `getBoundingClientRect()` instead — that reports the size
*after* the transform — and oversamples by exactly that ratio, recomputed every
draw. Under export there is no draw loop to catch the final layout, and a CSS
transform on an ancestor never fires a `ResizeObserver`, so `settle()` polls the
transformed rect for a second and redraws whenever it changes.

All three pause themselves through an `IntersectionObserver` when their slide is
off screen — every slide in a Slidev deck is mounted at once, so a bare
`requestAnimationFrame` loop per figure would run the whole deck forever. Under
`slidev export` there is nothing to animate, so each falls back to a still: the
finished trajectories for the sampler, and the three weights overlaid for the
guidance sweep.

## Regenerating the figures

Nothing in `public/` is drawn here. Everything comes from the thesis repo
(`../../../P9-Mars-Rover-Autonomy` by default) or from the Fachvortrag next
door, so a figure has exactly one source:

```bash
./assets/render_charts.sh [path/to/P9-Mars-Rover-Autonomy]   # TikZ → SVG
./assets/sync_assets.sh   [path/to/P9-Mars-Rover-Autonomy]   # PNG, JPG, clips
```

Both scripts copy exactly what `slides.md` references and nothing else, so
adding a figure to a slide means adding it to the list. Three of the report's
figures are deliberately absent — `snapflow_shortcut`, `cfg_guidance` and the
Fachvortrag's `fig_flow_steps_only` — because the animated components above
replaced them.

`render_charts.sh` needs a TeX installation with `standalone` and `tikz`; it
wraps each `charts/*.tex` fragment in a preamble that repeats main.tex's
libraries and its Okabe-Ito `fig*` colours, so a figure here and the same
figure in the report are the same drawing. `sync_assets.sh` needs ImageMagick,
and downscales the photographs to 1600 px on the long edge.

Two figures — the advantage-conditioning concept and the policy architecture —
are drawn inline in the report's theory chapter rather than in `charts/`, so
their `tikzpicture` bodies are copied into `assets/`. If either changes in the
report, copy it again.

## Colour

Slide chrome follows the [FHNW HSI
styleguide](https://web0.fhnw.ch/ht/informatik/styleguide-grid.html): black on
white, `#fde70e` as the only accent, greys `#f1f1ee` / `#deded9` / `#767573`,
Inter.

The figures deliberately do not: `#fde70e` has far too little contrast on white
to carry a data mark. The report's charts use the Okabe-Ito palette and the
Fachvortrag's use a separately validated categorical one, which is why the
charts look different from the slide furniture — and different from each other.
