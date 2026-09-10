<!--
  The TensorRT export path, drawn on the slide instead of imported as a figure.

  The report's figure is a TikZ export whose text is glyph outlines, so at the
  size a slide can give it (h-290 in a three-fifths column) none of the labels
  survive a projector. Here it is real SVG in the deck's own font: it fills the
  slide, it scales with it, and it prints sharp.

  It also does the thing a still figure cannot — it is walked. The slide's
  clicks step it (`clicks: 4` in the slide's frontmatter), so the room sees one
  machine at a time instead of the whole graph at once, and the last step swaps
  in the second panel: what the two engines actually hold.

  Two scenes, as in `SnapFlow.vue`, and for the same reason: a printed page can
  only carry one, so the appendix mounts a second copy with `scene="engines"`
  for the PDF while this one prints the path.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'

const props = defineProps({
  /** 'path' walks checkpoint → engine → rover; 'engines' is panel (b). */
  scene: { type: String, default: 'path' },
  /** Box height in px. The drawing scales to it. */
  height: { type: Number, default: 360 },
})

const { isPrintMode } = useNav()
const { $clicks } = useSlideContext()

/** Last step of the path scene; the step after it is the engines scene. */
const LAST = 3

const scene = ref(props.scene)
const step = ref(props.scene === 'path' ? 0 : LAST)

/**
 * The slide's own clicks drive the figure, so the talk is paged with the same
 * key as everything else. The buttons stay for jumping about in the questions,
 * and they write back through `step` so the two never disagree.
 */
watch(
  () => $clicks?.value,
  (c) => {
    if (typeof c !== 'number' || props.scene !== 'path') return
    scene.value = c > LAST ? 'engines' : 'path'
    step.value = Math.min(c, LAST)
  },
  { immediate: true },
)

/** Print gets the scene it was asked for, fully revealed. */
const shown = computed(() => (isPrintMode.value ? LAST : step.value))
const onPath = computed(() => (isPrintMode.value ? props.scene === 'path' : scene.value === 'path'))

/** `at(n)` is what every group's opacity hangs off. */
const at = (n) => (onPath.value ? shown.value >= n : true)

function show(s, n) {
  scene.value = s
  step.value = n
}

/** The failure arrow keeps a slow pulse, so the eye finds it while you talk. */
const pulse = ref(1)
let raf = 0
function loop(t) {
  pulse.value = 0.55 + 0.45 * Math.abs(Math.sin(t / 900))
  raf = requestAnimationFrame(loop)
}
onMounted(() => {
  if (!isPrintMode.value) raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="trt" :style="{ height: `${height}px` }">
    <svg viewBox="0 0 960 400" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="trt-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#000" />
        </marker>
        <marker id="trt-head-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#c0392b" />
        </marker>
      </defs>

      <!-- (a) checkpoint → engine → rover -->
      <g v-if="onPath">
        <!-- the three machines -->
        <g class="lane">
          <rect x="1" y="18" width="330" height="74" rx="6" />
          <text x="16" y="38" class="lane-label">training · HPC cluster</text>
        </g>
        <g class="lane" :class="{ off: !at(1) }">
          <rect x="1" y="106" width="958" height="168" rx="6" />
          <text x="16" y="126" class="lane-label">export · workstation GPU · SM_86</text>
        </g>
        <g class="lane" :class="{ off: !at(3) }">
          <rect x="1" y="288" width="958" height="110" rx="6" />
          <text x="16" y="308" class="lane-label">deployment · Jetson Orin · SM_87</text>
        </g>

        <!-- step 0 — what comes off the cluster -->
        <g class="box data">
          <rect x="24" y="48" width="200" height="34" rx="3" />
          <text x="124" y="70">trained checkpoint</text>
        </g>

        <!-- step 1 — two portable graphs, and there are two on purpose -->
        <g :class="{ off: !at(1) }">
          <path d="M124,82 L124,146" class="arrow" />
          <g class="box code">
            <rect x="24" y="146" width="180" height="52" rx="3" />
            <text x="114" y="170">ONNX export</text>
            <text x="114" y="187" class="mono">trt/exporter.py</text>
          </g>
          <path d="M204,172 L236,172" class="arrow" />
          <g class="box data">
            <rect x="240" y="146" width="190" height="52" rx="3" />
            <text x="335" y="168" class="mono">smolvla_prefix.onnx</text>
            <text x="335" y="186" class="mono">smolvla_suffix.onnx</text>
          </g>
        </g>

        <!-- step 2 — the build, and the numerics gate on it -->
        <g :class="{ off: !at(2) }">
          <path d="M430,172 L462,172" class="arrow" />
          <g class="box engine">
            <rect x="466" y="146" width="180" height="52" rx="3" />
            <text x="556" y="170">engine build, FP16</text>
            <text x="556" y="187" class="mono">trt/engine.py</text>
          </g>
          <path d="M646,172 L678,172" class="arrow" />
          <g class="box engine">
            <rect x="682" y="146" width="160" height="52" rx="3" />
            <text x="762" y="170">engines</text>
            <text x="762" y="187" class="mono">SM_86</text>
          </g>
          <path d="M556,198 L556,226" class="arrow" />
          <g class="box code">
            <rect x="446" y="226" width="220" height="34" rx="3" />
            <text x="556" y="248">checked against PyTorch</text>
          </g>
        </g>

        <!-- step 3 — the tarball travels, the engine cannot -->
        <g :class="{ off: !at(3) }">
          <path d="M335,198 L335,258 L124,258 L124,326" class="arrow" />
          <text x="230" y="250" class="edge-label" text-anchor="middle">tarball to the rover</text>

          <g class="box code">
            <rect x="24" y="326" width="200" height="46" rx="3" />
            <text x="124" y="345">builds on the device</text>
            <text x="124" y="362" class="mono">rebuild_on_device.py</text>
          </g>
          <path d="M224,349 L256,349" class="arrow" />
          <g class="box engine">
            <rect x="260" y="326" width="200" height="46" rx="3" />
            <text x="360" y="345">engines</text>
            <text x="360" y="362" class="mono">SM_87</text>
          </g>
          <path d="M460,349 L492,349" class="arrow" />
          <g class="box code">
            <rect x="496" y="326" width="190" height="46" rx="3" />
            <text x="591" y="353">policy controller</text>
          </g>

          <g :style="{ opacity: pulse }">
            <path d="M762,198 L762,349 L690,349" class="arrow fail" />
            <text x="880" y="268" class="edge-label fail">does not load on</text>
            <text x="880" y="284" class="edge-label fail">another architecture</text>
            <g class="cross">
              <path d="M745,262 L779,296 M779,262 L745,296" />
            </g>
          </g>
        </g>
      </g>

      <!-- (b) what the two engines contain -->
      <g v-else>
        <g class="box data">
          <rect x="16" y="96" width="196" height="70" rx="3" />
          <text x="114" y="122">observation</text>
          <text x="114" y="141" class="mono">images, state,</text>
          <text x="114" y="157" class="mono">64 language tokens</text>
        </g>
        <path d="M212,131 L250,131" class="arrow" />

        <g class="box engine">
          <rect x="254" y="96" width="216" height="70" rx="3" />
          <text x="362" y="122">prefix engine</text>
          <text x="362" y="142">SmolVLM backbone</text>
          <text x="362" y="159" class="small">once per observation</text>
        </g>
        <path d="M470,131 L508,131" class="arrow" />

        <g class="box data">
          <rect x="512" y="96" width="160" height="70" rx="3" />
          <text x="592" y="126">flattened cache</text>
          <text x="592" y="147" class="mono">key, value</text>
        </g>
        <path d="M672,131 L710,131" class="arrow" />

        <g class="box engine">
          <rect x="714" y="96" width="230" height="70" rx="3" />
          <text x="829" y="122">suffix engine</text>
          <text x="829" y="142">action expert</text>
          <text x="829" y="159" class="small">once per denoising step</text>
        </g>

        <!-- the loop that stays in Python -->
        <path d="M780,166 L780,262" class="arrow" />
        <text x="770" y="220" class="edge-label" text-anchor="end">vₜ</text>
        <path d="M880,262 L880,166" class="arrow" />
        <text x="890" y="220" class="edge-label">next xₜ</text>

        <path d="M114,262 L114,170" class="arrow dashed" />
        <text x="124" y="200" class="edge-label">language + advantage token</text>
        <path d="M362,262 L362,170" class="arrow dashed" />
        <text x="372" y="200" class="edge-label">second pass, token masked</text>

        <g class="box code host">
          <rect x="16" y="262" width="928" height="80" rx="3" />
          <text x="480" y="292">host code, in Python</text>
          <text x="480" y="316" class="small">
            the Euler loop or the single SnapFlow step, the guidance blend, the action chunk
          </text>
        </g>
      </g>
    </svg>

    <div v-if="!isPrintMode" class="controls">
      <button :class="{ on: onPath }" @click="show('path', 0)">the path</button>
      <span class="dim">step</span>
      <button v-for="n in [0, 1, 2, 3]" :key="n" :class="{ on: onPath && shown === n }" @click="show('path', n)">
        {{ n + 1 }}
      </button>
      <button :class="{ on: !onPath }" @click="show('engines', LAST)">the two engines</button>
    </div>
  </div>
</template>

<style scoped>
.trt {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

svg {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  font-family: inherit;
}

/* Every group fades rather than pops, so a step reads as an addition. */
g {
  transition: opacity 0.28s ease;
}

g.off {
  opacity: 0.08;
}

.lane rect {
  fill: #fbfbfa;
  stroke: var(--fhnw-grey-2);
  stroke-width: 1;
}

.lane-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  fill: var(--fhnw-grey-3);
}

.box text {
  font-size: 14px;
  text-anchor: middle;
  fill: var(--fhnw-black);
}

.box .mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11.5px;
  fill: var(--fhnw-ink-2);
}

.box .small {
  font-size: 12px;
  fill: var(--fhnw-ink-2);
}

/* Grey is data, yellow is an engine, white on black is code we wrote. */
.box.data rect {
  fill: var(--fhnw-grey-1);
  stroke: var(--fhnw-grey-2);
  stroke-width: 1;
}

.box.engine rect {
  fill: #fef9c9;
  stroke: #e0cd12;
  stroke-width: 1.4;
}

.box.code rect {
  fill: #ffffff;
  stroke: var(--fhnw-black);
  stroke-width: 1.4;
}

.box.host rect {
  fill: #fafaf8;
}

.arrow {
  fill: none;
  stroke: var(--fhnw-black);
  stroke-width: 1.4;
  marker-end: url(#trt-head);
}

.arrow.dashed {
  stroke-dasharray: 4 4;
  stroke: var(--fhnw-ink-2);
}

.arrow.fail {
  stroke: #c0392b;
  stroke-dasharray: 6 5;
  marker-end: url(#trt-head-red);
}

.cross path {
  stroke: #c0392b;
  stroke-width: 3.5;
  stroke-linecap: round;
}

.edge-label {
  font-size: 12px;
  fill: var(--fhnw-ink-2);
}

.edge-label.fail {
  fill: #c0392b;
  text-anchor: middle;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
}

.controls .dim {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fhnw-grey-3);
  margin-left: 0.6rem;
}

.controls button {
  padding: 0.1rem 0.5rem;
  border: 1px solid var(--fhnw-grey-2);
  background: #fff;
  color: var(--fhnw-ink-2);
  cursor: pointer;
}

.controls button:hover {
  border-color: var(--fhnw-grey-3);
}

.controls button.on {
  border-color: var(--fhnw-black);
  color: var(--fhnw-black);
  box-shadow: inset 0 -3px 0 var(--fhnw-yellow);
}
</style>
