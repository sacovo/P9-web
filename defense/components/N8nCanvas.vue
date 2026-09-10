<!--
  A real n8n canvas on a slide, instead of a screenshot of one.

  It is the same `<n8n-demo>` web component the companion site's workflow
  gallery uses, fed from the same `content/gallery.json` — so the canvas on the
  slide is the export of the workflow that actually runs on the rover, and it
  pans, zooms and opens a node.

  Three things a deck needs that a web page does not:

    · it must never be live during `slidev export`, or the PDF gets a white
      iframe where the figure should be — print mode falls back to the
      screenshot, exactly as Clip.vue falls back to a poster frame;
    · booting an n8n frontend takes a few seconds, so it starts one slide
      early and is torn down again two slides on. The screenshot stays on top
      until the frontend says it is ready, so the slide is never blank;
    · if the renderer is unreachable — no network in the room — the screenshot
      simply stays. That needs no reachability check of its own: the handshake
      is what takes it away, and an iframe that never loads never sends one.

  `clicktointeract` leaves the iframe `pointer-events: none` until it is
  clicked, which is what keeps arrow-key navigation working: an unclicked
  canvas cannot take focus. Once clicked it can, so click the slide background
  (or press Escape after a node view) before paging on.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'
import site from '../../site.config.json'

const props = defineProps({
  /** `slug` in content/gallery.json — the workflows exported off the rover. */
  slug: { type: String, required: true },
  /** Screenshot under public/, without a leading slash. Print and offline. */
  fallback: { type: String, required: true },
  /** Box height in px; the canvas fills it. */
  height: { type: Number, default: 210 },
})

/**
 * The data-less n8n whose only job is rendering canvases (`N8N_PREVIEW_MODE`),
 * not the editor holding the credentials. Built from the same
 * `site.config.json` as the site's own config, so moving the zone stays one
 * file. See ../../src/config.ts.
 */
const src = `https://${site.labels.n8nPreview}.${site.baseDomain}/workflows/demo`

const { isPrintMode } = useNav()
const { $page, $nav, $renderContext } = useSlideContext()

/** Slides between here and where the talk is. 0 while this slide is up. */
const away = computed(() => Math.abs(($nav.value.currentSlideNo ?? 0) - ($page.value ?? 0)))

const host = ref(null)
/** 'idle' while nothing is mounted, 'booting' from the first byte on. */
const phase = ref('idle')
/** The frontend has answered and, if this slide is up, has drawn the canvas. */
const live = ref(false)

// Built at runtime, so Vite cannot rewrite it the way it rewrites a static
// `src="/img/…"`. Without the base it 404s wherever the deck is served from a
// sub-path — the thesis site mounts it at /defense/.
const asset = (path) => `${import.meta.env.BASE_URL}${path}`

/**
 * The frontend reports itself with a postMessage before it will accept a
 * workflow, and `<n8n-demo>` only posts the workflow in once its iframe is on
 * screen — which, mounted a slide early, is when the talk arrives here. So the
 * screenshot comes off on the later of the two, plus the beat the canvas takes
 * to draw.
 */
const ready = ref(false)

const onMessage = ({ data }) => {
  if (typeof data === 'string' && data.includes('n8nReady')) ready.value = true
}

watch([ready, away], ([isReady, d]) => {
  if (!isReady || d !== 0) return
  setTimeout(() => {
    if (ready.value) live.value = true
  }, 600)
})

const unmount = () => {
  if (phase.value === 'idle') return
  window.removeEventListener('message', onMessage)
  host.value?.replaceChildren()
  phase.value = 'idle'
  ready.value = false
  live.value = false
}

const mount = async () => {
  if (phase.value !== 'idle' || !host.value) return
  phase.value = 'booting'

  // Both loaded on approach, so neither the Lit bundle nor the workflow JSON
  // is part of the deck's initial load.
  const [gallery] = await Promise.all([
    import('../../content/gallery.json'),
    import('@n8n_io/n8n-demo-component'),
  ])

  const entry = (gallery.default ?? gallery).workflows.find((w) => w.slug === props.slug)
  // Left the slide while the bundle was in flight, or the slug is gone.
  if (!entry || phase.value !== 'booting' || !host.value) {
    unmount()
    return
  }

  window.addEventListener('message', onMessage)

  const canvas = document.createElement('n8n-demo')
  canvas.setAttribute('workflow', entry.workflow)
  canvas.setAttribute('src', src)
  canvas.setAttribute('theme', 'light')
  // No frame: its tip line and JSON toggle are for a web page with room for
  // them. The slide has neither the space nor the use.
  canvas.setAttribute('frame', 'false')
  canvas.setAttribute('clicktointeract', 'true')
  canvas.setAttribute('collapseformobile', 'false')
  canvas.setAttribute('hidecanvaserrors', 'true')
  host.value.append(canvas)
}

/**
 * Boot one slide out, keep it for one more, then let it go.
 *
 * Only where the slide is actually being presented: the same render contexts
 * Slidev's own CodeRunner accepts. Presenter mode renders this slide a second
 * time as the next-slide preview, and the overview renders all 59 at once —
 * neither is worth a second n8n frontend.
 */
const sync = (d) => {
  if (isPrintMode.value || !['slide', 'presenter'].includes($renderContext.value)) return
  if (d <= 1) mount()
  else if (d > 2) unmount()
}

watch(away, sync)
// Not `immediate` on the watcher: that fires during setup, whatever the flush,
// and the host div does not exist yet. It also has to be a hook rather than a
// one-off call, for the case of the deck being opened straight onto this slide,
// where `away` starts at 0 and never changes.
onMounted(() => sync(away.value))

onBeforeUnmount(unmount)
</script>

<template>
  <div class="canvas-box" :style="{ height: `${height}px`, '--n8n-workflow-min-height': `${height}px` }">
    <div ref="host" class="canvas-host" />
    <img v-show="!live" :src="asset(fallback)" class="canvas-still" />
  </div>
</template>

<style scoped>
.canvas-box {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--fhnw-grey-2, #deded9);
  background: var(--fhnw-grey-1, #f1f1ee);
}

.canvas-host,
.canvas-still {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.canvas-still {
  object-fit: contain;
  background: #fff;
}

/* The element is created in script, so it never carries this component's scope
   attribute — `:deep` is what reaches it. Everything below it is shadow DOM,
   and `theme="light"` handles that. */
.canvas-host :deep(n8n-demo) {
  display: block;
  height: 100%;
}
</style>
