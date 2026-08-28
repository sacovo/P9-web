<!--
  A LIBERO rollout clip.

  Live it loops silently. During `slidev export` autoplay is switched off so the
  poster frame — grabbed near the end of the episode, i.e. showing the outcome —
  is what lands in the PDF instead of an arbitrary mid-playback frame.
  `src` is the basename under /videos, without extension.
-->
<script setup>
import { computed } from 'vue'
import { useNav } from '@slidev/client'

defineProps({
  src: { type: String, required: true },
  label: { type: String, default: '' },
  verdict: { type: String, default: '' }, // 'success' | 'fail' | ''
})

const { isPrintMode } = useNav()
const live = computed(() => !isPrintMode.value)

// Built at runtime, so Vite cannot rewrite these the way it rewrites a static
// `src="/videos/…"`. Without the base the clips 404 whenever the deck is
// served from a sub-path (the thesis site mounts it at /smolvla-presentation/).
// BASE_URL always ends in a slash — `/` when the deck is served from the root.
const asset = (path) => `${import.meta.env.BASE_URL}${path}`
</script>

<template>
  <figure class="m-0">
    <div class="clip">
      <video
        :src="live ? asset(`videos/${src}.mp4`) : undefined"
        :poster="asset(`videos/${src}.jpg`)"
        :autoplay="live"
        :loop="live"
        :preload="live ? 'auto' : 'none'"
        muted
        playsinline
      />
    </div>
    <figcaption v-if="label || verdict">
      <span v-if="verdict" class="badge" :class="verdict">
        {{ verdict === 'success' ? 'success' : 'timeout' }}
      </span>
      {{ label }}
    </figcaption>
  </figure>
</template>

<style scoped>
.badge {
  display: inline-block;
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.08rem 0.4rem;
  margin-right: 0.4rem;
  vertical-align: 1px;
  border: 1px solid var(--fhnw-black, #000);
}
.badge.success { background: var(--fhnw-yellow, #fde70e); color: #000; }
.badge.fail { background: #fff; color: #000; }
</style>
