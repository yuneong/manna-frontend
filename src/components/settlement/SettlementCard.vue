<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Settlement } from '../../types/settlement'
import ParticipantRow from './ParticipantRow.vue'

const props = defineProps<{
  settlement: Settlement
  currentUserId: number
}>()

const emit = defineEmits<{
  pay: [settlementId: number]
  complete: [settlementId: number]
}>()

const copied = ref(false)

const isDone = computed(() => props.settlement.status === 'COMPLETED')
const isCreator = computed(() => props.settlement.creator.userId === props.currentUserId)

const totalAmount = computed(() => {
  if (props.settlement.totalAmount !== undefined) return props.settlement.totalAmount
  return props.settlement.participants.reduce((sum, p) => sum + p.amount, 0)
})

const perAmount = computed(() =>
  props.settlement.type === 'TOTAL' && props.settlement.participants.length > 0
    ? props.settlement.participants[0]!.amount
    : null,
)


const allPaid = computed(() => props.settlement.participants.every((p) => p.isPaid))
const paidCount = computed(() => props.settlement.participants.filter((p) => p.isPaid).length)

function wonFormat(n: number) {
  return n.toLocaleString('ko-KR')
}

function copyAccount() {
  const { accountNumber } = props.settlement.creator
  navigator.clipboard?.writeText(accountNumber).catch(() => {})
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="s-card" :class="{ 's-card--done': isDone }">
    <!-- Header -->
    <div class="s-card__header" :class="{ 's-card__header--done': isDone }">
      <div class="s-card__title-row">
        <h3 class="s-card__title">{{ settlement.title }}</h3>
        <span class="s-card__badge" :class="isDone ? 's-card__badge--done' : 's-card__badge--progress'">
          <span class="s-card__badge-dot" />
          {{ isDone ? '정산 완료' : '진행 중' }}
        </span>
      </div>
      <div class="s-card__amounts">
        <template v-if="perAmount !== null">
          <span class="s-card__label">1인당</span>
          <span class="s-card__per" :class="{ 's-card__per--done': isDone }">
            {{ wonFormat(perAmount) }}원
          </span>
        </template>
        <span class="s-card__total">총 {{ wonFormat(totalAmount) }}원</span>
      </div>
    </div>

    <!-- Account -->
    <div class="s-card__account">
      <div class="s-card__account-info">
        <div class="s-card__account-label">받는 계좌</div>
        <div class="s-card__account-number">
          {{ settlement.creator.bankName }} {{ settlement.creator.accountNumber }}
        </div>
        <div class="s-card__account-holder">예금주 {{ settlement.creator.accountHolder }}</div>
      </div>
      <button class="s-card__copy-btn" :class="{ 's-card__copy-btn--copied': copied }" @click="copyAccount">
        <template v-if="copied">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          복사됨
        </template>
        <template v-else>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="6.5" height="6.5" rx="1.3" stroke="currentColor" stroke-width="1.3" />
            <path d="M9.5 5.5h.7a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H6.2a1 1 0 0 1-1-1v-.5" stroke="currentColor" stroke-width="1.3" />
          </svg>
          계좌 복사
        </template>
      </button>
    </div>

    <!-- Participants -->
    <div class="s-card__participants">
      <ParticipantRow
        v-for="p in settlement.participants"
        :key="p.userId"
        :participant="p"
        :is-me="p.userId === currentUserId"
        :is-completed="isDone"
        @pay="emit('pay', settlement.settlementId)"
      />
    </div>

    <!-- Complete action (creator only, not yet done) -->
    <div v-if="isCreator && !isDone" class="s-card__footer">
      <button
        class="s-card__complete-btn"
        :class="{ 's-card__complete-btn--active': allPaid }"
        :disabled="!allPaid"
        @click="emit('complete', settlement.settlementId)"
      >
        <template v-if="allPaid">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M3 7.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          정산 완료 처리
        </template>
        <template v-else>
          정산 완료 처리 ({{ paidCount }}/{{ settlement.participants.length }}명 납부)
        </template>
      </button>
    </div>

    <!-- All done banner -->
    <div v-else-if="isDone" class="s-card__done-banner">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 7l3 3 5-6" stroke="#0F6E56" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      모든 참여자가 납부를 완료했어요
    </div>
  </div>
</template>

<style scoped>
.s-card {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}
.s-card--done {
  border-color: rgba(15, 110, 86, 0.25);
}

/* Header */
.s-card__header {
  padding: 15px 16px 13px;
  border-bottom: 1px solid var(--color-border);
}
.s-card__header--done {
  background: rgba(15, 110, 86, 0.04);
}
.s-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.s-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}
.s-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}
.s-card__badge--progress {
  background: #EEEDFE;
  color: #3C3489;
}
.s-card__badge--progress .s-card__badge-dot { background: #3C3489; }
.s-card__badge--done {
  background: #E1F5EE;
  color: #085041;
}
.s-card__badge--done .s-card__badge-dot { background: #085041; }
.s-card__badge-dot {
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
}
.s-card__amounts {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.s-card__label {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.s-card__per {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}
.s-card__per--done { color: #0F6E56; }
.s-card__total {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-left: auto;
}

/* Account */
.s-card__account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--color-border);
}
.s-card__account-info { min-width: 0; }
.s-card__account-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-bottom: 2px;
}
.s-card__account-number {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.s-card__account-holder {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 1px;
}
.s-card__copy-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.15s, color 0.15s;
}
.s-card__copy-btn--copied {
  background: rgba(15, 110, 86, 0.10);
  color: #0F6E56;
}
.s-card__copy-btn:not(.s-card__copy-btn--copied):hover {
  background: #4540a0;
}

/* Participants */
.s-card__participants {
  padding: 8px 8px 10px;
}

/* Footer */
.s-card__footer {
  padding: 0 16px 14px;
}
.s-card__complete-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #E5E5EA;
  color: #9A9AA3;
  font-size: 13.5px;
  font-weight: 700;
  cursor: not-allowed;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s;
}
.s-card__complete-btn--active {
  background: #0F6E56;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 110, 86, 0.25);
}
.s-card__complete-btn--active:hover {
  background: #0d5f4a;
}

/* Done banner */
.s-card__done-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 16px;
  background: rgba(15, 110, 86, 0.04);
  border-top: 1px solid rgba(15, 110, 86, 0.12);
  font-size: 12.5px;
  font-weight: 600;
  color: #0F6E56;
}
</style>
