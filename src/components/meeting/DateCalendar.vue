<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  dateRangeStart: string
  dateRangeEnd: string
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [dates: string[]]
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

function isSelected(day: dayjs.Dayjs) {
  return props.modelValue.includes(day.format('YYYY-MM-DD'))
}

function toggleDate(day: dayjs.Dayjs) {
  if (!isInRange(day)) return
  const key = day.format('YYYY-MM-DD')
  const next = props.modelValue.includes(key)
    ? props.modelValue.filter((d) => d !== key)
    : [...props.modelValue, key]
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="calendar">
    <div class="calendar__nav">
      <button :disabled="!canPrev" @click="currentMonth = currentMonth.subtract(1, 'month')">
        ‹
      </button>
      <span>{{ currentMonth.format('YYYY년 M월') }}</span>
      <button :disabled="!canNext" @click="currentMonth = currentMonth.add(1, 'month')">›</button>
    </div>
    <div class="calendar__week-row">
      <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
    </div>
    <div class="calendar__grid">
      <template v-for="(day, i) in daysInView" :key="i">
        <div v-if="day === null" class="calendar__cell" />
        <button
          v-else
          :class="[
            'calendar__cell',
            'calendar__day',
            {
              'calendar__day--in-range': isInRange(day),
              'calendar__day--selected': isSelected(day),
              'calendar__day--out': !isInRange(day),
            },
          ]"
          :disabled="!isInRange(day)"
          @click="toggleDate(day)"
        >
          {{ day.date() }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.calendar { width: 100%; }
.calendar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.calendar__nav span { font-weight: 700; font-size: 15px; }
.calendar__nav button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 4px 10px;
  line-height: 1;
  border-radius: var(--radius-sm);
}
.calendar__nav button:disabled { color: var(--color-text-tertiary); cursor: not-allowed; }
.calendar__week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 4px 0;
}
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.calendar__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.calendar__day--out {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}
.calendar__day--in-range { color: var(--color-text-primary); }
.calendar__day--in-range:hover:not(.calendar__day--selected) {
  background: var(--color-primary-light);
}
.calendar__day--selected {
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}
</style>
