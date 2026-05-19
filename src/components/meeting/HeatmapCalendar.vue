<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  dateRangeStart: string
  dateRangeEnd: string
  heatmap: Record<string, number>
  totalParticipants?: number
  selectedDate?: string
  selectable?: boolean
}>()

const emit = defineEmits<{
  select: [date: string]
}>()

const currentMonth = ref(dayjs(props.dateRangeStart).startOf('month'))

const daysInView = computed(() => {
  const start = currentMonth.value.startOf('month')
  const end = currentMonth.value.endOf('month')
  const days: (dayjs.Dayjs | null)[] = []
  for (let i = 0; i < start.day(); i++) days.push(null)
  for (let d = start; !d.isAfter(end, 'day'); d = d.add(1, 'day')) days.push(d)
  return days
})

const rangeStart = computed(() => dayjs(props.dateRangeStart))
const rangeEnd = computed(() => dayjs(props.dateRangeEnd))
const canPrev = computed(() => !currentMonth.value.isSame(rangeStart.value, 'month'))
const canNext = computed(() => !currentMonth.value.isSame(rangeEnd.value, 'month'))

function isInRange(day: dayjs.Dayjs) {
  return !day.isBefore(rangeStart.value, 'day') && !day.isAfter(rangeEnd.value, 'day')
}

function getCount(day: dayjs.Dayjs) {
  return props.heatmap[day.format('YYYY-MM-DD')] ?? 0
}

function getColor(day: dayjs.Dayjs): string {
  const count = getCount(day)
  const total = props.totalParticipants || 1
  if (count === 0) return 'transparent'
  const ratio = count / total
  if (ratio <= 0.25) return '#EEEDFE'
  if (ratio <= 0.5) return '#AFA9EC'
  if (ratio < 1) return '#7B74D4'
  return '#534AB7'
}

function isAllAvailable(day: dayjs.Dayjs) {
  return !!props.totalParticipants && getCount(day) === props.totalParticipants
}

function isSelected(day: dayjs.Dayjs) {
  return props.selectedDate === day.format('YYYY-MM-DD')
}

function selectDate(day: dayjs.Dayjs) {
  if (!props.selectable || !isInRange(day)) return
  emit('select', day.format('YYYY-MM-DD'))
}
</script>

<template>
  <div class="heatmap">
    <div class="heatmap__nav">
      <button :disabled="!canPrev" @click="currentMonth = currentMonth.subtract(1, 'month')">
        ‹
      </button>
      <span>{{ currentMonth.format('YYYY년 M월') }}</span>
      <button :disabled="!canNext" @click="currentMonth = currentMonth.add(1, 'month')">›</button>
    </div>
    <div class="heatmap__week-row">
      <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
    </div>
    <div class="heatmap__grid">
      <template v-for="(day, i) in daysInView" :key="i">
        <div v-if="day === null" class="heatmap__cell" />
        <button
          v-else-if="isInRange(day)"
          :class="[
            'heatmap__cell',
            'heatmap__day',
            {
              'heatmap__day--all': isAllAvailable(day),
              'heatmap__day--selected': isSelected(day),
              'heatmap__day--selectable': selectable,
            },
          ]"
          :style="isSelected(day) ? {} : { backgroundColor: getColor(day) }"
          :title="`${getCount(day)}명 가능`"
          @click="selectDate(day)"
        >
          <span class="heatmap__date">{{ day.date() }}</span>
          <span class="heatmap__count">{{ getCount(day) }}명</span>
        </button>
        <div v-else class="heatmap__cell heatmap__day--out">{{ day.date() }}</div>
      </template>
    </div>
    <div class="heatmap__legend">
      <span>적음</span>
      <span class="legend-box" style="background: #eeedfe" />
      <span class="legend-box" style="background: #afa9ec" />
      <span class="legend-box" style="background: #7b74d4" />
      <span class="legend-box" style="background: #534ab7" />
      <span>많음</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap { width: 100%; }
.heatmap__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.heatmap__nav span { font-weight: 700; font-size: 15px; }
.heatmap__nav button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 4px 10px;
  line-height: 1;
  border-radius: var(--radius-sm);
}
.heatmap__nav button:disabled { color: var(--color-text-tertiary); cursor: not-allowed; }
.heatmap__week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 4px 0;
}
.heatmap__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.heatmap__cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  gap: 1px;
}
.heatmap__day {
  cursor: default;
}
.heatmap__day--selectable { cursor: pointer; }
.heatmap__day--selectable:hover { outline: 2px solid var(--color-primary-medium); }
.heatmap__day--out {
  color: var(--color-text-tertiary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.heatmap__date { font-size: 13px; font-weight: 600; }
.heatmap__count { font-size: 10px; color: var(--color-text-secondary); }
.heatmap__day--all { outline: 2px solid var(--color-primary); outline-offset: -2px; }
.heatmap__day--selected {
  background: var(--color-primary) !important;
  color: #fff;
}
.heatmap__day--selected .heatmap__count { color: rgba(255, 255, 255, 0.8); }
.heatmap__legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  justify-content: flex-end;
}
.legend-box {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
</style>
