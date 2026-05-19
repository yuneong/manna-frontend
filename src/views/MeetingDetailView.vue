<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMeeting, useHeatmap, useSetAvailability, useJoinMeeting } from '../composables/useMeeting'
import { meetingApi } from '../api/meeting'
import { useAuthStore } from '../stores/auth'
import AppBadge from '../components/common/AppBadge.vue'
import AvatarStack from '../components/common/AvatarStack.vue'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)
const authStore = useAuthStore()

const tab = ref<'mine' | 'heat'>('mine')
const selectedDates = ref<Set<string>>(new Set())
const copied = ref(false)

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { mutate: setAvailability, isPending: isSaving } = useSetAvailability(meetingId)
const { mutate: joinMeeting } = useJoinMeeting()

const isHost = computed(() => meeting.value?.hostId === authStore.user?.id)

watch(meeting, (m) => {
  if (!m || !authStore.user) return
  const isParticipant = m.participants?.some((p) => p.id === authStore.user!.id)
  if (!isParticipant) joinMeeting(meetingId)
}, { immediate: true })
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
  return dayjs(d).format('YYYY-MM-DD')
}
// "YYYY-MM-DD" 문자열을 UTC가 아닌 로컬 날짜로 파싱
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function fmtDate(d: Date): string {
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

const startDate = computed(() => meeting.value ? parseLocalDate(meeting.value.dateRangeStart) : null)
const endDate = computed(() => meeting.value ? parseLocalDate(meeting.value.dateRangeEnd) : null)

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

// My dates
function toggleDate(d: Date) {
  const key = ymd(d)
  const next = new Set(selectedDates.value)
  if (next.has(key)) next.delete(key); else next.add(key)
  selectedDates.value = next
}
function clearAll() { selectedDates.value = new Set() }

const hasSavedResponse = ref(false)
const justSaved = ref(false)

function saveDates() {
  setAvailability(
    { availableDates: [...selectedDates.value] },
    {
      onSuccess: () => {
        hasSavedResponse.value = true
        justSaved.value = true
        setTimeout(() => { justSaved.value = false }, 1600)
      },
    },
  )
}

onMounted(async () => {
  try {
    const res = await meetingApi.getMyAvailability(meetingId)
    selectedDates.value = new Set(res.data.availableDates)
    hasSavedResponse.value = true
  } catch {
    // 404(미참여) 등 에러 시 빈 상태 유지
  }
})

// Heatmap
function heatColor(count: number, total: number): string {
  if (!count) return 'transparent'
  const denom = total > 0 ? total : count
  return `hsl(247, 50%, ${92 - (count / denom) * 55}%)`
}
function heatTextColor(count: number, total: number): string {
  if (!count) return 'var(--color-text-placeholder)'
  const denom = total > 0 ? total : count
  return count / denom > 0.55 ? '#fff' : 'var(--color-primary)'
}
const maxHeatCount = computed(() => {
  const vals = Object.values(heatmap.value)
  return vals.length ? Math.max(...vals) : 0
})
const recommendedCount = computed(() =>
  Object.values(heatmap.value).filter((v) => v === maxHeatCount.value && v > 0).length
)
const legendSteps = computed(() => {
  const t = totalParticipants.value || 4
  return [1, Math.ceil(t / 3), Math.ceil((2 * t) / 3), t]
})

// Copy link
function copyLink() {
  navigator.clipboard.writeText(window.location.href).catch(() => {})
  copied.value = true
  setTimeout(() => { copied.value = false }, 1600)
}
</script>

<template>
  <div class="detail">
    <div v-if="isLoading" class="detail__loading">불러오는 중...</div>

    <template v-else-if="meeting">
      <div class="detail__inner">

        <!-- Back -->
        <button class="back-btn" @click="router.back()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          내 약속
        </button>

        <!-- Meeting header card -->
        <div class="mcard">
          <div class="mcard__top">
            <h1 class="mcard__title">{{ meeting.title }}</h1>
            <AppBadge :status="meeting.status" />
          </div>

          <div class="mcard__meta">
            <div class="mcard__meta-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="mcard__meta-icon">
                <rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M2 5.5h10" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4.5 2v2M9.5 2v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <span v-if="startDate && endDate">{{ fmtDate(startDate) }} – {{ fmtDate(endDate) }}</span>
            </div>
            <div v-if="meeting.description" class="mcard__meta-row mcard__meta-row--top">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="mcard__meta-icon" style="margin-top:3px">
                <path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <span>{{ meeting.description }}</span>
            </div>
          </div>

          <div class="mcard__footer">
            <div class="mcard__participants">
              <AvatarStack :names="participantNames" />
              <span class="mcard__participants-label">{{ participantNames.length }}명 참여</span>
            </div>
            <button :class="['copy-btn', copied && 'copy-btn--copied']" @click="copyLink">
              <template v-if="copied">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                링크 복사됨
              </template>
              <template v-else>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M5 8a2 2 0 0 0 2.83 0l2-2a2 2 0 0 0-2.83-2.83l-.42.42M8 5a2 2 0 0 0-2.83 0l-2 2a2 2 0 0 0 2.83 2.83l.42-.42" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                초대 링크 복사
              </template>
            </button>
          </div>
        </div>

        <!-- Confirmed banner -->
        <div v-if="meeting.confirmedDate" class="confirmed-banner">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M4 9l3.5 3.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          확정일: {{ new Date(meeting.confirmedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) }}
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button :class="['tab', tab === 'mine' && 'tab--active']" @click="tab = 'mine'">
            내 날짜 선택
            <span v-if="selectedDates.size > 0" :class="['tab__badge', tab === 'mine' && 'tab__badge--active']">
              {{ selectedDates.size }}
            </span>
          </button>
          <button :class="['tab', tab === 'heat' && 'tab--active']" @click="tab = 'heat'">
            전체 현황
          </button>
        </div>

        <!-- Mine tab -->
        <template v-if="tab === 'mine'">
          <div class="tab-heading">
            <div>
              <div class="tab-heading__title">가능한 날짜를 모두 선택해주세요</div>
              <div class="tab-heading__sub">클릭으로 선택 · 해제</div>
            </div>
            <div class="selected-count">{{ selectedDates.size }}일 선택됨</div>
          </div>

          <div v-if="startDate && endDate" class="cal-card">
            <div class="cal-card__header">
              <button class="cal-card__nav-btn" :disabled="!canPrev" @click="prevMonth">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="cal-card__header-center">
                <div class="cal-card__month">{{ calYear }}년 {{ MONTHS[calMonth] }}</div>
                <div class="cal-card__range">{{ fmtDate(startDate) }} – {{ fmtDate(endDate) }}</div>
              </div>
              <button class="cal-card__nav-btn" :disabled="!canNext" @click="nextMonth">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="cal-weekdays">
              <div v-for="(d, i) in DAYS" :key="d"
                :class="['cal-weekday', i===0 && 'cal-weekday--sun', i===6 && 'cal-weekday--sat']"
              >{{ d }}</div>
            </div>
            <div class="cal-grid">
              <div v-for="(d, i) in calDays" :key="i" class="cal-grid__cell">
                <template v-if="inRange(d, startDate, endDate)">
                  <button
                    :class="['select-cell', selectedDates.has(ymd(d)) && 'select-cell--selected']"
                    @click="toggleDate(d)"
                  >
                    <span :class="[
                      'select-cell__num',
                      selectedDates.has(ymd(d)) ? 'select-cell__num--white'
                        : d.getDay() === 0 ? 'select-cell__num--sun'
                        : d.getDay() === 6 ? 'select-cell__num--sat' : ''
                    ]">{{ d.getDate() }}</span>
                    <span :class="['select-cell__day', selectedDates.has(ymd(d)) && 'select-cell__day--selected']">
                      {{ DAYS[d.getDay()] }}
                    </span>
                    <svg v-if="selectedDates.has(ymd(d))" width="14" height="14" viewBox="0 0 14 14" fill="none"
                      class="select-cell__check" aria-hidden="true">
                      <path d="M3 7l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </template>
                <div v-else class="cal-grid__empty">
                  {{ d.getMonth() === calMonth ? d.getDate() : '' }}
                </div>
              </div>
            </div>
          </div>

          <div class="save-bar">
            <button class="clear-btn" @click="clearAll">모두 해제</button>
            <button
              :disabled="selectedDates.size === 0 || isSaving || justSaved"
              :class="[
                'save-btn',
                justSaved && 'save-btn--saved',
                (selectedDates.size === 0 || isSaving) && !justSaved && 'save-btn--disabled',
              ]"
              @click="saveDates"
            >
              <template v-if="isSaving">
                <span class="save-btn__spinner" />
                저장 중...
              </template>
              <template v-else-if="justSaved">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                저장되었습니다
              </template>
              <template v-else-if="hasSavedResponse">
                응답 수정하기 ({{ selectedDates.size }}일)
              </template>
              <template v-else>
                내 응답 저장하기 ({{ selectedDates.size }}일)
              </template>
            </button>
          </div>
        </template>

        <!-- Heatmap tab -->
        <template v-else>
          <div class="tab-heading">
            <div>
              <div class="tab-heading__title">모두가 가능한 날짜를 찾아봐요</div>
              <div class="tab-heading__sub">진한 색일수록 더 많은 사람이 가능한 날짜예요</div>
            </div>
            <div class="heat-legend">
              <span class="heat-legend__label">1명</span>
              <div
                v-for="s in legendSteps" :key="s"
                class="heat-legend__swatch"
                :style="{ background: heatColor(s, totalParticipants || 4) }"
              />
              <span class="heat-legend__label">전원 ({{ totalParticipants }}명)</span>
            </div>
          </div>

          <div v-if="startDate && endDate" class="cal-card">
            <div class="cal-card__header">
              <button class="cal-card__nav-btn" :disabled="!canPrev" @click="prevMonth">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="cal-card__header-center">
                <div class="cal-card__month">{{ calYear }}년 {{ MONTHS[calMonth] }}</div>
                <div v-if="recommendedCount > 0" class="heat-recommended">
                  <span class="heat-recommended__dot" />
                  추천 · 최다 가능 {{ recommendedCount }}일
                </div>
              </div>
              <button class="cal-card__nav-btn" :disabled="!canNext" @click="nextMonth">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="cal-weekdays">
              <div v-for="(d, i) in DAYS" :key="d"
                :class="['cal-weekday', i===0 && 'cal-weekday--sun', i===6 && 'cal-weekday--sat']"
              >{{ d }}</div>
            </div>
            <div class="cal-grid">
              <div v-for="(d, i) in calDays" :key="i" class="cal-grid__cell">
                <template v-if="inRange(d, startDate, endDate)">
                  <div
                    :class="['heat-cell', heatmap[ymd(d)] === maxHeatCount && maxHeatCount > 0 && 'heat-cell--top']"
                    :style="{ background: heatmap[ymd(d)] ? heatColor(heatmap[ymd(d)], totalParticipants) : '#FAFAFB' }"
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
                      {{ heatmap[ymd(d)] || 0 }}/{{ totalParticipants || '?' }}
                    </div>
                    <div v-if="heatmap[ymd(d)] === maxHeatCount && maxHeatCount > 0" class="heat-cell__star">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M5 1l1.2 2.5L9 4l-2 1.9.5 2.7L5 7.3 2.5 8.6 3 5.9 1 4l2.8-.5L5 1z" fill="#fff"/>
                      </svg>
                    </div>
                  </div>
                </template>
                <div v-else class="cal-grid__empty">
                  {{ d.getMonth() === calMonth ? d.getDate() : '' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Host CTA -->
          <div v-if="isHost && meeting.status === 'OPEN'" class="host-cta">
            <div class="host-cta__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="host-cta__text">
              <div class="host-cta__title">준비됐어요. 날짜를 확정해주세요</div>
              <div class="host-cta__sub">방장(나)만 확정할 수 있어요 · 확정 후엔 장소 정하기 단계로 넘어가요</div>
            </div>
            <button class="host-cta__btn" @click="router.push(`/meetings/${meetingId}/confirm`)">
              날짜 확정하기
            </button>
          </div>
        </template>

      </div>
    </template>

    <div v-else class="detail__loading">약속을 찾을 수 없습니다.</div>
  </div>
</template>

<style scoped>
.detail {
  background: var(--color-bg-secondary, #f8f8fb);
  min-height: calc(100vh - 56px);
}
.detail__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.detail__loading {
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

/* Meeting header card */
.mcard {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 22px 22px 20px;
  margin-bottom: 24px;
}
.mcard__top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}
.mcard__title {
  flex: 1;
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: var(--color-text-primary);
  min-width: 0;
}
.mcard__meta {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}
.mcard__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.mcard__meta-row--top { align-items: flex-start; line-height: 1.5; }
.mcard__meta-icon { flex-shrink: 0; color: var(--color-text-placeholder); }
.mcard__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.mcard__participants {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mcard__participants-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  background: #fff;
  color: var(--color-primary);
  border: 1px solid rgba(83, 74, 183, 0.25);
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.copy-btn--copied {
  background: rgba(15, 110, 86, 0.10);
  color: var(--color-success);
  border-color: rgba(15, 110, 86, 0.25);
}

/* Confirmed banner */
.confirmed-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 110, 86, 0.08);
  color: var(--color-success);
  border: 1px solid rgba(15, 110, 86, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 22px;
  gap: 4px;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  margin-right: 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: color 0.12s, border-color 0.12s;
}
.tab--active {
  font-weight: 700;
  color: var(--color-text-primary);
  border-bottom-color: var(--color-primary);
}
.tab__badge {
  padding: 2px 7px;
  background: #EFEFF3;
  color: var(--color-text-secondary);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.tab__badge--active {
  background: var(--color-primary);
  color: #fff;
}

/* Tab heading */
.tab-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.tab-heading__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
.tab-heading__sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 3px;
}
.selected-count {
  padding: 6px 12px;
  background: rgba(83, 74, 183, 0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Calendar card */
.cal-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 20px 22px;
  margin-bottom: 16px;
}
.cal-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}
.cal-card__header-center {
  flex: 1;
  text-align: center;
}
.cal-card__month {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
.cal-card__range {
  font-size: 12px;
  color: var(--color-text-placeholder);
  font-weight: 500;
  margin-top: 2px;
}
.cal-card__nav-btn {
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
  flex-shrink: 0;
}
.cal-card__nav-btn:hover:not(:disabled) { background: #f4f4f6; }
.cal-card__nav-btn:disabled { opacity: 0.25; cursor: default; }

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
.cal-grid__cell {
  aspect-ratio: 1;
  position: relative;
  overflow: visible;
}
.cal-grid__empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 6px 8px;
  color: #D5D5DC;
  font-size: 12px;
  font-weight: 500;
  box-sizing: border-box;
}

/* Select cells */
.select-cell {
  width: 100%;
  height: 100%;
  border: 1.5px solid #EAEAEE;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  font-family: inherit;
  transition: all 0.12s;
  position: relative;
  box-sizing: border-box;
}
.select-cell--selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
}
.select-cell__num {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--color-text-primary);
}
.select-cell__num--white { color: #fff; }
.select-cell__num--sun { color: #C8362B; }
.select-cell__num--sat { color: #3B70C9; }
.select-cell__day {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}
.select-cell__day--selected { color: rgba(255, 255, 255, 0.8); }
.select-cell__check {
  position: absolute;
  top: 7px;
  right: 7px;
}

/* Save bar */
.save-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
.clear-btn {
  padding: 13px 22px;
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, color 0.12s;
}
.clear-btn:hover { background: #fafafa; color: var(--color-text-primary); }
.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  min-width: 180px;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.25);
  transition: background 0.12s;
}
.save-btn:hover:not(:disabled) { background: var(--color-primary-dark); }
.save-btn--saved {
  background: var(--color-success);
  box-shadow: 0 2px 6px rgba(15, 110, 86, 0.25);
  cursor: default;
}
.save-btn--saved:hover { background: var(--color-success); }
.save-btn--disabled, .save-btn:disabled:not(.save-btn--saved) {
  background: #c9c6e4;
  cursor: not-allowed;
  box-shadow: none;
}
.save-btn__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Heatmap */
.heat-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.heat-legend__label {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.heat-legend__swatch {
  width: 18px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.heat-recommended {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 2px;
}
.heat-recommended__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--color-primary);
}
.heat-cell {
  width: 100%;
  height: 100%;
  border: 1px solid #EFEFF3;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  box-sizing: border-box;
}
.heat-cell--top {
  border: 1.5px solid var(--color-primary);
}
.heat-cell__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
}
.heat-cell__num {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}
.heat-cell__dow {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.85;
}
.heat-cell__count {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.heat-cell__star {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.35);
}

/* Host CTA */
.host-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: linear-gradient(135deg, rgba(83,74,183,0.04), rgba(83,74,183,0.10));
  border: 1px solid rgba(83, 74, 183, 0.18);
  border-radius: 12px;
  padding: 18px 20px;
  margin-top: 16px;
}
.host-cta__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.host-cta__text { flex: 1; min-width: 0; }
.host-cta__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.host-cta__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.host-cta__btn {
  padding: 11px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.25);
  transition: background 0.12s;
}
.host-cta__btn:hover { background: var(--color-primary-dark); }

@media (max-width: 767px) {
  .detail__inner { padding: 12px 16px 80px; }
  .mcard { padding: 18px 18px 16px; }
  .mcard__title { font-size: 19px; }
  .cal-card { padding: 14px 12px; }
  .select-cell__num { font-size: 14px; }
  .heat-cell__num { font-size: 13px; }
  .heat-cell__count { font-size: 11px; }
  .heat-cell__star { display: none; }
  .host-cta { flex-direction: column; align-items: flex-start; }
  .host-cta__btn { width: 100%; text-align: center; }
  .save-bar { flex-direction: column-reverse; }
  .clear-btn, .save-btn { width: 100%; justify-content: center; }
  .tab-heading { flex-direction: column; gap: 8px; }
  .heat-legend { align-self: flex-start; }
}
</style>
