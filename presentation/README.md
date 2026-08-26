# Enhancing SmolVLA with Reinforcement Learning — Fachvortrag

Slidev deck for the 45-minute technical talk (English, CS audience without a
robotics background). Slide order started from `RECAP x SmolVLA.pptx`; content
and numbers come from `smolvla-rl/paper/main.tex` and
`smolvla-rl/docs/presentation_outline.md` in the sibling research repo — the
`References` slide is the paper's own bibliography, trimmed to the six papers
the talk stands on.

The deck is an npm **workspace of the site repo it is served from**, so one
`npm ci` at the repo root installs both and `npm run build` produces the site
with the deck already inside it. See `../README.md`.

Part 1 introduces flow matching before RECAP, so the pipeline diagram lands on an
audience that already knows what the action expert is. Part 2 then runs
critic → labels → policy → inference cost: the three critic slides together
(what it predicts, pessimism on failures, state dropout — the last two both
being bugs we hit and the paper does not mention), then advantage labelling and
f⁺, then the policy side (knowledge insulation and FAST+), then the
inference-cost work last (SnapFlow distillation, then guidance baking), so the
two distillation topics sit next to each other — guidance baking reuses the
SnapFlow loop and is where that loop fails.

35 talk slides + 6 backup slides. Every slide carries presenter notes.

Time budget: 45 minutes is a hard ceiling on the talk itself, questions on top;
the deck is paced for ~40, and 38 is comfortable. The method slides in parts 1
and 2 go deeper than the paper does — flow-matching training objective, what
SnapFlow adds to the network and how it self-distils, and the FAST+ tokenizer
behind the knowledge-insulation AR loss. The clock check on the part 3 divider
names which of them to drop first if the talk runs long.

## Usage

From this directory, after an `npm install` at the repo root:

```bash
npm run dev            # live deck, press `p` for presenter mode
npm run export         # → dist/smolvla-presentation.pdf
npm run export:notes   # → dist/smolvla-speaker-notes.pdf
npm run build          # static site → dist/build
```

Or from the repo root, without changing directory:

```bash
npm run dev:deck       # the same live deck
npm run build:deck     # build it into ../public/smolvla-presentation/
npm run export:deck    # the PDF
```

PDF export needs a Chromium once: `npx playwright install chromium`.

Served from a sub-path rather than a domain root, the deck needs the matching
`--base`, or every asset in it 404s:

```bash
npx slidev build --base /smolvla-presentation/ --out dist/web
```

That is what `../scripts/sync-deck.mjs` runs to build the deck into the thesis
site at `/smolvla-presentation/`. Its output under `../public/` is generated and
gitignored, not committed. Anything that builds an asset URL at
runtime has to prefix `import.meta.env.BASE_URL` itself — Vite only rewrites
the static ones. `components/Clip.vue` is the case in point.

## Layout

| Path | What |
|---|---|
| `slides.md` | the deck; presenter notes live in the trailing `<!-- -->` of each slide |
| `style.css` | FHNW HSI styleguide, self-hosted Inter, print-safe |
| `global-top.vue` | logo + page number overlay (must be `-top`, not `-bottom`) |
| `components/Clip.vue` | rollout video; falls back to its poster during export |
| `assets/make_assets.py` | regenerates the figures in `public/figs/` |
| `assets/pipeline.tex` | the two-round loop → `public/figs/pipeline.svg` |
| `assets/vla_loop.tex` | the VLA control loop, same TikZ style → `public/figs/vla_loop.svg` |
| `assets/extract_dropout_traces.py` | recovers the gripper/critic traces for the state-dropout slide |

## Regenerating assets

Figures (uses the paper's own data and the `smolvla-rl` venv, which lives in
the sibling research repo — these are the only steps that still need it):

```bash
../../smolvla-rl/.venv/bin/python assets/make_assets.py
```

Pipeline diagram:

```bash
cd assets
for f in pipeline vla_loop; do
  pdflatex "$f.tex" && pdftocairo -svg "$f.pdf" "../public/figs/$f.svg"
done
```

State-dropout traces (run before `make_assets.py`; writes `dropout_traces.npz`):

```bash
../../smolvla-rl/.venv/bin/python assets/extract_dropout_traces.py
```

The arrays behind `outputs/plots_dropout/` were never saved and re-running the
critic needs a GPU plus the checkpoint, so the gripper and value curves are read
back out of the rendered PNGs. Both axes are calibrated from their own tick
marks, so the frame indices in the two panels are genuinely comparable — that is
what lets the slide state the coincidence numerically (gripper at 58.7 / 109.3,
value jumps at 58.6 / 109.5) rather than just asserting it. If the critic is ever
re-run with the arrays saved, replace this step with the real data.

Videos are re-encoded from `../../smolvla-rl/analysis_videos` at half speed and
512×512, with a poster frame grabbed at 93 % of the episode so the PDF shows the
*outcome* rather than an arbitrary mid-playback frame.

## Colour

Slide chrome follows the [FHNW HSI
styleguide](https://web0.fhnw.ch/ht/informatik/styleguide-grid.html): black on
white, `#fde70e` as the only accent, greys `#f1f1ee` / `#deded9` / `#767573`,
Inter.

Chart colours deliberately do **not**: `#fde70e` has far too little contrast on
white to carry a data mark. The figures use a separately validated categorical
palette (blue `#2a78d6`, orange `#eb6834`, red `#e34948`, ordinal blue ramp),
which is why the charts look different from the slide furniture.
