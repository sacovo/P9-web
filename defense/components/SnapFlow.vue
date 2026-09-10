<!--
  The SnapFlow shortcut and the loop that trains it, built up in four beats on
  the same 2-D example as FlowMatching.vue and Guidance.vue.

    1  the ten-step integration, and where it lands
    2  one Euler step of size 1 — it misses, badly
    3  the teacher's two half-steps, averaged into a chord
    4  the bootstrap: 1 chases 2, 2 chases 4, and the fixed point is the
       full integration

  Beat 3 is the one worth the animation. The student's single jump along the
  averaged chord lands EXACTLY where two half-steps land — that is an identity,
  not an approximation:

      x0 + 1 * (v0 + v_half)/2  =  x0 + 0.5*v0 + 0.5*v_half  =  two half-steps

  and beat 4 is why that is progress rather than circular. In this example the
  distance to the ten-step endpoint falls 1.39 -> 0.34 -> 0.14 -> 0.02 for
  1, 2, 4 and 8 steps, monotonically and for every sample tried, so each round's
  target really is ahead of what the student can currently do.

  Time runs tau: 0 (noise) -> 1 (action), as in the rest of the deck. LeRobot
  stores the negated field and runs its time variable from 1 down to 0, which is
  the same trajectory under the opposite sign convention.
-->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useNav } from '@slidev/client'
import {
  BLUE, BOTH, DIM, INK, ORANGE, RULE,
  arrow, drawField, drawMode, hexToRgba, integrate, label, makeView, settle, prepare, velocity,
} from './flowfield'

const props = defineProps({
  width: { type: Number, default: 498 },
  height: { type: Number, default: 300 },
  /**
   * Which scene to open on, and — since a canvas can only print one — which
   * one lands in the PDF. `shortcut` builds the jump; `rounds` shows the
   * training loop converging.
   */
  scene: { type: String, default: 'shortcut' },
})

const { isPrintMode } = useNav()
const canvas = ref(null)
const playing = ref(true)

const field = (x, y, tau) => velocity(x, y, tau, BOTH)

/** One noise sample, chosen for a legible sweep across the plane. */
const EPS = [-1.18, 1.48]

// Everything the figure shows, computed once.
const ten = integrate(EPS[0], EPS[1], 10, field)
const A = ten[ten.length - 1]
const v0 = field(EPS[0], EPS[1], 0)
const oneStep = [EPS[0] + v0[0], EPS[1] + v0[1]]
const xHalf = [EPS[0] + 0.5 * v0[0], EPS[1] + 0.5 * v0[1]]
const vHalf = field(xHalf[0], xHalf[1], 0.5)
const chord = [(v0[0] + vHalf[0]) / 2, (v0[1] + vHalf[1]) / 2]
const jump = [EPS[0] + chord[0], EPS[1] + chord[1]]
// Beat 4 draws the step counts the earlier beats have not already drawn: the
// grey dashed line IS one step and the teacher's polyline IS two, so only 4 and
// 8 are left. As WHOLE PATHS, not endpoints — after two steps the endpoints
// land 26, 11 and 2 px from A at this scale and collapse into one illegible
// clump, while the paths stay distinct all the way along and are visibly
// nestling onto the blue curve, which is the thing the beat is claiming.
const ladder = [4, 8].map((k) => ({ k, pts: integrate(EPS[0], EPS[1], k, field) }))

/**
 * Scene 2: the training loop, one round per entry.
 *
 * Under the shortcut view a student whose one-step map is worth 2^n Euler steps
 * is trained onto its own teacher, whose two half-steps are worth 2^(n+1). So
 * round n starts with the student at E(2^n) and the teacher at E(2^(n+1)),
 * training moves the student ONTO the teacher, and the teacher — recomputed
 * from the improved model — is ahead again by half as much. Both numbers below
 * are measured, not asserted: the student-teacher gap runs
 * 1.09, 0.20, 0.11, 0.06 and its distance to the ten-step endpoint runs
 * 1.39, 0.34, 0.14, 0.02.
 *
 * Three rounds, because a fourth would land the student at E(16), which is
 * PAST the ten-step endpoint — correctly, since the fixed point of the
 * recursion is the exact integral and ten steps is itself an approximation of
 * it, but a readout that improves to 0.02 and then worsens to 0.04 reads as a
 * bug rather than as a footnote. Three rounds end exactly on the thing the
 * rover deploys.
 */
const ROUNDS = [0, 1, 2].map((n) => {
  const k = 2 ** n
  // Two half-steps of a map worth k Euler steps each is the 2k-step
  // integration, so its node at tau = 0.5 is exactly where the teacher's first
  // half-step lands and its last node is where the second one does.
  const fine = integrate(EPS[0], EPS[1], 2 * k, field)
  return {
    n,
    S: integrate(EPS[0], EPS[1], k, field).at(-1), // the student's single jump
    M: fine[k], // the teacher, after one half-step
    T: fine.at(-1), // …and after the second
  }
})

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

const ROUND_MS = 2600
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

const BEATS = [
  { ms: 1900, cap: 'the deployed sampler: ten Euler steps' },
  { ms: 1300, cap: 'one Euler step of size 1 — it misses' },
  { ms: 2700, cap: 'the teacher: two half-steps, averaged into one chord' },
  { ms: 2300, cap: '1 chases 2, 2 chases 4 — each halving closes on the integral' },
  { ms: 1500, cap: 'the student jumps once, and lands where the chord did' },
]

const scene = ref(props.scene)

// Refs, not plain variables: the buttons highlight the current beat or round,
// and a plain `let` would leave that highlight stuck on whatever it was first.
const beat = ref(0)
const round = ref(0)
let bt = 0
let rt = 0
let raf = 0
let last = 0
const capNow = ref(BEATS[0].cap)

function frame(t) {
  raf = requestAnimationFrame(frame)
  const dt = last ? Math.min(t - last, 64) : 0
  last = t
  if (playing.value) {
    if (scene.value === 'rounds') {
      rt += dt / ROUND_MS
      while (rt >= 1) {
        rt -= 1
        round.value = (round.value + 1) % ROUNDS.length
      }
    } else {
      bt += dt / BEATS[beat.value].ms
      while (bt >= 1) {
        bt -= 1
        beat.value = (beat.value + 1) % BEATS.length
      }
    }
  }
  draw()
}

/** Eases a beat's progress so the traces do not start and stop abruptly. */
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))

function drawPath(ctx, view, pts, upto, colour, width, dash = null) {
  const n = pts.length - 1
  const f = Math.max(0, Math.min(upto, 1)) * n
  const whole = Math.floor(f)
  ctx.setLineDash(dash || [])
  ctx.lineWidth = width
  ctx.strokeStyle = colour
  ctx.beginPath()
  ctx.moveTo(view.toX(pts[0][0]), view.toY(pts[0][1]))
  for (let i = 1; i <= whole; i++) ctx.lineTo(view.toX(pts[i][0]), view.toY(pts[i][1]))
  if (whole < n) {
    const g = f - whole
    const a = pts[whole]
    const b = pts[whole + 1]
    ctx.lineTo(view.toX(a[0] + (b[0] - a[0]) * g), view.toY(a[1] + (b[1] - a[1]) * g))
  }
  ctx.stroke()
  ctx.setLineDash([])
}

function dot(ctx, view, p, colour, r = 3.6, ring = false) {
  ctx.fillStyle = ring ? '#ffffff' : colour
  ctx.beginPath()
  ctx.arc(view.toX(p[0]), view.toY(p[1]), r, 0, 2 * Math.PI)
  ctx.fill()
  if (ring) {
    ctx.strokeStyle = colour
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
}

function cross(ctx, view, p, colour, r = 5) {
  const x = view.toX(p[0])
  const y = view.toY(p[1])
  ctx.strokeStyle = colour
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r)
  ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r)
  ctx.stroke()
}

/** The field, the two modes and the reference integration — common to both scenes. */
function drawStage(ctx, view, tenUpTo = 1) {
  ctx.globalAlpha = 0.45
  drawField(ctx, view, 0.5, field)
  ctx.globalAlpha = 1
  drawMode(ctx, view, BOTH[0], BLUE)
  drawMode(ctx, view, BOTH[1], BLUE)
  drawPath(ctx, view, ten, tenUpTo, BLUE, 2)
  if (tenUpTo > 0.98) {
    dot(ctx, view, A, BLUE, 4)
    label(ctx, 'A — ten steps', view.toX(A[0]) + 11, view.toY(A[1]) - 12, BLUE, 'left', 11, '600')
  }
}

/** The caption strip, on a panel so it never fights the field behind it. */
function drawCaption(ctx, w, text) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(6, 6, w - 12, 22)
  label(ctx, text, 12, 18, INK, 'left', 11, '600')
}

/**
 * Scene 2 — one training round, in four phases: train the student onto the
 * teacher, hold on the consistency, let the teacher recompute ahead, hold.
 */
function drawRounds(ctx, view, w, h) {
  const i = isPrintMode.value ? ROUNDS.length - 1 : round.value
  const u = isPrintMode.value ? 1 : rt
  const { S, M, T } = ROUNDS[i]
  const next = ROUNDS[Math.min(i + 1, ROUNDS.length - 1)]

  // train: 0.10 -> 0.50, teacher recomputes: 0.62 -> 0.92.
  const trained = ease(Math.min(Math.max((u - 0.1) / 0.4, 0), 1))
  const moved = ease(Math.min(Math.max((u - 0.62) / 0.3, 0), 1))
  // The student is ONE call, so its path is one straight segment however good
  // it gets; training swings that segment from where it lands now onto where
  // the teacher lands. The teacher is always two segments through its
  // half-step, and recomputing on the improved model moves both of its nodes.
  const student = lerp(S, T, trained)
  const half = lerp(M, next.M, moved)
  const teacher = lerp(T, next.T, moved)

  drawStage(ctx, view)

  // Where the student has been, so the march is visible rather than remembered.
  for (let k = 0; k <= i; k++) {
    ctx.globalAlpha = 0.3
    dot(ctx, view, ROUNDS[k].S, ORANGE, 2.4)
    ctx.globalAlpha = 1
  }

  // The teacher's two half-steps, then the student's single jump over them.
  drawPath(ctx, view, [EPS, half, teacher], 1, hexToRgba(INK, 0.85), 1.5)
  dot(ctx, view, half, INK, 3.2, true)
  drawPath(ctx, view, [EPS, student], 1, ORANGE, 2.4)

  // The gap the consistency term is closing.
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.2
  ctx.strokeStyle = hexToRgba(INK, 0.65)
  ctx.beginPath()
  ctx.moveTo(view.toX(student[0]), view.toY(student[1]))
  ctx.lineTo(view.toX(teacher[0]), view.toY(teacher[1]))
  ctx.stroke()
  ctx.setLineDash([])

  dot(ctx, view, teacher, INK, 4.2, true)
  dot(ctx, view, student, ORANGE, 4.6)
  if (i === 0) {
    label(ctx, 'half-step', view.toX(half[0]) - 8, view.toY(half[1]) + 12, INK, 'right', 10)
  }

  // Three cases, and the first has to be tested on the real distance rather
  // than on screen proximity: late rounds put the markers a few pixels apart
  // while the teacher is genuinely ahead, and "jump = chord" would be a lie
  // there. Only an actual coincidence earns that label.
  const gapWorld = dist(student, teacher)
  if (gapWorld < 0.01) {
    label(ctx, 'jump = chord', view.toX(student[0]) - 10, view.toY(student[1]) + 15, INK, 'right', 10, '600')
  } else if (gapWorld * view.k > 34) {
    label(ctx, 'teacher · two half-steps', view.toX(teacher[0]) + 10, view.toY(teacher[1]) - 12, INK, 'left', 10, '600')
    label(ctx, 'student · one jump', view.toX(student[0]) - 10, view.toY(student[1]) + 14, ORANGE, 'right', 10, '600')
  } else {
    // Too close to carry two labels, too far apart to call them one.
    label(ctx, 'jump', view.toX(student[0]) - 10, view.toY(student[1]) + 15, ORANGE, 'right', 10, '600')
  }

  const last = i === ROUNDS.length - 1
  const cap =
    u < 0.1 ? `round ${i + 1}: the teacher is ahead of the jump`
      : u < 0.52 ? 'training: the jump learns the chord'
        : u < 0.62 ? 'consistency — the jump now IS the two half-steps'
          : last ? 'and by now the jump is the ten-step answer'
            : u < 0.94 ? 'the teacher recomputes on the improved model…'
              : '…and is ahead again, by half as much'
  drawCaption(ctx, w, cap)

  // Measured, and printed so the halving is not just an impression.
  const gap = dist(student, teacher)
  const toA = dist(student, A)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  ctx.fillRect(8, h - 40, 214, 32)
  label(ctx, `round ${i + 1} of ${ROUNDS.length}`, 14, h - 30, DIM, 'left', 10, '600')
  label(ctx, `jump → chord  ${gap.toFixed(2)}`, 14, h - 16, INK, 'left', 10, '600')
  label(ctx, `jump → A  ${toA.toFixed(2)}`, 132, h - 16, ORANGE, 'left', 10, '600')
}

function draw() {
  const el = canvas.value
  if (!el) return
  const { width: w, height: h } = props
  const ctx = prepare(el, w, h)
  const view = makeView(w, h)

  if (scene.value === 'rounds') {
    drawRounds(ctx, view, w, h)
    dot(ctx, view, EPS, DIM, 3)
    label(ctx, 'ε', view.toX(EPS[0]) - 9, view.toY(EPS[1]), DIM, 'right', 12, '600')
    ctx.strokeStyle = RULE
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    return
  }

  // In print mode every beat is complete: the figure is its own final state.
  const b = isPrintMode.value ? BEATS.length - 1 : beat.value
  const t = isPrintMode.value ? 1 : ease(bt)
  capNow.value = BEATS[b].cap
  const at = (i) => (b > i ? 1 : b === i ? t : 0)

  // Beat 1 — the reference integration.
  drawStage(ctx, view, at(0))

  // Beat 2 — the naive single step.
  if (at(1) > 0) {
    drawPath(ctx, view, [EPS, oneStep], at(1), hexToRgba(DIM, 0.95), 1.6, [5, 4])
    if (at(1) > 0.9) {
      cross(ctx, view, oneStep, DIM)
      label(ctx, 'one Euler step', view.toX(oneStep[0]), view.toY(oneStep[1]) + 16, DIM, 'center', 10)
    }
  }

  // Beat 3 — the teacher's chord, in three sub-beats.
  if (at(2) > 0) {
    const u = at(2)
    ctx.strokeStyle = hexToRgba(INK, 0.8)
    ctx.fillStyle = hexToRgba(INK, 0.8)
    ctx.lineWidth = 1.4
    const half = [EPS[0] + 0.5 * v0[0] * Math.min(u / 0.3, 1), EPS[1] + 0.5 * v0[1] * Math.min(u / 0.3, 1)]
    arrow(ctx, view.toX(EPS[0]), view.toY(EPS[1]), view.toX(half[0]), view.toY(half[1]), 5)
    if (u > 0.3) {
      dot(ctx, view, xHalf, INK, 3.4, true)
      const g = Math.min((u - 0.3) / 0.25, 1)
      const tip = [xHalf[0] + 0.5 * vHalf[0] * g, xHalf[1] + 0.5 * vHalf[1] * g]
      arrow(ctx, view.toX(xHalf[0]), view.toY(xHalf[1]), view.toX(tip[0]), view.toY(tip[1]), 5)
      label(ctx, 'half-step', view.toX(xHalf[0]) - 8, view.toY(xHalf[1]) + 12, INK, 'right', 10)
    }
    if (u > 0.55) {
      const g = Math.min((u - 0.55) / 0.45, 1)
      ctx.strokeStyle = ORANGE
      ctx.fillStyle = ORANGE
      ctx.lineWidth = 2.2
      arrow(
        ctx,
        view.toX(EPS[0]), view.toY(EPS[1]),
        view.toX(EPS[0] + chord[0] * g), view.toY(EPS[1] + chord[1] * g),
        6,
      )
      if (g > 0.95) {
        dot(ctx, view, jump, ORANGE, 4)
        // The identity, stated where it happens: the single jump and the two
        // half-steps are the same point, not two nearby ones.
        label(ctx, 'one jump', view.toX(jump[0]) - 9, view.toY(jump[1]) + 14, ORANGE, 'right', 10, '600')
        label(ctx, '= two half-steps', view.toX(jump[0]) + 9, view.toY(jump[1]) + 14, INK, 'left', 10, '600')
      }
    }
  }

  // Beat 4 — keep halving the step. Each path is drawn in turn and each one
  // hugs the blue ten-step curve more closely than the last.
  if (at(3) > 0) {
    const u = at(3)
    ladder.forEach(({ k, pts }, i) => {
      const on = Math.min(Math.max(u * ladder.length - i, 0), 1)
      if (on <= 0) return
      drawPath(ctx, view, pts, on, hexToRgba(INK, 0.45 + 0.3 * i), 1.3)
      if (on > 0.9) {
        // On the path, where the family is still separated, rather than at the
        // endpoints, where it is not — and at a different fraction along, and a
        // different side of the line, for each, or the two labels stack.
        const n = pts[Math.max(1, Math.round((pts.length - 1) * (i === 0 ? 0.3 : 0.5)))]
        const dy = i === 0 ? 15 : -12
        label(ctx, String(k), view.toX(n[0]), view.toY(n[1]) + dy, INK, 'center', 11, '600')
      }
      ctx.globalAlpha = 1
    })
  }

  drawCaption(ctx, w, capNow.value)

  dot(ctx, view, EPS, DIM, 3)
  label(ctx, 'ε', view.toX(EPS[0]) - 9, view.toY(EPS[1]), DIM, 'right', 12, '600')

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

/** Jump to the end state of a beat and stop there, for walking it by hand. */
function setBeat(i) {
  beat.value = i
  bt = 0.999
  playing.value = false
  draw()
}
/** A round stops on its last phase, where the new gap is already visible. */
function setRound(i) {
  round.value = i
  rt = 0.97
  playing.value = false
  draw()
}
function setScene(s) {
  scene.value = s
  beat.value = 0
  round.value = 0
  bt = 0
  rt = 0
  playing.value = true
}
function replay() {
  beat.value = 0
  round.value = 0
  bt = 0
  rt = 0
  playing.value = true
}
</script>

<template>
  <div class="sf">
    <canvas ref="canvas" :style="{ width: width + 'px', height: height + 'px' }" />
    <div class="sf-bar" :style="{ width: width + 'px' }">
      <button class="ff-btn" @click="playing ? (playing = false) : replay()">
        {{ playing ? 'pause' : 'play' }}
      </button>
      <span v-if="scene === 'shortcut'" class="sf-seg">
        <span class="ff-lab">beat</span>
        <button
          v-for="(b, i) in BEATS.slice(0, 4)"
          :key="i"
          class="ff-btn"
          :class="{ on: !playing && beat === i }"
          @click="setBeat(i)"
        >{{ i + 1 }}</button>
      </span>
      <span v-else class="sf-seg">
        <span class="ff-lab">round</span>
        <button
          v-for="(r, i) in ROUNDS"
          :key="i"
          class="ff-btn"
          :class="{ on: !playing && round === i }"
          @click="setRound(i)"
        >{{ i + 1 }}</button>
      </span>
      <button
        class="ff-btn sf-scene"
        @click="setScene(scene === 'shortcut' ? 'rounds' : 'shortcut')"
      >{{ scene === 'shortcut' ? 'training rounds →' : '← the shortcut' }}</button>
    </div>
  </div>
</template>

<style scoped>
.sf { display: inline-block; }
.sf canvas { display: block; }
.sf-bar {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
}
.sf-seg { display: flex; align-items: baseline; gap: 0.3rem; }
.sf-scene { margin-left: auto; }
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
