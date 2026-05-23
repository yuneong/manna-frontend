<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  canEdit: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)

function onMousedown(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onMousedown))
onUnmounted(() => document.removeEventListener('mousedown', onMousedown))

function onEditClick() {
  if (!props.canEdit) return
  emit('edit')
  open.value = false
}

function onDeleteClick() {
  emit('delete')
  open.value = false
}
</script>

<template>
  <div ref="wrapRef" class="kebab">
    <button class="kebab__trigger" :class="open && 'kebab__trigger--open'" @click.stop="open = !open" aria-label="더보기">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="3" r="1.3" fill="currentColor"/>
        <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
        <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
      </svg>
    </button>

    <Transition name="menu">
      <div v-if="open" class="kebab__menu" @click.stop>
        <div class="kebab__item-wrap">
          <button
            :class="['kebab__item', !canEdit && 'kebab__item--disabled']"
            @click="onEditClick"
            @mouseenter="!canEdit && (showTooltip = true)"
            @mouseleave="showTooltip = false"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            수정하기
          </button>
          <div v-if="showTooltip && !canEdit" class="kebab__tooltip">
            확정된 약속은 수정할 수 없어요.<br>확정을 먼저 취소해주세요.
          </div>
        </div>
        <div class="kebab__divider" />
        <button class="kebab__item kebab__item--danger" @click="onDeleteClick">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          삭제하기
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kebab {
  position: relative;
  flex-shrink: 0;
}
.kebab__trigger {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: background 0.12s, color 0.12s;
}
.kebab__trigger:hover,
.kebab__trigger--open {
  background: #f4f4f6;
  color: var(--color-text-primary);
}
.kebab__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 156px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  padding: 4px;
  overflow: visible;
}
.kebab__item-wrap {
  position: relative;
}
.kebab__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.1s;
  text-align: left;
}
.kebab__item:hover:not(.kebab__item--disabled):not(.kebab__item--danger) {
  background: #f4f4f6;
}
.kebab__item--disabled {
  color: var(--color-text-placeholder);
  cursor: not-allowed;
}
.kebab__item--danger {
  color: #C8362B;
}
.kebab__item--danger:hover {
  background: rgba(200, 54, 43, 0.06);
}
.kebab__divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
.kebab__tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #1E1E2E;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  line-height: 1.5;
  text-align: center;
  z-index: 200;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.kebab__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1E1E2E;
}
.menu-enter-active { transition: opacity 0.1s, transform 0.1s; }
.menu-leave-active { transition: opacity 0.08s, transform 0.08s; }
.menu-enter-from { opacity: 0; transform: translateY(-4px) scale(0.97); }
.menu-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
