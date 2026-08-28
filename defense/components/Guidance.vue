<!--
  Classifier-free guidance, as a scrubbable weight.

  The same 2-D example as FlowMatching.vue, with the two modes now standing for
  the two advantage labels. Sliding w walks the whole bundle of trajectories
  from "both behaviours survive" (w = 0, the unconditioned field) through "the
  positive one" (w = 1) and then past it (w > 1) — which is the part worth
  seeing move, because "extrapolates beyond the data" is hard to believe from a
  formula and obvious from a picture.

  The inset makes the formula literal at one probe point: the guided velocity
  is a point on the line through the tips of v_unc and v_pos, and w is how far
  along that line it sits. Past the v_pos tip the line is drawn in the accent
  colour, because that is the regime with no data behind it.

  During `slidev export` the sweep is replaced by three overlaid bundles at
  w = 0, 1 and 2, which is the static figure this animation replaces.
-->
<script setup>
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import { useNav } from '@slidev/client'
import {
  BLUE, DIM, INK, NEG, POS, RED, RULE, YELLOW,
  arrow, drawField, drawMode, guided, hexToRgba, integrate, label, makeView, settle, noiseSamples, prepare,
} from './flowfield'

const props = defineProps({
  width: { type: Number, default: 560 },
  height: { type: Number, default: 300 },
  particles: { type: Number, default: 26 },
  steps: { type: Number, default: 24 },
  /** Seconds for one sweep of w from 0 to 2. */
  sweepMs: { type: Number, default: 5200 },
})

const { isPrintMode } = useNav()

const canvas = ref(null)
const w = ref(1)
const playing = ref(true)
const noise = noiseSamples(props.particles, 11)

/** The probe point the inset decomposes the velocity at, and its tau. */
const PROBE = [0.45, 0.1]
const PROBE_TAU = 0.5

const bundle = shallowRef([])
watch(w, build, { immediate: true })
function build() {
  const g = (x, y, tau) => guided(x, y, tau, w.value)
  bundle.value = noise.map(([x, y]) => integrate(x, y, props.steps, g))
}

function caption(v) {
  if (v < 0.05) return 'unconditioned — both behaviours survive'
  if (v < 0.95) return 'interpolating towards the positive conditional'
  if (v < 1.05) return 'the positive conditional exactly — one forward pass'
  return 'past the positive mode: tighter, and pushed off its centre'
}

let raf = 0
let last = 0
let dir = 1
function frame(t) {
  raf = requestAnimationFrame(frame)
  const dt = last ? Math.min(t - last, 64) : 0
  last = t
  if (playing.value) {
    let v = w.value + (dir * 2 * dt) / props.sweepMs
    if (v > 2) { v = 2; dir = -1 }
    if (v < 0) { v = 0; dir = 1 }
    w.value = Math.round(v * 200) / 200
  }
  draw()
}

function drawBundle(ctx, view, paths, colour, width, alpha, traces = true) {
  if (traces) {
    ctx.lineWidth = width
    ctx.strokeStyle = hexToRgba(colour, alpha)
    for (const p of paths) {
      ctx.beginPath()
      ctx.moveTo(view.toX(p[0][0]), view.toY(p[0][1]))
      for (let i = 1; i < p.length; i++) ctx.lineTo(view.toX(p[i][0]), view.toY(p[i][1]))
      ctx.stroke()
    }
  }
  ctx.fillStyle = hexToRgba(colour, Math.min(alpha + 0.25, 1))
  for (const p of paths) {
    const e = p[p.length - 1]
    ctx.beginPath()
    ctx.arc(view.toX(e[0]), view.toY(e[1]), 2.6, 0, 2 * Math.PI)
    ctx.fill()
  }
}

/**
 * Where the endpoints sit on average, against the centre of the positive mode.
 *
 * Guidance at w > 1 both tightens the cloud and lifts it off that centre, and
 * the lift is about 0.7 sigma at w = 2 — real, but far too small to read
 * without something to read it against. Hence the dotted line and the cross.
 */
function drawEndpointMean(ctx, view, paths, colour) {
  let sx = 0
  let sy = 0
  for (const p of paths) {
    sx += p[p.length - 1][0]
    sy += p[p.length - 1][1]
  }
  const mx = view.toX(sx / paths.length)
  const my = view.toY(sy / paths.length)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4.5
  ctx.beginPath()
  ctx.moveTo(mx - 8, my); ctx.lineTo(mx + 8, my)
  ctx.moveTo(mx, my - 8); ctx.lineTo(mx, my + 8)
  ctx.stroke()
  ctx.strokeStyle = colour
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(mx - 8, my); ctx.lineTo(mx + 8, my)
  ctx.moveTo(mx, my - 8); ctx.lineTo(mx, my + 8)
  ctx.stroke()
}

/** Enough white behind the legend that the trajectories do not read through it. */
function legendPanel(ctx, w, h) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
  ctx.fillRect(8, 118, w, h)
}

/** The centre of the positive mode, as the line the endpoints are read against. */
function drawReference(ctx, view, w) {
  const y = view.toY(POS.y)
  ctx.setLineDash([4, 3])
  ctx.lineWidth = 1
  ctx.strokeStyle = hexToRgba(BLUE, 0.85)
  ctx.beginPath()
  ctx.moveTo(view.toX(POS.x - 1.5), y)
  ctx.lineTo(w - 6, y)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawInset(ctx, view, weight) {
  const [px, py] = PROBE
  const u = guided(px, py, PROBE_TAU, 0)
  const g = guided(px, py, PROBE_TAU, 1)
  const v = [u[0] + weight * (g[0] - u[0]), u[1] + weight * (g[1] - u[1])]

  const bw = 132
  const bh = 104
  const bx = 8
  // Top-left: the trajectories fan from the lower left to the right, so this
  // is the only corner the bundle never crosses at any weight.
  const by = 8
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.fillRect(bx, by, bw, bh)
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1)

  // Its own scale: the vectors are compared with each other, not with the plane.
  const ox = bx + 22
  const oy = by + bh - 26
  const k = 20
  const X = (a) => ox + a[0] * k
  const Y = (a) => oy - a[1] * k

  // The line the guided velocity slides along, and the half of it beyond v_pos.
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.strokeStyle = hexToRgba(DIM, 0.8)
  ctx.beginPath(); ctx.moveTo(X(u), Y(u)); ctx.lineTo(X(g), Y(g)); ctx.stroke()
  ctx.strokeStyle = '#c9a800'
  const far = [u[0] + 2 * (g[0] - u[0]), u[1] + 2 * (g[1] - u[1])]
  ctx.beginPath(); ctx.moveTo(X(g), Y(g)); ctx.lineTo(X(far), Y(far)); ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = DIM; ctx.fillStyle = DIM
  arrow(ctx, ox, oy, X(u), Y(u), 4)
  ctx.strokeStyle = BLUE; ctx.fillStyle = BLUE
  arrow(ctx, ox, oy, X(g), Y(g), 4)
  ctx.lineWidth = 1.8
  ctx.strokeStyle = INK; ctx.fillStyle = INK
  arrow(ctx, ox, oy, X(v), Y(v), 5)

  ctx.fillStyle = weight > 1 ? YELLOW : INK
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(X(v), Y(v), 3.4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()

  // Along the bottom of the box: the vectors reach the top of it at w = 2.
  label(ctx, 'v', bx + 7, by + bh - 9, DIM, 'left', 10, '600')
  label(ctx, 'unc', bx + 15, by + bh - 8, DIM, 'left', 8)
  label(ctx, 'v', bx + 40, by + bh - 9, BLUE, 'left', 10, '600')
  label(ctx, 'pos', bx + 47, by + bh - 8, BLUE, 'left', 8)
  // The weight itself is read off the legend below, not repeated here.
}

function draw() {
  const el = canvas.value
  if (!el) return
  const { width: cw, height: ch } = props
  const ctx = prepare(el, cw, ch)
  const view = makeView(cw, ch)

  drawField(ctx, view, PROBE_TAU, (x, y, tau) => guided(x, y, tau, isPrintMode.value ? 1 : w.value))
  drawMode(ctx, view, NEG, RED)
  drawMode(ctx, view, POS, BLUE)
  drawReference(ctx, view, cw)

  if (isPrintMode.value) {
    // No sweep to show, so show what it ends at: the trajectories once, at the
    // deployed weight, and the endpoint clouds of the two extremes over them.
    const paths = (weight) =>
      noise.map(([x, y]) => integrate(x, y, props.steps, (a, b, t) => guided(a, b, t, weight)))
    const one = paths(1)
    drawBundle(ctx, view, one, BLUE, 1.2, 0.4)
    drawBundle(ctx, view, paths(0), DIM, 1, 0.5, false)
    const two = paths(2)
    drawBundle(ctx, view, two, INK, 1, 0.7, false)
    drawEndpointMean(ctx, view, two, INK)
    // Down the left edge, under the inset: the top right is where the positive
    // mode and its own label already are.
    legendPanel(ctx, 152, 74)
    label(ctx, 'endpoints, w = 0', 12, 128, DIM, 'left', 10, '600')
    label(ctx, 'trajectories, w = 1', 12, 144, BLUE, 'left', 10, '600')
    label(ctx, 'endpoints, w = 2', 12, 160, INK, 'left', 10, '600')
    label(ctx, '✛  mean endpoint, w = 2', 12, 176, INK, 'left', 10, '600')
  } else {
    drawBundle(ctx, view, bundle.value, INK, 1.4, 0.5)
    drawEndpointMean(ctx, view, bundle.value, w.value > 1 ? '#b58f00' : INK)
    legendPanel(ctx, 120, 46)
    label(ctx, `w = ${w.value.toFixed(2)}`, 12, 128, INK, 'left', 12, '600')
    label(ctx, '✛  mean endpoint', 12, 146, DIM, 'left', 10, '600')
  }

  // To the right of the modes: above them is where the endpoints pile up, and
  // that is the part the eye has to be able to read against the dashed line.
  label(ctx, 'advantage-', view.toX(POS.x + 0.62), view.toY(POS.y + 0.12), BLUE, 'left')
  label(ctx, 'positive', view.toX(POS.x + 0.62), view.toY(POS.y - 0.1), BLUE, 'left')
  label(ctx, 'advantage-', view.toX(NEG.x + 0.62), view.toY(NEG.y + 0.12), RED, 'left')
  label(ctx, 'negative', view.toX(NEG.x + 0.62), view.toY(NEG.y - 0.1), RED, 'left')
  label(ctx, 'noise', view.toX(-0.05), view.toY(-1.78), DIM, 'center')

  drawInset(ctx, view, isPrintMode.value ? 2 : w.value)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1)
}

let io = null
onMounted(() => {
  if (isPrintMode.value) {
    draw()
    settle(canvas.value, draw)
    return
  }
  io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.2 })
  io.observe(canvas.value)
})
onBeforeUnmount(() => {
  stop()
  io?.disconnect()
})
function start() {
  if (!raf) { last = 0; raf = requestAnimationFrame(frame) }
}
function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}
</script>

<template>
  <div class="gd">
    <canvas ref="canvas" :style="{ width: width + 'px', height: height + 'px' }" />
    <div class="gd-bar" :style="{ width: width + 'px' }">
      <button class="ff-btn" @click="playing = !playing">{{ playing ? 'pause' : 'sweep' }}</button>
      <input
        class="gd-slider"
        type="range"
        min="0"
        max="2"
        step="0.005"
        :value="w"
        @input="playing = false; w = Number($event.target.value)"
      />
      <span class="gd-ends">w: 0 → 2</span>
    </div>
    <p class="gd-cap" :style="{ width: width + 'px' }">{{ caption(w) }}</p>
  </div>
</template>

<style scoped>
.gd { display: inline-block; }
.gd canvas { display: block; }
.gd-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
}
.gd-slider {
  flex: 1 1 auto;
  accent-color: var(--fhnw-black, #000);
  height: 1rem;
  min-width: 0;
}
.gd-ends {
  flex: 0 0 auto;
  color: var(--fhnw-grey-3, #767573);
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.gd-cap {
  color: var(--fhnw-ink-2, #4c4c4c);
  font-size: 0.75rem;
  line-height: 1.35;
  margin: 0.3rem 0 0;
}
.ff-btn {
  border: 1px solid var(--fhnw-grey-2, #deded9);
  background: #fff;
  color: var(--fhnw-black, #000);
  padding: 0.04rem 0.42rem;
  font: inherit;
  cursor: pointer;
}
.ff-btn:hover { border-color: var(--fhnw-black, #000); }
</style>
