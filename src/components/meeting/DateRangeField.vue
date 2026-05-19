<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import RangeCalendar from './RangeCalendar.vue'

const props = defineProps<{
  start: Date | null
  end: Date | null
  error?: boolean
}>()

const emit = defineEmits<{
  change: [start: Date | null, end: Date | null]
}>()

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function fmtKo(d: Date | null): string {
  if (!d) return ''
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${DAYS[d.getDay()]})`
}

const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

function onMousedown(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onMousedown))
onUnmounted(() => document.removeEventListener('mousedown', onMousedown))

function handleChange(s: Date | null, e: Date | null) {
  emit('change', s, e)
  if (s && e) setTimeout(() => { open.value = false }, 150)
}
</script>

<template>
  <div ref="wrapRef" class="drf">
    <div class="drf__row">
      <div
        :class="['drf__box', open && 'drf__box--open', error && 'drf__box--error']"
        @click="open = true"
      >
        <div class="drf__box-label">시작일</div>
        <div :class="['drf__box-value', !start && 'drf__box-value--placeholder']">
          {{ start ? fmtKo(start) : '날짜 선택' }}
        </div>
      </div>
      <span class="drf__arrow">→</span>
      <div
        :class="['drf__box', open && 'drf__box--open', error && 'drf__box--error']"
        @click="open = true"
      >
        <div class="drf__box-label">종료일</div>
        <div :class="['drf__box-value', !end && 'drf__box-value--placeholder']">
          {{ end ? fmtKo(end) : '날짜 선택' }}
        </div>
      </div>
    </div>

    <div v-if="open" class="drf__dropdown">
      <RangeCalendar
        :start="start"
        :end="end"
        :error="error"
        @change="handleChange"
      />
    </div>
  </div>
</template>

<style scoped>
.drf { position: relative; }
.drf__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.drf__box {
  flex: 1;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.12s;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.drf__box--open { border-color: var(--color-primary); }
.drf__box--error { border-color: var(--color-error); }
.drf__box-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}
.drf__box-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drf__box-value--placeholder {
  font-weight: 400;
  color: var(--color-text-placeholder);
}
.drf__arrow {
  color: var(--color-text-placeholder);
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}
.drf__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}
</style>
