<script setup lang="ts">
import { ref, computed } from 'vue'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const props = defineProps<{
  start: Date | null
  end: Date | null
  error?: boolean
}>()

const emit = defineEmits<{
  change: [start: Date | null, end: Date | null]
}>()

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
function sameDay(a: Date | null, b: Date | null): boolean {
  return !!(a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate())
}
function fmtShort(d: Date | null): string {
  return d ? `${d.getMonth()+1}/${d.getDate()}` : ''
}

const today = startOfDay(new Date())
const now = new Date()
const cursorYear = ref(now.getFullYear())
const cursorMonth = ref(now.getMonth())
const hover = ref<Date | null>(null)

const headerText = computed(() => `${cursorYear.value}년 ${MONTHS[cursorMonth.value]}`)

const days = computed(() => {
  const first = new Date(cursorYear.value, cursorMonth.value, 1)
  const gridStart = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
})

const previewStart = computed<Date | null>(() => {
  if (props.start && !props.end && hover.value && hover.value < props.start) return hover.value
  return props.start
})

const previewEnd = computed<Date | null>(() => {
  if (props.start && !props.end && hover.value && hover.value >= props.start) return hover.value
  return props.end
})

function inRange(d: Date): boolean {
  return !!(previewStart.value && previewEnd.value && d >= previewStart.value && d <= previewEnd.value)
}

function pillClasses(d: Date): string[] {
  const classes = ['cal__pill']
  const sel = sameDay(d, previewStart.value) || sameDay(d, previewEnd.value)
  if (sel) {
    classes.push('cal__pill--selected')
  } else {
    if (d.getMonth() !== cursorMonth.value) classes.push('cal__pill--other-month')
    if (d.getDay() === 0) classes.push('cal__pill--sun')
    else if (d.getDay() === 6) classes.push('cal__pill--sat')
    if (sameDay(d, today)) classes.push('cal__pill--today')
  }
  return classes
}

function prevMonth() {
  if (cursorMonth.value === 0) { cursorYear.value--; cursorMonth.value = 11 }
  else cursorMonth.value--
}
function nextMonth() {
  if (cursorMonth.value === 11) { cursorYear.value++; cursorMonth.value = 0 }
  else cursorMonth.value++
}

function click(d: Date) {
  if (!props.start || (props.start && props.end)) {
    emit('change', startOfDay(d), null)
  } else {
    if (d < props.start) emit('change', startOfDay(d), startOfDay(props.start))
    else if (sameDay(d, props.start)) emit('change', startOfDay(d), startOfDay(d))
    else emit('change', startOfDay(props.start), startOfDay(d))
  }
}

const helperText = computed(() => {
  if (!props.start) return '시작일을 선택해주세요'
  if (!props.end) return '종료일을 선택해주세요'
  const diff = Math.round((props.end.getTime() - props.start.getTime()) / 86400000) + 1
  return `${fmtShort(props.start)} – ${fmtShort(props.end)} (${diff}일)`
})
</script>

<template>
  <div :class="['cal', error && 'cal--error']">
    <div class="cal__header">
      <button type="button" class="cal__nav-btn" aria-label="이전 달" @click="prevMonth">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="cal__month-label">{{ headerText }}</span>
      <button type="button" class="cal__nav-btn" aria-label="다음 달" @click="nextMonth">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="cal__weekdays">
      <div
        v-for="(d, i) in DAYS"
        :key="d"
        :class="['cal__weekday', i===0 && 'cal__weekday--sun', i===6 && 'cal__weekday--sat']"
      >{{ d }}</div>
    </div>

    <div class="cal__grid">
      <button
        v-for="(d, i) in days"
        :key="i"
        type="button"
        class="cal__cell"
        @click="click(d)"
        @mouseenter="hover = d"
        @mouseleave="hover = null"
      >
        <div
          v-if="inRange(d) && !(sameDay(d, previewStart) && sameDay(d, previewEnd))"
          :class="[
            'cal__range-fill',
            sameDay(d, previewStart) && 'cal__range-fill--start',
            sameDay(d, previewEnd) && 'cal__range-fill--end',
          ]"
        />
        <div :class="pillClasses(d)">{{ d.getDate() }}</div>
      </button>
    </div>

    <div class="cal__footer">
      <span>{{ helperText }}</span>
      <button
        v-if="start || end"
        type="button"
        class="cal__reset"
        @click="$emit('change', null, null)"
      >초기화</button>
    </div>
  </div>
</template>

<style scoped>
.cal {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 16px 16px;
  user-select: none;
}
.cal--error { border-color: var(--color-error); }
.cal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal__nav-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: background 0.1s;
}
.cal__nav-btn:hover { background: #f4f4f6; }
.cal__month-label {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
.cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.cal__weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-placeholder);
  padding: 6px 0;
  letter-spacing: 0.02em;
}
.cal__weekday--sun { color: #C8362B; }
.cal__weekday--sat { color: #3B70C9; }
.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal__cell {
  position: relative;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal__range-fill {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  right: 0;
  background: rgba(83, 74, 183, 0.12);
  pointer-events: none;
}
.cal__range-fill--start { left: 50%; }
.cal__range-fill--end { right: 50%; }
.cal__pill {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: background 0.1s;
}
.cal__pill--other-month { color: #D5D5DC; }
.cal__pill--sun { color: #C8362B; }
.cal__pill--sat { color: #3B70C9; }
.cal__pill--today {
  border: 1.2px solid var(--color-primary);
  font-weight: 600;
}
.cal__pill--selected {
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  border: none;
}
.cal__footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12.5px;
  color: var(--color-text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.cal__reset {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  flex-shrink: 0;
}
</style>
