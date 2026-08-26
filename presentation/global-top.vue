<!--
  FHNW logo + slide number, drawn over every slide except the cover.

  This has to be global-TOP: global-bottom renders underneath the slide's own
  background and would be invisible.
-->
<script setup>
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, total } = useNav()
const show = computed(() => currentPage.value > 1)
</script>

<template>
  <template v-if="show">
    <img
      class="fhnw-logo"
      src="/img/fhnw-logo.png"
      alt="FHNW Hochschule für Informatik"
    />
    <div class="page-num">{{ currentPage }} / {{ total }}</div>
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
