<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useSettlements,
  useCreateSettlement,
  usePaySettlement,
  useCompleteSettlement,
} from '../../../composables/useSettlement'
import { useCloseMeeting } from '../../../composables/useMeeting'
import SettlementCard from '../../../components/settlement/SettlementCard.vue'
import SettlementCreateForm from './SettlementCreateForm.vue'
import type { Participant, MeetingStatus } from '../../../types/meeting'
import type { CreateSettlementRequest } from '../../../types/settlement'

const props = defineProps<{
  meetingId: number
  participants: Participant[]
  currentUserId: number
  hostId: number
  meetingStatus: MeetingStatus
}>()

const emit = defineEmits<{
  toast: [msg: string]
}>()

const showForm = ref(false)

const { data: settlementsData, isLoading } = useSettlements(props.meetingId)
const { mutate: createSettlement, isPending: isCreating } = useCreateSettlement(props.meetingId)
const { mutate: paySettlement } = usePaySettlement(props.meetingId)
const { mutate: completeSettlement } = useCompleteSettlement(props.meetingId)
const { mutate: closeMeeting, isPending: isClosing } = useCloseMeeting(props.meetingId)

const settlements = computed(() => settlementsData.value?.settlements ?? [])
const isEmpty = computed(() => !isLoading.value && settlements.value.length === 0)
const isHost = computed(() => props.currentUserId === props.hostId)
const allCompleted = computed(
  () => settlements.value.length > 0 && settlements.value.every((s) => s.status === 'COMPLETED'),
)
const showCloseBtn = computed(() => isHost.value && props.meetingStatus === 'SETTLING')
const canAddSettlement = computed(() =>
  props.meetingStatus === 'CONFIRMED' ||
  props.meetingStatus === 'PLACE_VOTING' ||
  props.meetingStatus === 'SETTLING'
)
const closeTooltipVisible = ref(false)

function onSubmit(data: CreateSettlementRequest) {
  createSettlement(data, {
    onSuccess: () => {
      showForm.value = false
      emit('toast', '정산이 추가됐어요')
    },
    onError: (e: any) => {
      const status = e?.response?.status
      if (status === 403) emit('toast', '권한이 없어요')
      else emit('toast', '정산 추가에 실패했어요')
    },
  })
}

function onPay(settlementId: number) {
  paySettlement(settlementId, {
    onError: (e: any) => {
      const status = e?.response?.status
      if (status === 403) emit('toast', '권한이 없어요')
      else emit('toast', '납부 처리에 실패했어요')
    },
  })
}

function onComplete(settlementId: number) {
  completeSettlement(settlementId, {
    onError: (e: any) => {
      const status = e?.response?.status
      if (status === 403) emit('toast', '권한이 없어요')
      else emit('toast', '완료 처리에 실패했어요')
    },
  })
}

function onCancel() {
  showForm.value = false
}

function onClose() {
  closeMeeting(undefined, {
    onSuccess: () => emit('toast', '약속이 종료됐어요'),
    onError: (e: any) => {
      const status = e?.response?.status
      if (status === 403) emit('toast', '권한이 없어요')
      else emit('toast', '약속 종료에 실패했어요')
    },
  })
}
</script>

<template>
  <!-- Create form -->
  <SettlementCreateForm
    v-if="showForm"
    :participants="participants"
    :current-user-id="currentUserId"
    @cancel="onCancel"
    @submit="onSubmit"
  />

  <!-- List / Empty state -->
  <div v-else class="st">
    <div v-if="isLoading" class="st__loading">불러오는 중...</div>

    <!-- Empty state -->
    <template v-else-if="isEmpty">
      <div class="st__empty-card">
        <div class="st__empty-icon">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <rect x="8" y="13" width="36" height="26" rx="4" stroke="var(--color-primary)" stroke-width="2" />
            <path d="M8 21h36" stroke="var(--color-primary)" stroke-width="2" />
            <circle cx="34" cy="31" r="3.5" stroke="var(--color-primary)" stroke-width="2" />
            <path d="M13 31h8" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" opacity="0.4" />
          </svg>
        </div>
        <h3 class="st__empty-title">아직 정산이 없어요</h3>
        <p class="st__empty-desc">
          모임에서 쓴 비용을 정산해보세요.<br />참여자 누구나 정산을 추가할 수 있어요.
        </p>
      </div>
      <button v-if="canAddSettlement" class="st__add-btn st__add-btn--solid" @click="showForm = true">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M7.5 3v9M3 7.5h9" stroke="#fff" stroke-width="1.7" stroke-linecap="round" />
        </svg>
        정산 추가하기
      </button>
    </template>

    <!-- Settlement list -->
    <template v-else>
      <div class="st__list">
        <SettlementCard
          v-for="s in settlements"
          :key="s.settlementId"
          :settlement="s"
          :current-user-id="currentUserId"
          @pay="onPay"
          @complete="onComplete"
        />
      </div>
      <button
        v-if="canAddSettlement"
        class="st__add-btn st__add-btn--dashed"
        :disabled="isCreating"
        @click="showForm = true"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M7.5 3v9M3 7.5h9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        </svg>
        정산 추가하기
      </button>

      <!-- 약속 종료하기 (방장 + SETTLING 상태일 때만) -->
      <div v-if="showCloseBtn" class="st__close-wrap" @mouseenter="closeTooltipVisible = true" @mouseleave="closeTooltipVisible = false">
        <button
          class="st__close-btn"
          :disabled="!allCompleted || isClosing"
          @click="onClose"
        >
          <span v-if="isClosing" class="st__spinner" />
          {{ isClosing ? '종료 중...' : '약속 종료하기' }}
        </button>
        <div v-if="!allCompleted && closeTooltipVisible" class="st__close-tooltip">
          완료되지 않은 정산이 있어요
          <span class="st__close-tooltip__arrow" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.st { padding-top: 4px; }

.st__loading {
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* Empty */
.st__empty-card {
  background: var(--color-bg-secondary);
  border-radius: 14px;
  padding: 44px 24px;
  text-align: center;
  margin-bottom: 12px;
}
.st__empty-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.st__empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
.st__empty-desc {
  margin: 6px 0 0;
  font-size: 13.5px;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

/* List */
.st__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

/* Add button */
.st__add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s, border-color 0.12s;
}
.st__add-btn--solid {
  padding: 14px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.20);
}
.st__add-btn--solid:hover {
  background: #4540a0;
  box-shadow: 0 4px 14px rgba(83, 74, 183, 0.28);
}
.st__add-btn--dashed {
  padding: 13px 16px;
  background: #fff;
  color: var(--color-text-secondary);
  border: 1.5px dashed var(--color-border);
}
.st__add-btn--dashed:hover:not(:disabled) {
  background: rgba(83, 74, 183, 0.04);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.st__add-btn--dashed:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Close button */
.st__close-wrap {
  position: relative;
  margin-top: 8px;
}
.st__close-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  background: #16a34a;
  color: #fff;
  border: none;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.22);
  transition: background 0.12s, box-shadow 0.12s;
}
.st__close-btn:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.30);
}
.st__close-btn:disabled {
  background: #E5E5EA;
  color: #9A9AA3;
  cursor: not-allowed;
  box-shadow: none;
}
.st__close-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 35, 0.88);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 7px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}
.st__close-tooltip__arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(30, 30, 35, 0.88);
}
.st__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
