<script setup lang="ts">
import logoImg from '../../assets/manna-header-48.png'

withDefaults(defineProps<{ size?: number; textOnly?: boolean }>(), { size: 36, textOnly: false })
</script>

<template>
  <span class="logo">
    <img v-if="!textOnly" :src="logoImg" :height="size" :width="size" alt="" class="logo__img" aria-hidden="true" />
    <span class="logo__text" :style="{ fontSize: `${size}px` }">
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
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.logo__img {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}
.logo__text {
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
