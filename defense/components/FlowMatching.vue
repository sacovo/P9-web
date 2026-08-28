<!--
  The flow-matching sampler, animated.

  One Euler step at a time: the field is held at the tau the step is taken
  from, the samples slide along that step, and then the field is redrawn at the
  next tau. That is the thing a static figure cannot show — the field the
  sampler integrates is a different field at every step, and the two behaviour
  modes only separate late.

  Set `steps` to 1 to make the other half of the argument: a single Euler step
  from tau = 0 lands every sample exactly on the MEAN of the two modes, because
  at tau = 0 the posterior over them is still the prior. That is the answer to
  "why not simply use fewer steps", and it is arithmetic here rather than an
  assertion — see the derivation in flowfield.ts.

  During `slidev export` there is no animation, so the finished trajectories are
  drawn with the field at a representative mid-integration tau.
-->
<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useNav } from '@slidev/client'
import {
  BOTH, BLUE, DIM, INK, RULE,
  drawField, drawMode, hexToRgba, integrate, label, makeView, settle, noiseSamples, prepare, velocity,
} from './flowfield'

const props = defineProps({
  width: { type: Number, default: 520 },
  height: { type: Number, default: 300 },
  /** Euler steps for the sampler. Also the initial value of the control. */
  steps: { type: Number, default: 10 },
  particles: { type: Number, default: 22 },
  /** Milliseconds per Euler step, and the pause on the finished chunk. */
  stepMs: { type: Number, default: 320 },
  holdMs: { type: Number, default: 900 },
  controls: { type: Boolean, default: true },
})

const { isPrintMode } = useNav()

const canvas = ref(null)
const nSteps = ref(props.steps)
const playing = ref(true)
const paths = shallowRef([])

const field = (x, y, tau) => velocity(x, y, tau, BOTH)

// Recomputed only when the step count changes: 22 paths of at most 10 steps is
// nothing, but it also must not change while a step is being drawn.
watch(nSteps, build, { immediate: true })
function build() {
  paths.value = noiseSamples(props.particles).map(([x, y]) => integrate(x, y, nSteps.value, field))
}

// Animation state: which Euler step we are on, and how far along it.
let step = 0
let frac = 0
let holding = 0
let raf = 0
let last = 0
const tauNow = ref(0)

function frame(t) {
  raf = requestAnimationFrame(frame)
  const dt = last ? Math.min(t - last, 64) : 0
  last = t

  if (playing.value) {
    if (holding > 0) {
      holding -= dt
    } else {
      frac += dt / props.stepMs
      while (frac >= 1) {
        frac -= 1
        step += 1
        if (step >= nSteps.value) {
          step = nSteps.value
          frac = 0
          holding = props.holdMs
          break
        }
      }
      if (step >= nSteps.value && holding <= 0) {
        step = 0
        frac = 0
      }
    }
  }
  draw()
}

function draw() {
  const el = canvas.value
  if (!el) return
  const { width: w, height: h } = props
  const ctx = prepare(el, w, h)
  const view = makeView(w, h)

  // In print mode there is nothing to animate: show the finished integration.
  const done = isPrintMode.value
  const k = done ? nSteps.value : Math.min(step, nSteps.value)
  const f = done ? 0 : frac
  const tau = Math.min((done ? 0.4 * nSteps.value : k) / nSteps.value, 1)
  tauNow.value = tau

  drawField(ctx, view, tau, field)
  drawMode(ctx, view, BOTH[0], BLUE)
  drawMode(ctx, view, BOTH[1], BLUE)

  // Trajectories: the completed Euler segments, plus the one in flight.
  ctx.lineWidth = 1.4
  ctx.strokeStyle = hexToRgba(INK, 0.55)
  for (const p of paths.value) {
    ctx.beginPath()
    ctx.moveTo(view.toX(p[0][0]), view.toY(p[0][1]))
    for (let i = 1; i <= k; i++) ctx.lineTo(view.toX(p[i][0]), view.toY(p[i][1]))
    if (f > 0 && k < nSteps.value) {
      const a = p[k]
      const b = p[k + 1]
      ctx.lineTo(view.toX(a[0] + (b[0] - a[0]) * f), view.toY(a[1] + (b[1] - a[1]) * f))
    }
    ctx.stroke()
  }

  // The samples themselves.
  ctx.fillStyle = INK
  for (const p of paths.value) {
    let x = p[k][0]
    let y = p[k][1]
    if (f > 0 && k < nSteps.value) {
      x += (p[k + 1][0] - x) * f
      y += (p[k + 1][1] - y) * f
    }
    ctx.beginPath()
    ctx.arc(view.toX(x), view.toY(y), 2.6, 0, 2 * Math.PI)
    ctx.fill()
  }

  // The mean of the two modes, which is where one step of size 1 lands and
  // where a direct regression would have had to predict.
  const mx = view.toX((BOTH[0].x + BOTH[1].x) / 2)
  const my = view.toY((BOTH[0].y + BOTH[1].y) / 2)
  ctx.strokeStyle = hexToRgba(DIM, 0.75)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(mx - 4, my - 4); ctx.lineTo(mx + 4, my + 4)
  ctx.moveTo(mx + 4, my - 4); ctx.lineTo(mx - 4, my + 4)
  ctx.stroke()

  label(ctx, 'noise', view.toX(-0.05), view.toY(-1.78), DIM, 'center')
  label(ctx, 'mean', mx + 9, my - 10, DIM, 'left', 10)
  // To the right of the modes: above them is where the samples arrive.
  label(ctx, 'demonstrated', view.toX(BOTH[0].x + 0.5), view.toY(BOTH[0].y + 0.12), BLUE, 'left')
  label(ctx, 'actions', view.toX(BOTH[0].x + 0.5), view.toY(BOTH[0].y - 0.1), BLUE, 'left')
  label(ctx, `velocity field at τ = ${tau.toFixed(2)}`, 10, 15, DIM, 'left', 11, '600')

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
}

let io = null
onMounted(() => {
  if (isPrintMode.value) {
    draw()
    settle(canvas.value, draw)
    return
  }
  // Every slide is mounted at once, so a bare rAF loop per figure would run
  // the whole deck's animations forever. Only the visible one advances.
  io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.2 })
  io.observe(canvas.value)
})
onBeforeUnmount(() => {
  stop()
  io?.disconnect()
})
function start() {
  if (!raf) {
    last = 0
    raf = requestAnimationFrame(frame)
  }
}
function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function setSteps(n) {
  nSteps.value = n
  step = 0
  frac = 0
  holding = 0
}
function replay() {
  step = 0
  frac = 0
  holding = 0
  playing.value = true
}
</script>

<template>
  <div class="ff">
    <canvas ref="canvas" :style="{ width: width + 'px', height: height + 'px' }" />
    <div v-if="controls" class="ff-bar" :style="{ width: width + 'px' }">
      <button class="ff-btn" @click="playing ? (playing = false) : replay()">
        {{ playing ? 'pause' : 'play' }}
      </button>
      <span class="ff-seg">
        <span class="ff-lab">Euler steps</span>
        <button
          v-for="n in [1, 2, 4, 10]"
          :key="n"
          class="ff-btn"
          :class="{ on: nSteps === n }"
          @click="setSteps(n)"
        >{{ n }}</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ff { display: inline-block; }
.ff canvas { display: block; }
.ff-bar {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
}
.ff-seg { display: flex; align-items: baseline; gap: 0.3rem; }
.ff-lab {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--fhnw-grey-3, #767573);
  margin-right: 0.15rem;
}
.ff-btn {
  border: 1px solid var(--fhnw-grey-2, #deded9);
  background: #fff;
  color: var(--fhnw-black, #000);
  padding: 0.04rem 0.42rem;
  font: inherit;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.ff-btn:hover { border-color: var(--fhnw-black, #000); }
.ff-btn.on {
  border-color: var(--fhnw-black, #000);
  border-bottom-width: 3px;
  border-bottom-color: var(--fhnw-yellow, #fde70e);
  font-weight: 600;
}
</style>
