<!--
  FHNW logo + slide number, drawn over every slide except the cover.

  This has to be global-TOP: global-bottom renders underneath the slide's own
  background and would be invisible.

  The counter stops at the appendix. The room should see "12 / 35" on the last
  talk slide, not "12 / 55" — the backup slides are for the questions and their
  count is nobody's business during the talk. The appendix divider carries
  `appendix: true` in its frontmatter and is what splits the two; the backups
  are numbered A1, A2, … so they can still be called for from the floor.
-->
<script setup>
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, total, slides } = useNav()
const show = computed(() => currentPage.value > 1)

// 1-based page number of the appendix divider, or 0 if the deck has no appendix.
const appendixAt = computed(() => {
  const i = slides.value.findIndex(s => s.meta?.slide?.frontmatter?.appendix)
  return i < 0 ? 0 : i + 1
})

const label = computed(() => {
  const page = currentPage.value
  const at = appendixAt.value
  if (!at)
    return `${page} / ${total.value}`
  if (page < at)
    return `${page} / ${at - 1}`
  if (page === at)
    return ''            // the divider says "Appendix"; a number would only clutter it
  return `A${page - at}`
})
</script>

<template>
  <template v-if="show">
    <img
      class="fhnw-logo"
      src="/img/fhnw-logo.png"
      alt="FHNW Hochschule für Informatik"
    />
    <div v-if="label" class="page-num">{{ label }}</div>
  </template>
</template>

<style scoped>
.page-num {
  position: absolute;
  right: 1.6rem;
  bottom: 1.05rem;
  font-size: 0.7rem;
  color: var(--fhnw-grey-3, #767573);
  font-variant-numeric: tabular-nums;
}
</style>
