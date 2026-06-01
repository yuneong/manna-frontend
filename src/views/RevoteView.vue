<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting, useRevote, useVoteRevote, useConfirmRevote, useCancelRevote } from '../composables/useMeeting'
import { useAuthStore } from '../stores/auth'
import AvatarStack from '../components/common/AvatarStack.vue'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)
const authStore = useAuthStore()

// 방장이 ?view=vote 로 접근하면 투표 화면 표시
const forceVoteView = computed(() => route.query.view === 'vote')

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId)
// Poll every 10s while vote is in progress
const { data: revote, isLoading: revoteLoading } = useRevote(meetingId, 10000)

const isLoading = computed(() => meetingLoading.value || revoteLoading.value)
const isHost = computed(() => meeting.value?.hostId === authStore.user?.id)

// Revote state — 백엔드 candidates 배열이 후보+득표+투표자를 모두 포함
const votes = computed(() => revote.value?.candidates ?? [])
const candidateDates = computed(() => votes.value.map(v => v.date))

const votedCount = computed(() => revote.value?.votedCount ?? 0)
const totalCount = computed(() =>
  revote.value?.totalCount ?? meeting.value?.participantCount ?? 0,
)
const myVotedDate = computed(() => revote.value?.myVotedDate ?? null)

const maxVoteCount = computed(() => {
  const vals = votes.value.map(v => v.count)
  return vals.length ? Math.max(...vals) : 0
})
const leaders = computed(() =>
  votes.value.filter(v => v.count === maxVoteCount.value && maxVoteCount.value > 0),
)
const isComplete = computed(() =>
  totalCount.value > 0 && votedCount.value === totalCount.value,
)
const isTie = computed(() => isComplete.value && leaders.value.length > 1)

// Who hasn't voted yet
const allVoterNames = computed(() => {
  const s = new Set<string>()
  votes.value.forEach(v => v.voters.forEach(voter => s.add(voter.nickname)))
  return s
})
const pendingVoters = computed(() =>
  (meeting.value?.participants ?? [])
    .map(p => p.nickname)
    .filter(n => !allVoterNames.value.has(n)),
)

// Host pick (for tie scenario)
const hostPick = ref<string | null>(null)

// Participant pick
const picked = ref<string | null>(null)
// Initialize picked from myVotedDate once loaded
watch(myVotedDate, (v) => { if (v && !picked.value) picked.value = v }, { immediate: true })

const isChangingVote = ref(false)
const hasVoted = computed(() => !!myVotedDate.value && !isChangingVote.value)

const { mutate: submitVote, isPending: isVoting } = useVoteRevote(meetingId)
const { mutate: doConfirm, isPending: isConfirming } = useConfirmRevote(meetingId)
const { mutate: doCancel, isPending: isCancelling } = useCancelRevote(meetingId)

const showCancelModal = ref(false)
const cancelError = ref<string | null>(null)

function cancelRevote() {
  doCancel(undefined, {
    onError: (e: any) => {
      showCancelModal.value = false
      const status = e?.response?.status
      if (status === 403) cancelError.value = '방장만 재투표를 취소할 수 있어요'
      else if (status === 404) cancelError.value = '진행 중인 재투표가 없어요'
      else cancelError.value = '재투표 취소에 실패했어요'
    },
  })
}

function pickDate(dateStr: string) {
  if (!hasVoted.value) picked.value = dateStr
}

function startChangingVote() {
  isChangingVote.value = true
  // keep picked at current vote so user sees what they already selected
}

function vote() {
  if (!picked.value) return
  submitVote({ votedDate: picked.value }, {
    onSuccess: () => { isChangingVote.value = false },
  })
}

function confirmDate(date: string) {
  doConfirm({ confirmedDate: date })
}

function fmtDateShort(d: Date): string {
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
}
</script>

<template>
  <div class="rv">
    <div v-if="isLoading" class="rv__loading">불러오는 중...</div>

    <template v-else-if="revote && meeting">
      <div class="rv__inner">

        <button class="back-btn" @click="router.push(`/meetings/${meetingId}`)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          약속방으로
        </button>

        <!-- ========== 방장: 결과 화면 (결과 확인하기로 진입) ========== -->
        <template v-if="isHost && !forceVoteView">
          <div class="heading">
            <h1>재투표 현황</h1>
            <p class="heading__sub">{{ meeting.title }}</p>
          </div>

          <!-- Status strip -->
          <div class="status-strip">
            <div class="stat-card">
              <div class="stat-card__label">응답 현황</div>
              <div class="stat-card__num">
                <span :class="isComplete ? 'clr-success' : 'clr-primary'">{{ votedCount }}</span>
                <span class="stat-card__total">/{{ totalCount }}명</span>
              </div>
              <div class="progress-bar-wrap">
                <div
                  class="progress-bar"
                  :class="isComplete && 'progress-bar--success'"
                  :style="{ width: `${totalCount ? (votedCount/totalCount)*100 : 0}%` }"
                />
              </div>
            </div>
            <div class="stat-card" :class="isTie && 'stat-card--danger'">
              <div class="stat-card__label">상태</div>
              <div class="stat-card__status" :class="isTie ? 'clr-danger' : isComplete ? 'clr-success' : 'clr-primary'">
                <span
                  class="status-dot"
                  :class="[isTie ? 'status-dot--danger' : isComplete ? 'status-dot--success' : 'status-dot--primary', !isComplete && 'status-dot--pulse']"
                />
                {{ isTie ? '재동률 — 방장 결정 필요' : isComplete ? '투표 완료' : '재투표 진행 중' }}
              </div>
            </div>
          </div>

          <!-- Vote results -->
          <div class="results-card">
            <div class="results-card__title">득표 현황</div>
            <div class="results-list">
              <button
                v-for="v in votes"
                :key="v.date"
                class="result-row"
                :class="[
                  isTie && hostPick === v.date && 'result-row--picked',
                  !isTie && v.count === maxVoteCount && maxVoteCount > 0 && 'result-row--leader',
                ]"
                :disabled="!isTie"
                @click="isTie && (hostPick = v.date)"
              >
                <!-- Radio (tie only) -->
                <div v-if="isTie" class="host-radio" :class="hostPick === v.date && 'host-radio--on'">
                  <svg v-if="hostPick === v.date" width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2.5 5.5l2 2 4-4.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>

                <!-- Date chip -->
                <div
                  class="date-chip"
                  :class="v.count === maxVoteCount && maxVoteCount > 0 ? 'date-chip--leader' : 'date-chip--normal'"
                >
                  <div class="date-chip__mo">{{ MONTHS[parseLocalDate(v.date).getMonth()] }}</div>
                  <div class="date-chip__d">{{ parseLocalDate(v.date).getDate() }}</div>
                  <div class="date-chip__dow">{{ DAYS[parseLocalDate(v.date).getDay()] }}</div>
                </div>

                <!-- Bar + voters -->
                <div class="result-detail">
                  <div class="result-detail__top">
                    <div class="result-detail__count">
                      <span
                        class="result-detail__num"
                        :class="v.count === maxVoteCount && maxVoteCount > 0 ? 'clr-primary' : ''"
                      >{{ v.count }}</span>
                      <span class="result-detail__unit">표</span>
                      <span v-if="v.count === maxVoteCount && !isTie && maxVoteCount > 0" class="top-chip">1위</span>
                    </div>
                    <span v-if="isComplete" class="result-detail__pct">
                      {{ totalCount ? Math.round((v.count/totalCount)*100) : 0 }}%
                    </span>
                  </div>
                  <div class="vote-bar-wrap">
                    <div
                      class="vote-bar"
                      :class="v.count === maxVoteCount && maxVoteCount > 0 ? 'vote-bar--leader' : 'vote-bar--normal'"
                      :style="{ width: `${totalCount ? (v.count/totalCount)*100 : 0}%` }"
                    />
                  </div>
                  <div v-if="v.voters.length > 0" class="voter-names">
                    <AvatarStack
                      :names="v.voters.slice(0, 4).map(n => n.nickname)"
                      :ids="v.voters.slice(0, 4).map(n => n.id)"
                    />
                    <span>{{ v.voters.map(n => n.nickname).join(', ') }}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Pending voters -->
          <div v-if="!isComplete && pendingVoters.length > 0" class="pending-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M8 4.5V8l2.3 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <span>
              아직 투표하지 않은 친구:
              <b>{{ pendingVoters.join(', ') }}</b>
            </span>
          </div>

          <!-- CTA: tie -->
          <div v-if="isTie" class="cta-box cta-box--tie">
            <div class="cta-box__left">
              <div class="cta-box__icon cta-box__icon--danger">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2l6.5 12h-13L8 2z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
                  <path d="M8 6.5V9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
                  <circle cx="8" cy="11.5" r="0.8" fill="#fff"/>
                </svg>
              </div>
              <div>
                <div class="cta-box__title">재투표에서도 동률이 발생했어요</div>
                <div class="cta-box__sub">위에서 날짜를 선택한 뒤 방장이 직접 최종 결정해주세요</div>
              </div>
            </div>
            <button
              class="confirm-btn confirm-btn--success"
              :class="!hostPick && 'confirm-btn--disabled'"
              :disabled="!hostPick || isConfirming"
              @click="hostPick && confirmDate(hostPick)"
            >
              <span v-if="isConfirming" class="spinner" />
              <template v-else>방장 결정으로 확정하기</template>
            </button>
          </div>

          <!-- CTA: normal -->
          <div v-else class="cta-box" :class="isComplete && 'cta-box--complete'">
            <div class="cta-box__left">
              <div class="cta-box__icon" :class="isComplete ? 'cta-box__icon--success' : 'cta-box__icon--muted'">
                <svg v-if="isComplete" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/>
                  <path d="M8 4.5V8l2.3 1.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </div>
              <div>
                <div class="cta-box__title">
                  {{ isComplete && leaders.length > 0
                    ? `최다 득표 — ${fmtDateShort(parseLocalDate(leaders[0]!.date))}`
                    : '참여자 응답을 기다리는 중' }}
                </div>
                <div class="cta-box__sub">
                  {{ isComplete
                    ? '최다 득표 날짜로 약속을 확정할 수 있어요'
                    : '모두가 투표하면 결과를 확정할 수 있어요' }}
                </div>
              </div>
            </div>
            <button
              class="confirm-btn confirm-btn--success"
              :class="!isComplete && 'confirm-btn--disabled'"
              :disabled="!isComplete || isConfirming"
              @click="isComplete && leaders.length > 0 && confirmDate(leaders[0]!.date)"
            >
              <span v-if="isConfirming" class="spinner" />
              <template v-else>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                날짜 확정하기
              </template>
            </button>
          </div>
          <!-- 재투표 취소 -->
          <div class="cancel-revote-wrap">
            <button class="cancel-revote-btn" @click="showCancelModal = true">재투표 취소하기</button>
          </div>

          <!-- 에러 토스트 -->
          <div v-if="cancelError" class="rv-toast" @click="cancelError = null">{{ cancelError }}</div>

          <!-- 취소 확인 모달 -->
          <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
            <div class="modal">
              <div class="modal__title">재투표를 취소할까요?</div>
              <div class="modal__desc">취소하면 진행 중인 재투표가 삭제되고<br>약속방으로 돌아갑니다.</div>
              <div class="modal__actions">
                <button class="modal__btn modal__btn--ghost" :disabled="isCancelling" @click="showCancelModal = false">닫기</button>
                <button class="modal__btn modal__btn--danger" :disabled="isCancelling" @click="cancelRevote">
                  <span v-if="isCancelling" class="spinner" />
                  <template v-else>취소하기</template>
                </button>
              </div>
            </div>
          </div>

        </template>

        <!-- ========== 참여자 / 방장 투표 화면 ========== -->
        <template v-else>
          <div class="heading">
            <h1>{{ meeting.title }}</h1>
            <p v-if="isHost" class="heading__sub">방장도 재투표에 참여할 수 있어요</p>
          </div>

          <!-- Status banner -->
          <div class="status-banner" :class="hasVoted && 'status-banner--voted'">
            <div class="status-banner__icon" :class="hasVoted && 'status-banner__icon--voted'">
              <svg v-if="hasVoted" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-else class="pulse-dot" />
            </div>
            <div class="status-banner__body">
              <div class="status-banner__chip" :class="hasVoted && 'status-banner__chip--voted'">
                {{ hasVoted ? '투표 완료' : '재투표 진행 중' }}
              </div>
              <div class="status-banner__msg">
                {{ hasVoted
                  ? '투표해주셔서 감사해요. 결과를 기다려주세요.'
                  : '아래 후보 중 가장 가능한 날짜 1개를 골라주세요' }}
              </div>
            </div>
          </div>

          <!-- Candidate buttons -->
          <div class="cands">
            <button
              v-for="dateStr in candidateDates"
              :key="dateStr"
              class="cand-btn"
              :class="[
                picked === dateStr && 'cand-btn--picked',
                hasVoted && picked !== dateStr && 'cand-btn--dim',
              ]"
              :disabled="hasVoted && picked !== dateStr"
              @click="pickDate(dateStr)"
            >
              <div class="cand-btn__mo">{{ MONTHS[parseLocalDate(dateStr).getMonth()] }}</div>
              <div class="cand-btn__d">{{ parseLocalDate(dateStr).getDate() }}일</div>
              <div class="cand-btn__dow">{{ DAYS[parseLocalDate(dateStr).getDay()] }}요일</div>
              <div class="cand-btn__radio" :class="picked === dateStr && 'cand-btn__radio--on'">
                <div v-if="picked === dateStr" class="cand-btn__radio-dot" />
              </div>
            </button>
          </div>

          <!-- Action -->
          <div class="vote-action">
            <button v-if="hasVoted" class="change-btn" @click="startChangingVote">
              투표 변경하기
            </button>
            <template v-else>
              <button
                class="vote-btn"
                :class="!picked && 'vote-btn--disabled'"
                :disabled="!picked || isVoting"
                @click="vote"
              >
                <span v-if="isVoting" class="spinner" />
                <template v-else>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  투표하기
                </template>
              </button>
            </template>
            <!-- 방장은 투표 후 결과 확인으로 이동 -->
            <button
              v-if="isHost"
              class="change-btn"
              @click="router.push(`/meetings/${meetingId}/revote`)"
            >
              결과 확인하기
            </button>
          </div>
        </template>

      </div>
    </template>

    <div v-else-if="!isLoading" class="rv__loading">재투표 정보를 찾을 수 없습니다.</div>
  </div>
</template>

<style scoped>
.rv {
  background: var(--color-bg-secondary, #f8f8fb);
  min-height: calc(100vh - 56px);
}
.rv__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.rv__loading {
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

.heading { margin-bottom: 20px; }
.heading h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.heading__sub {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

/* Color helpers */
.clr-primary { color: var(--color-primary); }
.clr-success { color: var(--color-success); }
.clr-danger  { color: #C8362B; }

/* Status strip */
.status-strip {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 170px;
  padding: 14px 16px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
}
.stat-card--danger { border-color: rgba(200,54,43,0.30); }
.stat-card__label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.stat-card__num {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}
.stat-card__total {
  color: var(--color-text-placeholder);
  font-size: 15px;
  font-weight: 600;
}
.stat-card__status {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: -0.01em;
}
.progress-bar-wrap {
  height: 4px;
  background: #EFEFF3;
  border-radius: 999px;
  margin-top: 10px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
  border-radius: 999px;
}
.progress-bar--success { background: var(--color-success); }
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
@keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.3) } }
.status-dot--pulse { animation: pulse 1.4s ease-in-out infinite; }

/* Results */
.results-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 14px;
}
.results-card__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 14px;
  color: var(--color-text-primary);
}
.results-list { display: flex; flex-direction: column; gap: 10px; }
.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  cursor: default;
  font-family: inherit;
  text-align: left;
  width: 100%;
  transition: all 0.12s;
}
.result-row--leader {
  background: linear-gradient(90deg, rgba(83,74,183,0.06), rgba(83,74,183,0.02));
  border-color: rgba(83,74,183,0.25);
}
.result-row--picked {
  background: rgba(15,110,86,0.06);
  border-color: var(--color-success);
  cursor: pointer;
}
button.result-row:not(:disabled) { cursor: pointer; }
.host-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D5D5DC;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.12s;
}
.host-radio--on {
  border-color: var(--color-success);
  background: var(--color-success);
}
.date-chip {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  border-radius: 8px;
}
.date-chip--leader { background: rgba(83,74,183,0.10); color: var(--color-primary); }
.date-chip--normal { background: var(--color-bg-secondary, #f8f8fb); color: var(--color-text-primary); }
.date-chip__mo { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }
.date-chip__d { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.date-chip__dow { font-size: 10px; font-weight: 600; margin-top: 1px; opacity: 0.7; }
.result-detail { flex: 1; min-width: 0; }
.result-detail__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.result-detail__count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.result-detail__num { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
.result-detail__unit { font-size: 12.5px; color: var(--color-text-secondary); font-weight: 500; }
.result-detail__pct { font-size: 11.5px; color: var(--color-text-placeholder); font-weight: 600; }
.top-chip {
  padding: 2px 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: 999px;
  letter-spacing: 0.04em;
  margin-left: 4px;
}
.vote-bar-wrap {
  height: 8px;
  background: #EFEFF3;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}
.vote-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s;
}
.vote-bar--leader { background: var(--color-primary); }
.vote-bar--normal { background: #B0A8DE; }
.voter-names {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--color-text-secondary);
}

/* Pending */
.pending-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  background: var(--color-bg-secondary, #f8f8fb);
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
}
.pending-box b { color: var(--color-text-primary); font-weight: 600; }

/* CTA box */
.cta-box {
  background: var(--color-bg-secondary, #f8f8fb);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}
.cta-box--complete {
  background: linear-gradient(135deg, rgba(15,110,86,0.04), rgba(15,110,86,0.10));
  border-color: rgba(15,110,86,0.18);
}
.cta-box--tie {
  background: linear-gradient(135deg, rgba(200,54,43,0.04), rgba(200,54,43,0.08));
  border-color: rgba(200,54,43,0.25);
}
.cta-box__left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.cta-box__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cta-box__icon--success { background: var(--color-success); }
.cta-box__icon--muted { background: var(--color-text-secondary); }
.cta-box__icon--danger { background: #C8362B; }
.cta-box__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.cta-box__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

/* Buttons */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 22px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: background 0.12s, box-shadow 0.12s, filter 0.12s;
}
.confirm-btn--success {
  background: var(--color-success);
  color: #fff;
  box-shadow: 0 2px 6px rgba(15,110,86,0.25);
}
.confirm-btn--success:hover:not(:disabled):not(.confirm-btn--disabled) {
  filter: brightness(0.92);
  box-shadow: 0 6px 16px rgba(15,110,86,0.28);
}
.confirm-btn--disabled, .confirm-btn:disabled {
  background: #C9CECD;
  cursor: not-allowed;
  box-shadow: none;
  filter: none;
  color: #fff;
}

/* Participant: status banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(83,74,183,0.08), rgba(83,74,183,0.04));
  border: 1.5px solid rgba(83,74,183,0.25);
  border-radius: 14px;
  margin-bottom: 18px;
}
.status-banner--voted {
  background: rgba(15,110,86,0.06);
  border-color: rgba(15,110,86,0.25);
}
.status-banner__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(83,74,183,0.30);
}
.status-banner__icon--voted {
  background: var(--color-success);
  box-shadow: 0 2px 8px rgba(15,110,86,0.30);
}
.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.4s ease-in-out infinite;
}
.status-banner__body { flex: 1; min-width: 0; }
.status-banner__chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 999px;
  margin-bottom: 6px;
}
.status-banner__chip--voted { background: var(--color-success); }
.status-banner__msg {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
  line-height: 1.4;
}

/* Participant: candidate buttons */
.cands {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.cand-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 16px;
  background: #fff;
  border: 2px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.12s;
}
.cand-btn--picked {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 6px 18px rgba(83,74,183,0.25);
  transform: scale(1.01);
}
.cand-btn--dim { opacity: 0.5; cursor: default; }
.cand-btn__mo {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.cand-btn--picked .cand-btn__mo { color: rgba(255,255,255,0.85); }
.cand-btn__d {
  font-size: 30px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.cand-btn--picked .cand-btn__d { color: #fff; }
.cand-btn__dow {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-top: 4px;
  letter-spacing: -0.01em;
}
.cand-btn--picked .cand-btn__dow { color: rgba(255,255,255,0.85); }
.cand-btn__radio {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D5D5DC;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}
.cand-btn--picked .cand-btn__radio { border-color: #fff; background: #fff; }
.cand-btn__radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* Vote action */
.vote-action { display: flex; justify-content: flex-end; gap: 10px; }
.vote-btn {
  display: inline-flex;
  align-items: center;
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
  min-width: 180px;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(83,74,183,0.20);
  transition: background 0.12s, box-shadow 0.12s;
}
.vote-btn:hover:not(:disabled):not(.vote-btn--disabled) {
  background: var(--color-primary-dark);
  box-shadow: 0 6px 18px rgba(83,74,183,0.28);
}
.vote-btn--disabled, .vote-btn:disabled {
  background: #C9C6E4;
  cursor: not-allowed;
  box-shadow: none;
}
.change-btn {
  padding: 13px 22px;
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  min-width: 180px;
  transition: background 0.12s, color 0.12s;
}
.change-btn:hover { background: #fafafa; color: var(--color-text-primary); }

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
  .rv__inner { padding: 12px 16px 80px; }
  .heading h1 { font-size: 20px; }
  .status-strip { flex-direction: column; }
  .stat-card { min-width: 0; }
  .cands { grid-template-columns: 1fr; }
  .vote-action { justify-content: stretch; }
  .vote-btn, .change-btn { width: 100%; min-width: 0; }
  .cta-box { flex-direction: column; }
  .confirm-btn { width: 100%; }
  .results-card { padding: 14px 14px; }
}
.cancel-revote-wrap {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.cancel-revote-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--color-text-placeholder);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
}
.cancel-revote-btn:hover { color: #C8362B; }
.rv-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30,30,35,0.92);
  color: #fff;
  font-size: 13.5px;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  z-index: 200;
  white-space: nowrap;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 24px;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px 24px 20px;
  width: 100%;
  max-width: 340px;
}
.modal__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
.modal__desc {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}
.modal__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.modal__btn {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  border: none;
  transition: opacity 0.15s;
}
.modal__btn:disabled { opacity: 0.6; cursor: default; }
.modal__btn--ghost {
  background: var(--color-bg-secondary, #f4f4f8);
  color: var(--color-text-secondary);
}
.modal__btn--danger {
  background: #C8362B;
  color: #fff;
  min-width: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>