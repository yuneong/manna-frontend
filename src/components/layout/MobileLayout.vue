<script setup lang="ts">
import { useRouter } from 'vue-router'

withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
  }>(),
  { showBack: false },
)

const router = useRouter()
</script>

<template>
  <div class="mobile-layout">
    <div class="mobile-header">
      <button v-if="showBack" class="mobile-back" @click="router.back()">←</button>
      <h1 v-if="title" class="mobile-title">{{ title }}</h1>
    </div>
    <div class="mobile-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="mobile-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.mobile-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--color-border);
}
.mobile-back {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 0;
  line-height: 1;
}
.mobile-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.mobile-content {
  flex: 1;
  padding: 16px;
}
.mobile-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 0.5px solid var(--color-border);
  background: var(--color-bg-primary);
}
</style>
