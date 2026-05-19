<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 })
</script>

<template>
  <span class="logo" :style="{ fontSize: `${size}px` }">
    manna
    <span
      class="logo__dot"
      :style="{
        width: `${size * 0.18}px`,
        height: `${size * 0.18}px`,
        transform: `translateY(-${size * 0.04}px)`,
      }"
    />
  </span>
</template>

<style scoped>
.logo {
  font-family: 'Inter', 'Pretendard', -apple-system, system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-primary);
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.logo__dot {
  display: inline-block;
  border-radius: 50%;
  background: var(--color-primary);
  margin-left: 2px;
  flex-shrink: 0;
}
</style>
