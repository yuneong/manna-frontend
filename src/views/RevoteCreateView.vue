<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMeeting, useHeatmap, useCreateRevote } from '../composables/useMeeting'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { mutate: createRevote, isPending } = useCreateRevote(meetingId)

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}
function ymd(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD')
}

const heatmap = computed(() => heatmapData.value?.heatmap ?? {})
const totalParticipants = computed(() => meeting.value?.participantCount ?? 0)

const maxCount = computed(() => {
  const vals = Object.values(heatmap.value).map(v => v.count)
  return vals.length ? Math.max(...vals) : 0
})

const candidates = computed(() =>
  Object.entries(heatmap.value)
    .filter(([_, v]) => v.count > 0)
    .map(([key, v]) => ({
      key,
      date: parseLocalDate(key),
      count: v.count,
      tied: v.count === maxCount.value && maxCount.value > 0,
    }))
    .sort((a, b) => b.count - a.count || a.date.getTime() - b.date.getTime()),
)

const selected = ref<Set<string>>(new Set())
let seeded = false
watch(candidates, (list) => {
  if (!seeded && list.length > 0) {
    selected.value = new Set(list.filter(c => c.tied).map(c => c.key))
    seeded = true
  }
}, { immediate: true })

function toggle(key: string) {
  const next = new Set(selected.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selected.value = next
}

const canStart = computed(() => selected.value.size >= 2)

function submit() {
  if (!canStart.value || isPending.value) return
  createRevote({ candidateDates: [...selected.value].map(k => ymd(parseLocalDate(k))) })
}
</script>

<template>
  <div class="rcv">
    <div v-if="isLoading" class="rcv__loading">불러오는 중...</div>

    <template v-else-if="meeting">
      <div class="rcv__inner">

        <button class="back-btn" @click="router.push(`/meetings/${meetingId}`)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          약속방으로
        </button>

        <div class="rcv__heading">
          <div class="rcv__badge">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M5.5 1l1 3 3 .5-2 2 .5 3-2.5-1.5L3 9.5l.5-3-2-2 3-.5L5.5 1z" fill="currentColor"/>
            </svg>
            방장 전용 · 재투표
          </div>
          <h1>재투표에 올릴 날짜를 골라주세요</h1>
          <p>1차 투표에서 표를 받은 날짜 중에서 후보를 선택해주세요. 동률인 날짜는 미리 선택되어 있어요.</p>
        </div>

        <div class="cand-card">
          <div class="cand-card__header">
            <div class="cand-card__title">후보 날짜 ({{ candidates.length }}개)</div>
            <div class="cand-card__badge">{{ selected.size }}개 선택됨</div>
          </div>

          <div class="cand-grid" :class="candidates.length === 1 && 'cand-grid--single'">
            <button
              v-for="c in candidates"
              :key="c.key"
              class="cand-item"
              :class="selected.has(c.key) && 'cand-item--on'"
              @click="toggle(c.key)"
            >
              <div class="cand-item__check" :class="selected.has(c.key) && 'cand-item__check--on'">
                <svg v-if="selected.has(c.key)" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l2.5 2.5L9.5 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="cand-item__info">
                <div class="cand-item__date">
                  {{ c.date.getMonth()+1 }}월 {{ c.date.getDate() }}일 ({{ DAYS[c.date.getDay()] }})
                  <span v-if="c.tied" class="tied-chip">동률</span>
                </div>
                <div class="cand-item__sub">1차 {{ c.count }}/{{ totalParticipants }}표</div>
              </div>
              <div class="cand-item__bar-wrap">
                <div class="cand-item__bar" :style="{ width: `${totalParticipants ? (c.count/totalParticipants)*100 : 0}%` }" />
              </div>
            </button>
          </div>
        </div>

        <div class="info-note">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;margin-top:2px">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
            <path d="M7 6.5v3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="7" cy="4.3" r="0.7" fill="currentColor"/>
          </svg>
          <span>
            재투표가 시작되면 참여자는 후보 중 <b>1개</b>만 선택할 수 있어요.
            최소 <b>2개</b> 이상의 후보를 골라주세요.
          </span>
        </div>

        <div class="action-bar">
          <button class="cancel-btn" @click="router.push(`/meetings/${meetingId}`)">취소</button>
          <button
            class="submit-btn"
            :class="!canStart && 'submit-btn--disabled'"
            :disabled="!canStart || isPending"
            @click="submit"
          >
            <span v-if="isPending" class="spinner" />
            <template v-else>재투표 시작하기 ({{ selected.size }}개 후보)</template>
          </button>
        </div>

      </div>
    </template>

    <div v-else-if="!isLoading" class="rcv__loading">약속을 찾을 수 없습니다.</div>
  </div>
</template>

<style scoped>
.rcv {
  background: var(--color-bg-secondary, #f8f8fb);
  min-height: calc(100vh - 56px);
}
.rcv__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.rcv__loading {
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

.rcv__heading { margin-bottom: 24px; }
.rcv__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(83,74,183,0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}
.rcv__heading h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.rcv__heading p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  letter-spacing: -0.01em;
}

.cand-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 14px;
}
.cand-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}
.cand-card__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
.cand-card__badge {
  padding: 4px 10px;
  background: rgba(83,74,183,0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
.cand-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.cand-grid--single { grid-template-columns: 1fr; }

.cand-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
}
.cand-item--on {
  background: rgba(83,74,183,0.08);
  border-color: var(--color-primary);
}
.cand-item__check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.5px solid #D5D5DC;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.12s;
}
.cand-item__check--on {
  border-color: var(--color-primary);
  background: var(--color-primary);
}
.cand-item__info { flex: 1; min-width: 0; }
.cand-item__date {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.tied-chip {
  padding: 2px 6px;
  background: var(--color-primary);
  color: #fff;
  font-size: 9.5px;
  font-weight: 800;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.cand-item__sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.cand-item__bar-wrap {
  width: 72px;
  flex-shrink: 0;
  height: 4px;
  background: #EFEFF3;
  border-radius: 999px;
  overflow: hidden;
}
.cand-item__bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: var(--color-bg-secondary, #f8f8fb);
  border-radius: 10px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin-bottom: 22px;
}
.info-note b { color: var(--color-text-primary); font-weight: 600; }

.action-bar {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.cancel-btn {
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
.cancel-btn:hover { background: #fafafa; color: var(--color-text-primary); }
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px 22px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  min-width: 200px;
  box-shadow: 0 2px 6px rgba(83,74,183,0.20);
  transition: background 0.12s, box-shadow 0.12s;
}
.submit-btn:hover:not(:disabled):not(.submit-btn--disabled) {
  background: var(--color-primary-dark);
  box-shadow: 0 6px 18px rgba(83,74,183,0.28);
}
.submit-btn--disabled, .submit-btn:disabled {
  background: #C9C6E4;
  cursor: not-allowed;
  box-shadow: none;
}
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 767px) {
  .rcv__inner { padding: 12px 16px 80px; }
  .rcv__heading h1 { font-size: 22px; }
  .cand-grid { grid-template-columns: 1fr; }
  .cand-item__bar-wrap { width: 50px; }
  .action-bar { flex-direction: column-reverse; }
  .cancel-btn, .submit-btn { width: 100%; min-width: 0; justify-content: center; }
}
</style>