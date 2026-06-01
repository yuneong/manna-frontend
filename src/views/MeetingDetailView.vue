<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMeeting, useHeatmap, useSaveSchedules, useJoinMeeting, useCancelConfirm, useRevote, useDeleteMeeting } from '../composables/useMeeting'
import { meetingApi } from '../api/meeting'
import { useAuthStore } from '../stores/auth'
import AppBadge from '../components/common/AppBadge.vue'
import AvatarStack from '../components/common/AvatarStack.vue'
import KebabMenu from '../components/common/KebabMenu.vue'
import PlaceTab from '../components/meeting/PlaceTab.vue'
import PhaseTabs from '../components/meeting/PhaseTabs.vue'
import { avatarColorForId } from '../utils/avatar'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)
const authStore = useAuthStore()

const l1 = ref<'schedule' | 'place' | 'settle'>('schedule')
const l2 = ref<'mine' | 'heat'>('mine')
const selectedDates = ref<Set<string>>(new Set())
const copied = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const toast = ref<string | null>(null)

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { data: revoteData } = useRevote(meetingId, false, computed(() => !!meeting.value?.hasRevote))
const { mutate: saveSchedules, isPending: isSaving } = useSaveSchedules(meetingId)
const { mutate: joinMeeting } = useJoinMeeting()
const { mutate: cancelConfirm, isPending: isCancelling } = useCancelConfirm(meetingId)
const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting(meetingId)

const isHost = computed(() => meeting.value?.hostId === authStore.user?.id)
const isConfirmed = computed(() => !!meeting.value && meeting.value.status !== 'OPEN')
const hasActiveRevote = computed(() => revoteData.value?.status === 'OPEN')

watch(meeting, (m) => {
  if (!m || !authStore.user) return
  if (m.isParticipant === false) joinMeeting(meetingId)
}, { immediate: true })

let l1Initialized = false
watch(
  () => meeting.value?.status,
  (status) => {
    if (!status || l1Initialized) return
    l1Initialized = true
    if (status === 'CONFIRMED' || status === 'PLACE_VOTING') l1.value = 'place'
    else if (status === 'SETTLING') l1.value = 'settle'
  },
  { immediate: true },
)

const heatmap = computed(() => {
  const raw = heatmapData.value?.heatmap ?? {}
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.count]))
})

const selectedHeatDate = ref<string | null>(null)
watch(heatmapData, (data) => {
  if (!data || selectedHeatDate.value) return
  const entries = Object.entries(data.heatmap)
  if (!entries.length) return
  const max = Math.max(...entries.map(([, v]) => v.count))
  if (max === 0) return
  const best = entries.find(([, v]) => v.count === max)
  if (best) selectedHeatDate.value = best[0]
}, { immediate: true })

const selectedHeatCount = computed(() =>
  heatmapData.value?.heatmap[selectedHeatDate.value ?? '']?.count ?? 0
)
const selectedHeatDateObj = computed(() =>
  selectedHeatDate.value ? parseLocalDate(selectedHeatDate.value) : null
)
const heatDetailParticipants = computed(() => {
  if (!selectedHeatDate.value || !meeting.value) return []
  const availIds = new Set(heatmapData.value?.heatmap[selectedHeatDate.value]?.availableParticipantIds ?? [])
  return meeting.value.participants.map(p => ({ ...p, available: availIds.has(p.id) }))
})
const participantNames = computed(() =>
  meeting.value?.participants.map((p) => p.nickname) ?? [],
)
const participantImages = computed(() =>
  meeting.value?.participants.map((p) => p.profileImageUrl ?? null) ?? [],
)
const participantIds = computed(() =>
  meeting.value?.participants.map((p) => p.id) ?? [],
)
const totalParticipants = computed(() => meeting.value?.participantCount ?? 0)

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
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
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
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const startDate = computed(() => meeting.value ? parseLocalDate(meeting.value.dateRangeStart) : null)
const endDate = computed(() => meeting.value ? parseLocalDate(meeting.value.dateRangeEnd) : null)
const confirmedDate = computed(() =>
  meeting.value?.confirmedDate ? parseLocalDate(meeting.value.confirmedDate) : null
)

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

function toggleDate(d: Date) {
  if (isConfirmed.value || hasActiveRevote.value) return
  const key = ymd(d)
  const next = new Set(selectedDates.value)
  if (next.has(key)) next.delete(key); else next.add(key)
  selectedDates.value = next
}
function clearAll() {
  if (isConfirmed.value || hasActiveRevote.value) return
  selectedDates.value = new Set()
}

const hasSavedResponse = ref(false)
const justSaved = ref(false)

function saveDates() {
  if (isConfirmed.value || hasActiveRevote.value) return
  saveSchedules(
    { scheduledDates: [...selectedDates.value] },
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
    const res = await meetingApi.getMySchedules(meetingId)
    selectedDates.value = new Set(res.data.scheduledDates)
    hasSavedResponse.value = res.data.scheduledDates.length > 0
  } catch {
    // 404(미참여) 등 에러 시 빈 상태 유지
  }
})

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
const hasTie = computed(() => recommendedCount.value >= 2)
const tiedDateList = computed(() =>
  Object.entries(heatmap.value)
    .filter(([_, count]) => count === maxHeatCount.value && count > 0)
    .map(([key]) => parseLocalDate(key))
    .sort((a, b) => a.getTime() - b.getTime()),
)
const legendSteps = computed(() => {
  const t = totalParticipants.value || 4
  return [1, Math.ceil(t / 3), Math.ceil((2 * t) / 3), t]
})

function doCancelConfirm() {
  cancelConfirm(undefined, {
    onSuccess: () => {
      showCancelModal.value = false
    },
    onError: () => {
      showCancelModal.value = false
      showToastMsg('확정 취소 중 오류가 발생했습니다.')
    },
  })
}

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 3000)
}

function doDelete() {
  deleteMeeting(undefined, {
    onError: (e: any) => {
      showDeleteModal.value = false
      const status = e.response?.status
      if (status === 403) showToastMsg('권한이 없어요')
      else showToastMsg('삭제 중 오류가 발생했습니다.')
    },
  })
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showCancelModal.value) showCancelModal.value = false
    if (showDeleteModal.value) showDeleteModal.value = false
  }
}
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

function copyLink() {
  const url = window.location.href
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).catch(() => {})
  } else {
    const el = document.createElement('textarea')
    el.value = url
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
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
        <button class="back-btn" @click="router.push('/')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          내 약속
        </button>

        <!-- CONFIRMED header -->
        <template v-if="isConfirmed && confirmedDate">
          <div class="mcard mcard--confirmed">
            <div class="mcard__confirmed-top">
              <div class="mcard__top">
                <h1 class="mcard__title">{{ meeting.title }}</h1>
                <AppBadge :status="meeting.status" />
                <KebabMenu
                  v-if="isHost"
                  :can-edit="false"
                  @edit="router.push(`/meetings/${meetingId}/edit`)"
                  @delete="showDeleteModal = true"
                />
              </div>
              <div class="confirmed-date-strip">
                <div class="confirmed-date-strip__cal">
                  <div class="confirmed-date-strip__cal-m">{{ MONTHS[confirmedDate.getMonth()] }}</div>
                  <div class="confirmed-date-strip__cal-d">{{ confirmedDate.getDate() }}</div>
                </div>
                <div class="confirmed-date-strip__info">
                  <div class="confirmed-date-strip__label">확정된 일정</div>
                  <div class="confirmed-date-strip__title">
                    {{ confirmedDate.getMonth()+1 }}월 {{ confirmedDate.getDate() }}일 ({{ DAYS[confirmedDate.getDay()] }}) 확정
                  </div>
                </div>
              </div>
              <div v-if="meeting.description" class="mcard__meta-row mcard__meta-row--top mcard__meta-desc">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="mcard__meta-icon">
                  <path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <span>{{ meeting.description }}</span>
              </div>
            </div>
            <div class="mcard__footer">
              <div class="mcard__participants">
                <AvatarStack :names="participantNames" :images="participantImages" :ids="participantIds" />
                <span class="mcard__participants-label">{{ meeting.participantCount }}명 참여</span>
              </div>
            </div>
          </div>
        </template>

        <!-- OPEN header -->
        <template v-else>
          <div class="mcard">
            <div class="mcard__top">
              <h1 class="mcard__title">{{ meeting.title }}</h1>
              <AppBadge :status="meeting.status" />
              <KebabMenu
                v-if="isHost"
                :can-edit="!isConfirmed"
                @edit="router.push(`/meetings/${meetingId}/edit`)"
                @delete="showDeleteModal = true"
              />
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
                <AvatarStack :names="participantNames" :images="participantImages" :ids="participantIds" />
                <span class="mcard__participants-label">
                  {{ meeting.responseCount }}/{{ meeting.participantCount }}명 응답
                </span>
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
        </template>

        <!-- 재투표 진행 중 배너: 탭과 무관하게 항상 노출 -->
        <div v-if="!isConfirmed && hasActiveRevote" class="revote-active-banner">
          <div class="revote-active-banner__icon">
            <span class="revote-active-dot" />
          </div>
          <div class="revote-active-banner__body">
            <div class="revote-active-banner__chip">재투표 진행 중</div>
            <div class="revote-active-banner__title">
              {{ isHost ? '재투표가 열려 있어요. 투표하고 결과를 확인하세요.' : '방장이 재투표를 열었어요. 투표해주세요.' }}
            </div>
          </div>
          <div class="revote-active-banner__btns">
            <button class="revote-active-banner__btn revote-active-banner__btn--ghost" @click="router.push(`/meetings/${meetingId}/revote?view=vote`)">
              투표하러 가기
            </button>
            <button v-if="isHost" class="revote-active-banner__btn" @click="router.push(`/meetings/${meetingId}/revote`)">
              결과 확인하기
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-wrap">
          <PhaseTabs
            :status="meeting.status"
            v-model:l1="l1"
            v-model:l2="l2"
          />
        </div>

        <!-- Mine subtab -->
        <template v-if="l1 === 'schedule' && l2 === 'mine'">
          <!-- Locked banner (CONFIRMED) -->
          <div v-if="isConfirmed && confirmedDate" class="locked-banner">
            <div class="locked-banner__icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="3" y="6.5" width="8" height="5" rx="1" stroke="#fff" stroke-width="1.4"/>
                <path d="M4.5 6.5V5a2.5 2.5 0 1 1 5 0v1.5" stroke="#fff" stroke-width="1.4"/>
              </svg>
            </div>
            <div class="locked-banner__text">
              <div class="locked-banner__title">약속이 확정되었습니다. 날짜 수정이 불가능합니다.</div>
              <div class="locked-banner__sub">
                <b style="color: var(--color-success)">{{ confirmedDate.getMonth()+1 }}월 {{ confirmedDate.getDate() }}일 ({{ DAYS[confirmedDate.getDay()] }})</b>에
                약속이 확정되어 내가 응답했던 날짜는 더 이상 변경할 수 없어요.
              </div>
            </div>
          </div>

          <!-- Locked banner (재투표 진행 중) -->
          <div v-else-if="hasActiveRevote" class="locked-banner locked-banner--revote">
            <div class="locked-banner__icon locked-banner__icon--revote">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="3" y="6.5" width="8" height="5" rx="1" stroke="#fff" stroke-width="1.4"/>
                <path d="M4.5 6.5V5a2.5 2.5 0 1 1 5 0v1.5" stroke="#fff" stroke-width="1.4"/>
              </svg>
            </div>
            <div class="locked-banner__text">
              <div class="locked-banner__title">재투표가 진행 중이에요. 날짜 선택이 잠겼어요.</div>
              <div class="locked-banner__sub">재투표 결과로 날짜가 확정되면 다시 확인할 수 있어요.</div>
            </div>
          </div>

          <!-- Normal heading (OPEN) -->
          <div v-else class="tab-heading">
            <div>
              <div class="tab-heading__title">가능한 날짜를 모두 선택해주세요</div>
              <div class="tab-heading__sub">클릭으로 선택 · 해제</div>
            </div>
            <div class="selected-count">{{ selectedDates.size }}일 선택됨</div>
          </div>

          <div v-if="startDate && endDate" :class="['cal-card', (isConfirmed || hasActiveRevote) && 'cal-card--locked']">
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
                    :class="['select-cell', selectedDates.has(ymd(d)) && 'select-cell--selected', isConfirmed && 'select-cell--locked']"
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
            <button class="clear-btn" :disabled="isConfirmed || hasActiveRevote" @click="clearAll">모두 해제</button>
            <button
              :disabled="selectedDates.size === 0 || isSaving || justSaved || isConfirmed || hasActiveRevote"
              :class="[
                'save-btn',
                justSaved && 'save-btn--saved',
                (selectedDates.size === 0 || isSaving || isConfirmed || hasActiveRevote) && !justSaved && 'save-btn--disabled',
              ]"
              @click="saveDates"
            >
              <template v-if="isConfirmed || hasActiveRevote">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="3.5" y="6.5" width="7" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M5 6.5V5a2 2 0 1 1 4 0v1.5" stroke="currentColor" stroke-width="1.3"/>
                </svg>
                내 응답 저장하기
              </template>
              <template v-else-if="isSaving">
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

        <!-- Place tab -->
        <template v-else-if="l1 === 'place'">
          <PlaceTab
            :meeting-id="meetingId"
            :total-participants="totalParticipants"
            @toast="showToastMsg"
          />
        </template>

        <!-- Settle tab (placeholder) -->
        <template v-else-if="l1 === 'settle'">
          <div class="settle-placeholder">정산 기능은 준비 중이에요</div>
        </template>

        <!-- Heatmap subtab -->
        <template v-else-if="l1 === 'schedule' && l2 === 'heat'">
          <div class="tab-heading">
            <div>
              <div class="tab-heading__title">
                {{ isConfirmed ? '확정된 날짜와 참여 현황' : '모두가 가능한 날짜를 찾아봐요' }}
              </div>
              <div v-if="isConfirmed && confirmedDate" class="tab-heading__sub">
                <b style="color: var(--color-success)">{{ confirmedDate.getMonth()+1 }}월 {{ confirmedDate.getDate() }}일 ({{ DAYS[confirmedDate.getDay()] }})</b>에 확정되었어요
              </div>
              <div v-else class="tab-heading__sub">진한 색일수록 더 많은 사람이 가능한 날짜예요</div>
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
                <div v-if="isConfirmed" class="heat-confirmed-legend">
                  <span class="heat-confirmed-legend__dot" />
                  확정된 날짜
                </div>
                <div v-else-if="recommendedCount > 0" class="heat-recommended">
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
                    :class="[
                      'heat-cell',
                      !isConfirmed && heatmap[ymd(d)] === maxHeatCount && maxHeatCount > 0 && 'heat-cell--top',
                      isConfirmed && confirmedDate && isSameDay(d, confirmedDate) && 'heat-cell--confirmed',
                      selectedHeatDate === ymd(d) && 'heat-cell--selected',
                    ]"
                    :style="{
                      background: heatmap[ymd(d)] ? heatColor(heatmap[ymd(d)]!, totalParticipants) : '#FAFAFB',
                      transform: isConfirmed && confirmedDate && isSameDay(d, confirmedDate) ? 'scale(1.02)' : 'none',
                      cursor: 'pointer',
                    }"
                    @click="selectedHeatDate = ymd(d)"
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
                    <div v-if="isConfirmed && confirmedDate && isSameDay(d, confirmedDate)" class="heat-cell__confirmed-badge">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                        <path d="M2.5 5.5l2 2 4-4.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div v-else-if="!isConfirmed && heatmap[ymd(d)] === maxHeatCount && maxHeatCount > 0" class="heat-cell__star">
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

          <!-- 날짜별 참여자 현황 -->
          <div v-if="selectedHeatDate && selectedHeatDateObj" class="heat-detail">
            <div class="heat-detail__header">
              <div class="heat-detail__header-left">
                <span class="heat-detail__date">{{ fmtDate(selectedHeatDateObj) }}</span>
                <span v-if="selectedHeatCount === maxHeatCount && maxHeatCount > 0" class="heat-detail__best">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M5 1l1.2 2.5L9 4l-2 1.9.5 2.7L5 7.3 2.5 8.6 3 5.9 1 4l2.8-.5L5 1z" fill="currentColor"/>
                  </svg>
                  최다 득표
                </span>
              </div>
              <span class="heat-detail__count">
                <b>{{ selectedHeatCount }}</b>/{{ totalParticipants }}명 가능
              </span>
            </div>
            <div class="heat-detail__grid">
              <div v-for="p in heatDetailParticipants" :key="p.id" class="heat-detail__person" :class="!p.available && 'heat-detail__person--dim'">
                <div class="heat-detail__avatar-wrap">
                  <img
                    v-if="p.profileImageUrl"
                    class="heat-detail__avatar heat-detail__avatar--img"
                    :src="p.profileImageUrl"
                    alt=""
                  />
                  <div
                    v-else
                    class="heat-detail__avatar"
                    :style="{ background: p.available ? avatarColorForId(p.id) : '#EFEFF3', color: p.available ? '#fff' : 'var(--color-text-placeholder)' }"
                  >{{ p.nickname[0] }}</div>
                  <span :class="['heat-detail__indicator', p.available ? 'heat-detail__indicator--ok' : 'heat-detail__indicator--no']">
                    <svg v-if="p.available" width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.5 1.5L6.5 2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg v-else width="7" height="7" viewBox="0 0 7 7" fill="none">
                      <path d="M1.5 1.5l4 4M5.5 1.5l-4 4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
                    </svg>
                  </span>
                </div>
                <span class="heat-detail__name">{{ p.nickname }}</span>
              </div>
            </div>
          </div>

          <!-- 동률 배너 (방장 전용, 재투표 없을 때) -->
          <div v-if="!isConfirmed && isHost && hasTie && !hasActiveRevote" class="tie-banner">
            <div class="tie-banner__icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 4v15M3 4h16" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M3 12l3-7 3 7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 12l3-7 3 7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="tie-banner__body">
              <div class="tie-banner__chip">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4.5" cy="4.5" r="3" stroke="#fff" stroke-width="1.2"/><path d="M4.5 2.5v2l1.3 1" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
                방장에게만 보임
              </div>
              <div class="tie-banner__title">
                최다 득표 날짜가 <span class="tie-banner__count">{{ tiedDateList.length }}개</span>로 동률이에요
              </div>
              <div class="tie-banner__sub">
                <b>{{ tiedDateList.map(d => `${d.getMonth()+1}/${d.getDate()}(${DAYS[d.getDay()]})`).join(' · ') }}</b>
                &nbsp;중에서 직접 결정하거나, 후보를 좁혀 재투표를 열 수 있어요.
              </div>
            </div>
            <div class="tie-banner__actions">
              <button class="tie-banner__decide" @click="router.push(`/meetings/${meetingId}/confirm`)">직접 결정</button>
              <button class="tie-banner__revote" @click="router.push(`/meetings/${meetingId}/revote/new`)">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                재투표 열기
              </button>
            </div>
          </div>

          <!-- OPEN: Host CTA (동률 없고 재투표 없을 때) -->
          <div v-if="!isConfirmed && isHost && !hasTie && !hasActiveRevote && meeting.status === 'OPEN'" class="host-cta">
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

          <!-- CONFIRMED: Host actions -->
          <div v-if="isConfirmed && isHost" class="host-confirmed-actions">
            <div class="host-confirmed-actions__info">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="host-confirmed-actions__icon" aria-hidden="true">
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.3"/>
                <path d="M10 5.5V10l3 1.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              <div>
                <div class="host-confirmed-actions__title">날짜를 변경해야 하나요?</div>
                <div class="host-confirmed-actions__sub">방장(나)만 확정을 수정하거나 취소할 수 있어요</div>
              </div>
            </div>
            <div class="host-confirmed-actions__btns">
              <button class="cancel-confirm-btn" @click="showCancelModal = true">확정 취소</button>
              <button class="edit-confirm-btn" @click="router.push(`/meetings/${meetingId}/edit`)">확정 수정</button>
            </div>
          </div>
        </template>

      </div>
    </template>

    <div v-else class="detail__loading">약속을 찾을 수 없습니다.</div>
  </div>

  <!-- Cancel confirm modal -->
  <Teleport to="body">
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="modal-box">
        <div class="modal-box__icon-wrap">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M11 2.5l9.5 17.5H1.5L11 2.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M11 9v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="11" cy="16.5" r="1" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="modal-box__title">약속 확정을 취소하시겠어요?</h2>
        <p class="modal-box__desc">확정을 취소하면 모든 참여자가 날짜를 다시 선택할 수 있어요.</p>
        <div class="modal-box__actions">
          <button class="modal-btn modal-btn--ghost" @click="showCancelModal = false">돌아가기</button>
          <button class="modal-btn modal-btn--danger" :disabled="isCancelling" @click="doCancelConfirm">
            <span v-if="isCancelling" class="save-btn__spinner" />
            {{ isCancelling ? '취소 중...' : '취소하기' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete confirm modal -->
  <Teleport to="body">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-box">
        <div class="modal-box__icon-wrap">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M4 6h14M8 6V4.5h6V6M8.5 9v7M13.5 9v7M5 6l1 12.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5L19 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="modal-box__title">약속을 삭제하시겠어요?</h2>
        <p class="modal-box__desc">삭제한 약속은 복구할 수 없어요. 참여자들도 더 이상 이 약속방에 접근할 수 없게 돼요.</p>
        <div class="modal-box__actions">
          <button class="modal-btn modal-btn--ghost" @click="showDeleteModal = false">돌아가기</button>
          <button class="modal-btn modal-btn--danger" :disabled="isDeleting" @click="doDelete">
            <span v-if="isDeleting" class="save-btn__spinner" />
            {{ isDeleting ? '삭제 중...' : '삭제하기' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Toast -->
  <Teleport to="body">
    <div v-if="toast" class="toast">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M7.5 4.5v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="7.5" cy="10.2" r="0.7" fill="currentColor"/>
      </svg>
      {{ toast }}
    </div>
  </Teleport>
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
.mcard--confirmed {
  border: 1.5px solid rgba(15, 110, 86, 0.25);
  padding: 0;
  overflow: hidden;
}
.mcard__confirmed-top {
  padding: 20px 22px 16px;
  background: linear-gradient(135deg, rgba(15,110,86,0.06), rgba(15,110,86,0.02));
  border-bottom: 1px solid rgba(15,110,86,0.12);
}
.confirmed-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px 5px 9px;
  background: var(--color-success);
  color: #fff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(15,110,86,0.25);
}
.confirmed-date-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid rgba(15,110,86,0.30);
  border-radius: 10px;
  margin-top: 12px;
}
.confirmed-date-strip__cal {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-success);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.confirmed-date-strip__cal-m {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.confirmed-date-strip__cal-d {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.confirmed-date-strip__info { flex: 1; min-width: 0; }
.confirmed-date-strip__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-success);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 3px;
}
.confirmed-date-strip__title {
  font-size: 19px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
  line-height: 1.2;
}
.mcard__meta-desc { margin-top: 12px; }
.mcard--confirmed .mcard__footer {
  padding: 14px 22px;
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

/* Tabs */
.tabs-wrap {
  margin-bottom: 22px;
}
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
.tab__lock {
  display: inline-flex;
  align-items: center;
  opacity: 0.5;
  color: var(--color-text-secondary);
}
.tab__lock--active { opacity: 0.7; color: var(--color-text-primary); }

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

/* Locked banner */
.locked-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(83,74,183,0.06), rgba(83,74,183,0.02));
  border: 1px solid rgba(83,74,183,0.20);
  border-radius: 10px;
  margin-bottom: 14px;
}
.locked-banner__icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.locked-banner--revote {
  background: rgba(83,74,183,0.04);
  border-color: rgba(83,74,183,0.18);
}
.locked-banner__icon--revote { background: var(--color-primary); }
.locked-banner__text { flex: 1; min-width: 0; }
.locked-banner__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 2px;
}
.locked-banner__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Calendar card */
.cal-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 20px 22px;
  margin-bottom: 16px;
}
.cal-card--locked { opacity: 0.7; }
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
.select-cell--locked { cursor: not-allowed; }
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
.clear-btn:hover:not(:disabled) { background: #fafafa; color: var(--color-text-primary); }
.clear-btn:disabled { color: #C7C7CF; border-color: #EAEAEE; cursor: not-allowed; }
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
  background: #E5E5EA;
  color: #9A9AA3;
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
.heat-confirmed-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-success);
  margin-top: 2px;
}
.heat-confirmed-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--color-success);
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
.heat-cell--selected {
  border: 1.5px solid var(--color-success, #0F6E56) !important;
  transform: scale(1.04) !important;
  z-index: 1;
}
.heat-cell--confirmed {
  border: 2.5px solid var(--color-success) !important;
  box-shadow: 0 0 0 4px rgba(15,110,86,0.20);
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
.heat-detail {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 16px 18px;
  margin-top: -6px;
  margin-bottom: 16px;
}
.heat-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.heat-detail__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.heat-detail__date {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
.heat-detail__best {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(83, 74, 183, 0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.heat-detail__count {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}
.heat-detail__count b {
  color: var(--color-text-primary);
  font-weight: 700;
}
.heat-detail__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
}
.heat-detail__person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.heat-detail__person--dim { opacity: 0.4; }
.heat-detail__avatar-wrap { position: relative; }
.heat-detail__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.10);
}
.heat-detail__avatar--img { object-fit: cover; }
.heat-detail__indicator {
  position: absolute;
  bottom: -2px;
  right: -3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.heat-detail__indicator--ok { background: var(--color-success, #0F6E56); }
.heat-detail__indicator--no { background: #BFBFC7; }
.heat-detail__name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
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
.heat-cell__confirmed-badge {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 22px;
  height: 22px;
  background: var(--color-success);
  border-radius: 50%;
  border: 2.5px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(15,110,86,0.25);
}

/* Revote active banner */
.revote-active-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(83,74,183,0.08), rgba(83,74,183,0.04));
  border: 1.5px solid rgba(83,74,183,0.25);
  border-radius: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.revote-active-banner__icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
@keyframes mannaPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.25) } }
.revote-active-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  animation: mannaPulse 1.4s ease-in-out infinite;
  display: block;
}
.revote-active-banner__body { flex: 1; min-width: 0; }
.revote-active-banner__chip {
  display: inline-flex;
  padding: 3px 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 999px;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.revote-active-banner__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.revote-active-banner__btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.revote-active-banner__btn {
  padding: 10px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(83,74,183,0.25);
  transition: background 0.12s;
  white-space: nowrap;
}
.revote-active-banner__btn:hover { background: var(--color-primary-dark); }
.revote-active-banner__btn--ghost {
  background: #fff;
  color: var(--color-primary);
  border: 1.5px solid rgba(83,74,183,0.35);
  box-shadow: none;
}
.revote-active-banner__btn--ghost:hover { background: rgba(83,74,183,0.06); }

/* Tie banner */
.tie-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(83,74,183,0.06), rgba(83,74,183,0.10));
  border: 1.5px solid rgba(83,74,183,0.25);
  border-radius: 14px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.tie-banner__icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(83,74,183,0.30);
  animation: mannaPulse 2.4s ease-in-out infinite;
}
.tie-banner__body { flex: 1; min-width: 200px; }
.tie-banner__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 999px;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.tie-banner__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  line-height: 1.35;
}
.tie-banner__count { color: var(--color-primary); }
.tie-banner__sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.tie-banner__sub b { color: var(--color-text-primary); font-weight: 600; }
.tie-banner__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}
.tie-banner__decide {
  padding: 11px 16px;
  background: #fff;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  white-space: nowrap;
  transition: background 0.12s;
}
.tie-banner__decide:hover { background: #f4f4f6; }
.tie-banner__revote {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 8px rgba(83,74,183,0.25);
  white-space: nowrap;
  transition: background 0.12s;
}
.tie-banner__revote:hover { background: var(--color-primary-dark); }

/* Host CTA (OPEN) */
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

/* Host actions (CONFIRMED) */
.host-confirmed-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: var(--color-bg-secondary, #f8f8fb);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 18px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.host-confirmed-actions__info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.host-confirmed-actions__icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-text-secondary);
}
.host-confirmed-actions__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.host-confirmed-actions__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.5;
}
.host-confirmed-actions__btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.cancel-confirm-btn {
  padding: 11px 18px;
  background: transparent;
  color: #C8362B;
  border: 1.5px solid rgba(200,54,43,0.40);
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: all 0.12s;
}
.cancel-confirm-btn:hover {
  background: rgba(200,54,43,0.06);
  border-color: #C8362B;
}
.edit-confirm-btn {
  padding: 11px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s;
  box-shadow: 0 1px 2px rgba(83,74,183,0.18);
}
.edit-confirm-btn:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(83,74,183,0.28);
}

/* Cancel modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20,20,30,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease-out;
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  padding: 28px 28px 22px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  animation: slideIn 0.18s ease-out;
}
.modal-box__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(200,54,43,0.10);
  color: #C8362B;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.modal-box__title {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  line-height: 1.3;
}
.modal-box__desc {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  letter-spacing: -0.01em;
}
.modal-box__actions {
  display: flex;
  gap: 8px;
}
.modal-btn {
  flex: 1;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.modal-btn--danger {
  background: #C8362B;
  color: #fff;
  border: none;
  box-shadow: 0 1px 2px rgba(200,54,43,0.18);
}
.modal-btn--danger:hover:not(:disabled) {
  background: #A82A20;
  box-shadow: 0 4px 14px rgba(200,54,43,0.28);
}
.modal-btn--danger:disabled { opacity: 0.7; cursor: not-allowed; }
.modal-btn--ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
}
.modal-btn--ghost:hover { background: #fafafa; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: #1E1E2E;
  color: #fff;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 1100;
  white-space: nowrap;
  animation: fadeIn 0.15s ease-out;
}

.settle-placeholder {
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }

@media (max-width: 767px) {
  .detail__inner { padding: 12px 16px 80px; }
  .mcard { padding: 18px 18px 16px; }
  .mcard--confirmed { padding: 0; }
  .mcard__confirmed-top { padding: 16px 18px 14px; }
  .mcard--confirmed .mcard__footer { padding: 14px 18px; }
  .mcard__title { font-size: 19px; }
  .confirmed-date-strip { flex-direction: column; gap: 10px; }
  .confirmed-date-strip__title { font-size: 17px; }
  .cal-card { padding: 12px 10px; }
  .cal-grid { gap: 2px; }
  .cal-weekday { font-size: 10px; padding: 4px 0; }
  .select-cell { padding: 4px 5px; border-radius: 7px; }
  .select-cell__num { font-size: 12px; }
  .select-cell__day { font-size: 9px; }
  .select-cell__check { width: 11px; height: 11px; top: 4px; right: 4px; }
  .cal-grid__empty { font-size: 10px; padding: 4px 5px; }
  .heat-cell { padding: 4px 5px; border-radius: 7px; }
  .heat-cell__num { font-size: 11px; }
  .heat-cell__dow { font-size: 9px; }
  .heat-cell__count { font-size: 9px; }
  .heat-cell__star { width: 12px; height: 12px; top: -4px; right: -4px; }
  .heat-cell__star svg { width: 7px; height: 7px; }
  .heat-cell__confirmed-badge { width: 16px; height: 16px; top: -5px; right: -5px; }
  .heat-cell__confirmed-badge svg { width: 8px; height: 8px; }
  .revote-active-banner { flex-direction: column; }
  .revote-active-banner__btns { width: 100%; }
  .revote-active-banner__btn { flex: 1; text-align: center; }
  .tie-banner { flex-direction: column; }
  .tie-banner__actions { width: 100%; }
  .tie-banner__decide, .tie-banner__revote { flex: 1; justify-content: center; }
  .host-cta { flex-direction: column; align-items: flex-start; }
  .host-cta__btn { width: 100%; text-align: center; }
  .host-confirmed-actions { flex-direction: column; align-items: flex-start; }
  .host-confirmed-actions__btns { width: 100%; }
  .cancel-confirm-btn, .edit-confirm-btn { flex: 1; text-align: center; }
  .save-bar { flex-direction: column-reverse; }
  .clear-btn, .save-btn { width: 100%; justify-content: center; }
  .tab-heading { flex-direction: column; gap: 8px; }
  .heat-legend { align-self: flex-start; }
  .modal-box { padding: 24px 20px 18px; }
}
</style>
