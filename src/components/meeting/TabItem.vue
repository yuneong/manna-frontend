<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  label: string
  active?: boolean
  locked?: boolean
  lockHint?: string
  level?: 1 | 2
}>(), {
  active: false,
  locked: false,
  level: 1,
})

const emit = defineEmits<{ click: [] }>()
const hover = ref(false)
</script>

<template>
  <div
    class="wrap"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <button
      :class="['btn', active && 'btn--active', locked && 'btn--locked', level === 2 && 'btn--l2']"
      :disabled="locked"
      @click="!locked && emit('click')"
    >
      {{ label }}
      <svg v-if="locked" width="11" height="11" viewBox="0 0 12 12" fill="none" class="btn__lock" aria-hidden="true">
        <rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
        <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" stroke="currentColor" stroke-width="1.2"/>
      </svg>
    </button>
    <div v-if="locked && hover && lockHint" class="tooltip">
      {{ lockHint }}
      <span class="tooltip__arrow" />
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  display: inline-flex;
}
.btn {
  padding: 14px 4px;
  margin-right: 24px;
  margin-bottom: -1px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: color 0.12s, border-color 0.12s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.btn--l2 {
  padding: 10px 4px;
  margin-right: 18px;
  font-size: 13.5px;
}
.btn--active {
  font-weight: 700;
  color: var(--color-text-primary);
  border-bottom-color: var(--color-primary);
}
.btn--locked {
  color: var(--color-text-placeholder);
  cursor: not-allowed;
}
.btn__lock { opacity: 0.7; }

.tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 7px 11px;
  background: rgba(20, 20, 30, 0.92);
  color: #fff;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 7px;
  white-space: nowrap;
  letter-spacing: -0.005em;
  z-index: 200;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
.tooltip__arrow {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: rgba(20, 20, 30, 0.92);
}
</style>
