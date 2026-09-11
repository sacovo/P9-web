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

38 talk slides and 19 backup, in five parts, plus a cover, six dividers
and a closing slide — 65 in all. Every slide carries presenter notes, and the notes
on the dividers carry a **clock check**: where you should be at that point, and
what to drop first if you are late.

| Part | Talk slides | Reach it at |
|---|---:|---:|
| Opening — the rover, the panel, the questions, the contents | 4 | 0 min |
| 1 — the policy: SmolVLA, RECAP, SnapFlow, LIBERO with the rollout demo | 12 | 4 min |
| 2 — real time on the Jetson | 2 | 15 min |
| 3 — the workflow layer | 6 | 18 min |
| 4 — the agent, and the fine-tuned local model | 6 | 25 min |
| 5 — on the rover, the ERC, closing, and the demo | 8 | 32 min |

The parts follow the report's contributions rather than the order the system is
built in, so a reader of the report can map one onto the other. The deck is cut
to the two contributions the defence is actually about — the policy (parts 1–2)
and the workflow layer with its agent (parts 3–4). Everything else the report
contributes is **one line under the table of contents**: the approach phase (§3,
with its accuracy and its error budget), the four stopping layers (§2.1.4), the
layer map (§2.4) and the manipulator control. Their numbers live in that slide's
presenter notes, which are written to be read out as answers in the Q&A rather
than presented.

Part 1 was cut to its spine: the SmolVLA architecture diagram, the parameter
table, the critic slide and the f⁺ label figure are all in the appendix now, and
the rollout demo is folded into the LIBERO benchmark slide. The part-1 divider's
notes say which sentence to substitute for each, and which appendix slide to
jump to if the question comes.

The deck is paced for about 35 minutes and the live demo at the end is the other
two, which puts a full run at 37 — **inside the 45-minute ceiling** with room to
spare, and comfortably so without the demo. The designated cut if a part
overruns anyway is *Can guidance survive distillation?*, whose notes say as much;
dropping it costs no thesis-relevant claim, since the SnapFlow correction before
it carries the one that matters. That is also why the demo sits *after* the
conclusions: skipping it costs nothing either.

Four slides were dropped whose material survives only in presenter notes, so
look there rather than for a slide: *Why `long` regresses* (in the LIBERO
results notes), *The cycle closes* (in the part-2 divider notes), *Mechanical
tolerance beats control accuracy* (in the tool-change canvas notes), and *The
same recipe, on the arm* — whose dataset figure moved to *End to end, on the
arm* in part 5, where the talk is about what actually reached the rover.

Results are deliberately **not** re-created as slides *in the talk*. The
companion site carries the LIBERO rollouts, the workflow canvases, the datasets
and two browser demos, and the deck links to them (`p9.fhnw-rover.ch`). The
appendix is the exception: it carries the result tables most likely to be asked
for in the questions, one per slide, so an answer does not depend on the site
being reachable from the room.

There are two demos and they sit apart. The **policy** demo plays three LIBERO
rollouts through `Clip.vue` — one success per suite, from the deck's own
`public/videos` — and is folded into *The benchmark: LIBERO* in part 1, so the
suites are explained while the clips run and the results tables follow. That
slide keeps the `policy-demo` `routeAlias`, so `<Link to="policy-demo">` still
resolves. The **live** demo is a single slide at the end, after the conclusions,
and it is four **buttons** rather than a description —
click one and the site opens in a tab. Take the gallery first
(`/demos/rover/#workflows`), which renders its canvases from JSON and cannot
fail in the room; the live simulated rover is further up the same page and only
if the network cooperates. Check the site before the talk.

The buttons are `<a class="demo-btn">` with a `.demo-btn-title` and a
`.demo-btn-sub` span; `style.css` gives them the styleguide's hoverable card and
alternates the left rule black/yellow by `:nth-child`. Their targets are real
routes on the companion site, so they move when it does: `/demos/rover` with the
`#workflows` and `#drive` anchors, `/demos/pusht`, and `/#libero` on the front
page.

## Four ways this file breaks silently

Every one of these was hit while editing the deck, and only one of them errors.

1. **A separator needs a blank line after it.** `---` followed straight by
   content is parsed as the start of a YAML frontmatter block, and Slidev
   swallows the whole slide into the previous one — no error, the slide simply
   vanishes from the deck. Compare `npx slidev` output against your own count
   after any scripted edit.
2. **A markdown table in a column div followed by a sibling column** makes the
   Vue compiler report `Invalid end tag`. Write that table as raw `<table>`
   instead; `style.css` styles both identically.
3. **An inline `<svg>` needs its whole opening tag on one line.** `svg` is not
   in markdown-it's block-tag list, so it is recognised only by the rule that
   wants a complete tag alone on a line. Split it over two lines and the figure
   is parsed as prose, which surfaces as `Element is missing end tag`.
4. **SVG `font-size` attributes lose to the stylesheet.** Presentation
   attributes rank below every CSS rule, and the deck sets font sizes on
   elements, so text renders at heading size. Put `style="font-size:…"` on each
   `<text>`.

A fifth, harmless but confusing: `mt-*` on a `<p>` does nothing, because
`.slidev-layout p` (0,1,1) outranks the utility class (0,1,0). Wrap the
paragraph in a div and put the margin there.

Two canvases are not left to the site, though: the toolchanger slide and the
agent slide carry the real ones. See **The live canvases** below.

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
`components/Clip.vue` and `components/N8nCanvas.vue` are the cases in point.

## Layout

| Path | What |
|---|---|
| `slides.md` | the deck; presenter notes in the trailing `<!-- -->` of each slide |
| `style.css` | FHNW HSI styleguide, self-hosted Inter, print-safe |
| `global-top.vue` | logo + page number overlay (must be `-top`, not `-bottom`) |
| `components/Clip.vue` | LIBERO rollout video; falls back to its poster during export |
| `components/N8nCanvas.vue` | a real n8n canvas on the slide; falls back to a screenshot |
| `components/flowfield.ts` | the 2-D flow-matching example, in closed form |
| `components/FlowMatching.vue` | the sampler, animated one Euler step at a time |
| `components/Guidance.vue` | classifier-free guidance, as a scrubbable weight |
| `components/SnapFlow.vue` | the shortcut and its bootstrap, in four beats |
| `components/TrtPipeline.vue` | the TensorRT export path, walked by the slide's clicks |
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
  <br>Its **second scene**, behind the "training rounds" button, plays that
  argument out as training. Both maps are drawn as paths rather than endpoints,
  because that is what makes them different: the student is one straight
  segment (one forward pass, however good it gets) and the teacher is two,
  through its half-step. Each round the jump swings onto the chord, the two
  ends meet, and the teacher — recomputed on the improved model — is ahead
  again by half as much. The gaps it closes run
  1.09, 0.20, 0.11 while the student lands 0.34, 0.14, 0.02 from A, so
  consistency is re-established every round *and* what is left of it halves. It
  stops at three rounds: a fourth lands the student past A, which is correct
  (the fixed point is the exact integral, and ten steps is itself 0.10 short of
  it) but reads as a bug. A canvas can only print one scene, so the appendix
  carries a second copy with `scene="rounds"` for the PDF, followed by the
  slide answering why the target is two half-steps and not the ten-step solve.

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

## The export figure

The TensorRT slide does not import the report's figure — `TrtPipeline.vue`
draws it. The report's version is a TikZ export whose labels are glyph
outlines, and at the size a slide could give it (a three-fifths column) none of
them survived a projector. Drawn as SVG in the deck's own font it fills the
slide, scales with it, and stays sharp in the PDF.

Being an element rather than a picture buys the other half: the slide's own
clicks walk it (`clicks: 4` in that slide's frontmatter, read through
`useSlideContext().$clicks`), so the room gets one machine at a time — cluster,
export, build, and then the transfer that does not work — instead of the whole
graph at once. The buttons under it do the same thing by hand, for the
questions.

Like `SnapFlow`, it has two scenes and a printed page can only carry one. The
talk reaches the second — what the two engines contain — with the last click;
the appendix mounts a second copy with `scene="engines"` so the PDF has it too.

## The live canvases

The toolchanger and agent slides do not show pictures of an n8n canvas — they
show the canvas. `components/N8nCanvas.vue` mounts the same `<n8n-demo>` web component
the companion site's workflow gallery uses, fed the same export from
`../content/gallery.json`, so the graph on the slide is the workflow that runs
on the rover and it pans, zooms and opens a node under a double-click.

Three differences from the site's version, all of them because this is a talk:

- **It is never live in the PDF.** `useNav().isPrintMode` is the switch, exactly
  as in `Clip.vue`; export gets each slide's `fallback` screenshot
  (`toolchanger_workflow.png`, `n8n_ros2_agent.png`), which is why
  `sync_assets.sh` still copies them.
- **It boots a slide early and is dropped two slides on.** A whole n8n frontend
  takes a few seconds to come up, and the screenshot stays on top of it until
  the frontend's `n8nReady` handshake arrives, so the slide is never blank and
  never shows the boot. Nothing is left running behind the rest of the deck.
- **Unreachable is the same as print.** No probe is needed: the handshake is
  what removes the screenshot, and an iframe that cannot load never sends one.
  With no network in the room the slide is what it was before.

The renderer is `n8n-preview.fhnw-rover.ch`, the data-less instance, and the
host comes from `../site.config.json` — the same file `src/config.ts` reads, so
moving the zone stays one file. **`clicktointeract` matters here:** until the
canvas is clicked its iframe is `pointer-events: none` and cannot take focus,
so the arrow keys still page the deck. After clicking into it, click the slide
background again before paging on.

## Regenerating the figures

Nothing in `public/` is drawn here. Everything comes from the thesis repo
(`../../../P9-Mars-Rover-Autonomy` by default) or from the Fachvortrag next
door, so a figure has exactly one source:

```bash
./assets/render_charts.sh [path/to/P9-Mars-Rover-Autonomy]   # TikZ → SVG
./assets/sync_assets.sh   [path/to/P9-Mars-Rover-Autonomy]   # PNG, JPG, clips
```

Both scripts copy exactly what `slides.md` references and nothing else, so
adding a figure to a slide means adding it to the list. Four of the report's
figures are deliberately absent — `snapflow_shortcut`, `cfg_guidance`,
`tensorrt_pipeline` and the Fachvortrag's `fig_flow_steps_only` — because the
components above replaced them.

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
