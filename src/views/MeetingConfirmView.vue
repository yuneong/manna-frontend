<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting, useHeatmap, useConfirmDate } from '../composables/useMeeting'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)

const selectedDate = ref<Date | null>(null)
const serverError = ref<string | null>(null)

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { mutate: confirmDate, isPending } = useConfirmDate(meetingId)

const heatmap = computed(() => heatmapData.value?.heatmap ?? {})
const participantNames = computed(() =>
  (meeting.value?.participants ?? []).map((p) => p.nickname),
)
const totalParticipants = computed(() => participantNames.value.length)

// --- Date helpers ---
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtDateKo(d: Date): string {
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
}
function gridDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const gridStart = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}
function inRange(d: Date, s: Date, e: Date): boolean {
  const dd = startOfDay(d)
  return dd >= startOfDay(s) && dd <= startOfDay(e)
}

const startDate = computed(() => meeting.value ? new Date(meeting.value.dateRangeStart) : null)
const endDate = computed(() => meeting.value ? new Date(meeting.value.dateRangeEnd) : null)

// Calendar navigation
const calYear = ref(0)
const calMonth = ref(0)
let calInitialized = false
watch(startDate, (d) => {
  if (d && !calInitialized) {
    calYear.value = d.getFullYear()
    calMonth.value = d.getMonth()
    calInitialized = true
  }
}, { immediate: true })

const calDays = computed(() => gridDays(calYear.value, calMonth.value))
const canPrev = computed(() =>
  !!startDate.value && !(calYear.value === startDate.value.getFullYear() && calMonth.value === startDate.value.getMonth())
)
const canNext = computed(() =>
  !!endDate.value && !(calYear.value === endDate.value.getFullYear() && calMonth.value === endDate.value.getMonth())
)
function prevMonth() {
  if (calMonth.value === 0) { calYear.value--; calMonth.value = 11 } else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 11) { calYear.value++; calMonth.value = 0 } else calMonth.value++
}

// Derived state for selected date
const selectedKey = computed(() => selectedDate.value ? ymd(selectedDate.value) : null)
const selectedCount = computed(() => (selectedKey.value ? heatmap.value[selectedKey.value] : 0) ?? 0)
const isAllAvailable = computed(() => totalParticipants.value > 0 && selectedCount.value === totalParticipants.value)
const isPartial = computed(() => selectedCount.value > 0 && selectedCount.value < totalParticipants.value)

// Heatmap helpers
function heatColor(count: number, total: number): string {
  if (!count || !total) return 'transparent'
  return `hsl(247, 50%, ${92 - (count / total) * 55}%)`
}
function heatTextColor(count: number, total: number): string {
  if (!count) return 'var(--color-text-placeholder)'
  return count / total > 0.55 ? '#fff' : 'var(--color-primary)'
}

const legendSteps = computed(() => {
  const t = totalParticipants.value || 4
  return [1, Math.ceil(t / 3), Math.ceil((2 * t) / 3), t]
})

// Participant avatar palette
const palette = ['#534AB7','#0F6E56','#C8362B','#D89B1A','#3B70C9','#8E4FBE']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

// Confirm action
function confirm() {
  if (!selectedDate.value) return
  serverError.value = null
  confirmDate(
    { confirmedDate: ymd(selectedDate.value) },
    {
      onError: (e: any) => {
        serverError.value = e.response?.data?.message || '날짜 확정에 실패했습니다.'
      },
    },
  )
}
</script>

<template>
  <div class="confirm">
    <div v-if="isLoading" class="confirm__loading">불러오는 중...</div>

    <template v-else-if="meeting">
      <div class="confirm__inner">

        <!-- Back -->
        <button class="back-btn" @click="router.back()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          약속방으로
        </button>

        <!-- Title -->
        <div class="confirm__heading">
          <div class="confirm__badge">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M5.5 1l1 3 3 .5-2 2 .5 3-2.5-1.5L3 9.5l.5-3-2-2 3-.5L5.5 1z" fill="currentColor"/>
            </svg>
            방장 전용 · 날짜 확정
          </div>
          <h1>{{ meeting.title }}의 날짜를 확정해요</h1>
          <p>
            전원 가능한 날짜는 <span class="confirm__hint-green">초록 테두리</span>로 표시했어요.
            확정 후에는 변경할 수 없으니 신중하게 골라주세요.
          </p>
        </div>

        <!-- Server error -->
        <div v-if="serverError" class="confirm__server-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="confirm__server-error-icon">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 4.5v4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="8" cy="11.2" r="0.8" fill="currentColor"/>
          </svg>
          {{ serverError }}
        </div>

        <!-- 2-column body -->
        <div class="confirm__body">

          <!-- Calendar card -->
          <div class="cal-card">
            <div class="cal-card__top">
              <div class="cal-card__top-left">
                <button class="cal-nav-btn" :disabled="!canPrev" @click="prevMonth">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span class="cal-card__month">{{ calYear }}년 {{ MONTHS[calMonth] }}</span>
                <button class="cal-nav-btn" :disabled="!canNext" @click="nextMonth">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="heat-legend">
                <span class="heat-legend__label">1명</span>
                <div
                  v-for="s in legendSteps" :key="s"
                  class="heat-legend__swatch"
                  :style="{ background: heatColor(s, totalParticipants || 4) }"
                />
                <span class="heat-legend__label">전원</span>
              </div>
            </div>

            <div class="cal-weekdays">
              <div v-for="(d, i) in DAYS" :key="d"
                :class="['cal-weekday', i===0 && 'cal-weekday--sun', i===6 && 'cal-weekday--sat']"
              >{{ d }}</div>
            </div>

            <div class="cal-grid">
              <div v-for="(d, i) in calDays" :key="i" class="cal-grid__cell">
                <template v-if="startDate && endDate && inRange(d, startDate, endDate)">
                  <div
                    :class="[
                      'heat-cell',
                      !heatmap[ymd(d)] && 'heat-cell--empty',
                      selectedKey === ymd(d) && 'heat-cell--selected',
                      selectedKey !== ymd(d) && heatmap[ymd(d)] === totalParticipants && totalParticipants > 0 && 'heat-cell--all',
                    ]"
                    :style="{
                      background: heatmap[ymd(d)] ? heatColor(heatmap[ymd(d)], totalParticipants) : '#FAFAFB',
                      cursor: heatmap[ymd(d)] ? 'pointer' : 'not-allowed',
                    }"
                    @click="heatmap[ymd(d)] && (selectedDate = d)"
                  >
                    <div class="heat-cell__top-row">
                      <span class="heat-cell__num" :style="{ color: heatTextColor(heatmap[ymd(d)] || 0, totalParticipants) }">
                        {{ d.getDate() }}
                      </span>
                      <span class="heat-cell__dow" :style="{ color: heatTextColor(heatmap[ymd(d)] || 0, totalParticipants) }">
                        {{ DAYS[d.getDay()] }}
                      </span>
                    </div>
                    <div class="heat-cell__count" :style="{ color: heatTextColor(heatmap[ymd(d)] || 0, totalParticipants) }">
                      {{ heatmap[ymd(d)] || 0 }}/{{ totalParticipants }}
                    </div>
                    <!-- All-available badge -->
                    <div
                      v-if="selectedKey !== ymd(d) && heatmap[ymd(d)] === totalParticipants && totalParticipants > 0"
                      class="heat-cell__all-badge"
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                        <path d="M2 5l1.5 1.5 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </template>
                <div v-else class="cal-grid__empty">
                  {{ startDate && endDate && d.getMonth() === calMonth ? d.getDate() : '' }}
                </div>
              </div>
            </div>

            <!-- Legend keys -->
            <div class="cal-card__legend">
              <span class="legend-item">
                <span class="legend-swatch legend-swatch--all" :style="{ background: heatColor(totalParticipants || 4, totalParticipants || 4) }" />
                전원 가능
              </span>
              <span class="legend-item">
                <span class="legend-swatch legend-swatch--selected" />
                선택됨
              </span>
              <span class="legend-item">
                <span class="legend-swatch legend-swatch--empty" />
                응답 없음
              </span>
            </div>
          </div>

          <!-- Selected date detail card -->
          <!-- Empty state -->
          <div v-if="!selectedDate" class="date-card date-card--empty">
            <div class="date-card__empty-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
                <path d="M3 9h16" stroke="currentColor" stroke-width="1.6"/>
                <path d="M7 3v3M15 3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="date-card__empty-title">확정할 날짜를 선택해주세요</div>
            <div class="date-card__empty-sub">
              캘린더에서 날짜를 클릭하면<br>
              가능 인원을 미리 볼 수 있어요
            </div>
          </div>

          <!-- Filled state -->
          <div v-else :class="['date-card', isAllAvailable && 'date-card--all']">
            <!-- Top strip -->
            <div :class="['date-strip', isAllAvailable && 'date-strip--success']">
              <div>
                <div :class="['date-strip__label', isAllAvailable && 'date-strip__label--success']">선택한 날짜</div>
                <div class="date-strip__date">
                  {{ selectedDate.getMonth()+1 }}월 {{ selectedDate.getDate() }}일
                  <span class="date-strip__dow">({{ DAYS[selectedDate.getDay()] }})</span>
                </div>
              </div>
              <div v-if="isAllAvailable" class="all-badge">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M2.5 6l2 2 4-4.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                전원 가능
              </div>
            </div>

            <!-- Count + progress -->
            <div class="date-count">
              <div>
                <div class="date-count__label">참여 가능</div>
                <div :class="['date-count__num', isAllAvailable ? 'date-count__num--success' : 'date-count__num--primary']">
                  {{ selectedCount }}<span class="date-count__total">/{{ totalParticipants }}명</span>
                </div>
              </div>
              <div class="date-count__bar-wrap">
                <div
                  :class="['date-count__bar', isAllAvailable && 'date-count__bar--success']"
                  :style="{ width: `${totalParticipants ? (selectedCount / totalParticipants) * 100 : 0}%` }"
                />
              </div>
            </div>

            <!-- Partial warning -->
            <div v-if="isPartial" class="partial-warning">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="partial-warning__icon">
                <path d="M7 1.5l6 11H1l6-11z" stroke="#D89B1A" stroke-width="1.3" stroke-linejoin="round"/>
                <path d="M7 5.5V8" stroke="#D89B1A" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="7" cy="10" r="0.7" fill="#D89B1A"/>
              </svg>
              <span>
                <b>{{ totalParticipants - selectedCount }}명</b>은 참여할 수 없습니다.
                정말 이 날짜로 확정하시겠어요?
              </span>
            </div>

            <!-- Participants -->
            <div class="date-participants">
              <div class="date-participants__label">
                참여자 ({{ selectedCount }}명 가능 · {{ totalParticipants - selectedCount }}명 불가)
              </div>
              <div class="date-participants__grid">
                <div
                  v-for="name in participantNames"
                  :key="name"
                  class="participant"
                >
                  <div class="participant__avatar" :style="{ background: avatarColor(name) }">
                    {{ name[0] }}
                  </div>
                  <span class="participant__name">{{ name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action bar -->
        <div class="action-bar">
          <div :class="['action-bar__label', !selectedDate && 'action-bar__label--muted']">
            <template v-if="!selectedDate">위에서 날짜를 선택해주세요</template>
            <template v-else-if="isAllAvailable">
              <b class="action-bar__date action-bar__date--success">{{ fmtDateKo(selectedDate) }}</b>로
              확정합니다 · 모두 참여 가능해요 🎉
            </template>
            <template v-else-if="isPartial">
              <b class="action-bar__date">{{ fmtDateKo(selectedDate) }}</b>
              · {{ selectedCount }}/{{ totalParticipants }}명만 가능합니다
            </template>
          </div>
          <button
            :disabled="!selectedDate || isPending"
            :class="['confirm-btn',
              (!selectedDate || isPending) && 'confirm-btn--disabled',
              isPartial && selectedDate && 'confirm-btn--warning',
              isAllAvailable && 'confirm-btn--success',
            ]"
            @click="confirm"
          >
            <span v-if="isPending" class="confirm-btn__spinner" />
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8l3.5 3.5L13 5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ isPartial ? '그래도 확정하기' : '이 날짜로 확정하기' }}
          </button>
        </div>

      </div>
    </template>

    <div v-else-if="!isLoading" class="confirm__loading">약속을 찾을 수 없습니다.</div>
  </div>
</template>

<style scoped>
.confirm {
  background: var(--color-bg-secondary, #f8f8fb);
  min-height: calc(100vh - 56px);
}
.confirm__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.confirm__loading {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-secondary);
  font-size: 15px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 6px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  margin-bottom: 8px;
  margin-left: -6px;
  transition: background 0.12s, color 0.12s;
}
.back-btn:hover { background: #f4f4f6; color: var(--color-text-primary); }

/* Heading */
.confirm__heading { margin-bottom: 28px; }
.confirm__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(83, 74, 183, 0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}
.confirm__heading h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.15;
}
.confirm__heading p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: -0.01em;
}
.confirm__hint-green { color: var(--color-success); font-weight: 600; }

/* Server error */
.confirm__server-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 14px;
  background: var(--color-error-bg);
  border: 1px solid rgba(200, 54, 43, 0.2);
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-error);
  font-weight: 500;
  margin-bottom: 20px;
}
.confirm__server-error-icon { flex-shrink: 0; margin-top: 1px; }

/* Body 2-col grid */
.confirm__body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
  margin-bottom: 20px;
}

/* Calendar card */
.cal-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 20px 22px;
}
.cal-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
  flex-wrap: wrap;
}
.cal-card__top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cal-card__month {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
.cal-nav-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: background 0.1s;
}
.cal-nav-btn:hover:not(:disabled) { background: #f4f4f6; }
.cal-nav-btn:disabled { opacity: 0.25; cursor: default; }

/* Heat legend */
.heat-legend { display: flex; align-items: center; gap: 4px; }
.heat-legend__label { font-size: 11.5px; color: var(--color-text-secondary); font-weight: 500; }
.heat-legend__swatch {
  width: 18px; height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.04);
}

/* Weekdays + grid */
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}
.cal-weekday {
  text-align: center;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-text-placeholder);
  padding: 6px 0;
  letter-spacing: 0.02em;
}
.cal-weekday--sun { color: #C8362B; }
.cal-weekday--sat { color: #3B70C9; }
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-grid__cell { aspect-ratio: 1; position: relative; overflow: visible; }
.cal-grid__empty {
  width: 100%; height: 100%;
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 6px 8px;
  color: #D5D5DC;
  font-size: 12px;
  font-weight: 500;
  box-sizing: border-box;
}

/* Heat cells */
.heat-cell {
  width: 100%; height: 100%;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: transform 0.12s, box-shadow 0.12s;
  box-sizing: border-box;
}
.heat-cell--empty { border-color: #EFEFF3; }
.heat-cell--all { border: 2px solid var(--color-success); }
.heat-cell--selected {
  border: 2px solid var(--color-primary);
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0,0,0,0.10);
  z-index: 1;
}
.heat-cell:not(.heat-cell--empty):not(.heat-cell--selected):hover {
  transform: scale(1.02);
}
.heat-cell__top-row {
  display: flex; align-items: center; justify-content: space-between; gap: 2px;
}
.heat-cell__num { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.heat-cell__dow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.02em; opacity: 0.85; }
.heat-cell__count { font-size: 12.5px; font-weight: 700; letter-spacing: -0.01em; }
.heat-cell__all-badge {
  position: absolute;
  top: -6px; right: -6px;
  width: 18px; height: 18px;
  background: var(--color-success);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(15, 110, 86, 0.35);
  border: 2px solid #fff;
}

/* Calendar legend */
.cal-card__legend {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.legend-swatch {
  width: 14px; height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-swatch--all { border: 2px solid var(--color-success); }
.legend-swatch--selected { border: 2px solid var(--color-primary); background: rgba(83,74,183,0.12); }
.legend-swatch--empty { border: 1px solid #EFEFF3; background: #FAFAFB; }

/* Date detail card */
.date-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}
.date-card--all { border-color: rgba(15, 110, 86, 0.25); }
.date-card--empty {
  background: var(--color-bg-secondary, #f8f8fb);
  border: none;
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.date-card__empty-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: rgba(83, 74, 183, 0.10);
  color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.date-card__empty-title {
  font-size: 15px; font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}
.date-card__empty-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

/* Date strip */
.date-strip {
  background: rgba(83, 74, 183, 0.08);
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.date-strip--success {
  background: rgba(15, 110, 86, 0.08);
  border-bottom-color: rgba(15, 110, 86, 0.15);
}
.date-strip__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.date-strip__label--success { color: var(--color-success); }
.date-strip__date {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.date-strip__dow {
  margin-left: 6px;
  color: var(--color-text-secondary);
  font-size: 16px;
  font-weight: 600;
}
.all-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: var(--color-success);
  color: #fff;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 6px rgba(15, 110, 86, 0.25);
  flex-shrink: 0;
}

/* Count row */
.date-count {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
}
.date-count__label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}
.date-count__num {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}
.date-count__num--primary { color: var(--color-primary); }
.date-count__num--success { color: var(--color-success); }
.date-count__total {
  color: var(--color-text-placeholder);
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
}
.date-count__bar-wrap {
  flex: 1;
  height: 6px;
  background: #EFEFF3;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 14px;
}
.date-count__bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.2s;
}
.date-count__bar--success { background: var(--color-success); }

/* Partial warning */
.partial-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 14px 18px 0;
  padding: 11px 13px;
  background: rgba(216, 155, 26, 0.08);
  border: 1px solid rgba(216, 155, 26, 0.22);
  border-radius: 9px;
  font-size: 12.5px;
  color: #7A5408;
  font-weight: 500;
  line-height: 1.5;
}
.partial-warning__icon { flex-shrink: 0; margin-top: 1px; }
.partial-warning b { color: #7A5408; font-weight: 700; }

/* Participants */
.date-participants { padding: 18px; }
.date-participants__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
  margin-bottom: 12px;
}
.date-participants__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 16px;
}
.participant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.participant__avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: -0.02em;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.participant__name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

/* Action bar */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
}
.action-bar__label {
  font-size: 13.5px;
  color: var(--color-text-primary);
  font-weight: 500;
  line-height: 1.5;
}
.action-bar__label--muted { color: var(--color-text-secondary); }
.action-bar__date { font-weight: 700; }
.action-bar__date--success { color: var(--color-success); }

/* Confirm button */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--color-success);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  min-width: 200px;
  flex-shrink: 0;
  transition: background 0.12s, box-shadow 0.12s;
  box-shadow: 0 2px 6px rgba(15, 110, 86, 0.28);
}
.confirm-btn--success { background: var(--color-success); }
.confirm-btn--warning { background: #B07614; box-shadow: 0 2px 6px rgba(176, 118, 20, 0.28); }
.confirm-btn--success:hover:not(:disabled) { background: #0A5A47; box-shadow: 0 6px 18px rgba(15, 110, 86, 0.28); }
.confirm-btn--warning:hover:not(:disabled) { background: #8E5E0F; }
.confirm-btn--disabled, .confirm-btn:disabled {
  background: #C9CECD;
  cursor: not-allowed;
  box-shadow: none;
}
.confirm-btn__spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 767px) {
  .confirm__inner { padding: 12px 16px 80px; }
  .confirm__heading h1 { font-size: 22px; }
  .confirm__body { grid-template-columns: 1fr; }
  .cal-card { padding: 14px 12px; }
  .heat-cell__num { font-size: 14px; }
  .heat-cell__count { font-size: 11px; }
  .heat-cell__all-badge { display: none; }
  .action-bar { flex-direction: column; }
  .confirm-btn { width: 100%; }
  .action-bar__label { text-align: center; }
}
</style>
