<script setup lang="ts">
import { avatarColorForId } from '../../utils/avatar'
import type { SettlementParticipant } from '../../types/settlement'

const props = defineProps<{
  participant: SettlementParticipant
  isMe: boolean
  isCompleted: boolean
}>()

const emit = defineEmits<{
  pay: []
}>()

function initial(nickname: string) {
  return nickname.charAt(0)
}

function wonFormat(n: number) {
  return n.toLocaleString('ko-KR')
}
</script>

<template>
  <div class="p-row" :class="{ 'p-row--me': isMe && !participant.isPaid }">
    <div
      class="p-row__avatar"
      :style="{
        background: participant.isPaid ? avatarColorForId(participant.userId) : '#EFEFF3',
        color: participant.isPaid ? '#fff' : '#9A9AA3',
      }"
    >
      {{ initial(participant.nickname) }}
    </div>
    <div class="p-row__info">
      <span class="p-row__name">
        {{ participant.nickname }}<span v-if="isMe" class="p-row__me-label">&nbsp;(나)</span>
      </span>
      <span class="p-row__amount">{{ wonFormat(participant.amount) }}원</span>
    </div>

    <div v-if="participant.isPaid" class="p-row__status p-row__status--done">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="6.5" fill="rgba(15,110,86,0.12)" />
        <path d="M4 7l2 2 4-4.5" stroke="#0F6E56" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      완료
    </div>
    <button
      v-else-if="isMe && !isCompleted"
      class="p-row__pay-btn"
      @click="emit('pay')"
    >
      납부 완료
    </button>
    <div v-else class="p-row__status p-row__status--unpaid">
      <span class="p-row__dot" />
      미납
    </div>
  </div>
</template>

<style scoped>
.p-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 10px;
}
.p-row--me {
  background: rgba(83, 74, 183, 0.04);
}
.p-row__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.p-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.p-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.p-row__me-label {
  color: var(--color-primary);
  font-weight: 700;
}
.p-row__amount {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.p-row__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.p-row__status--done { color: #0F6E56; }
.p-row__status--unpaid { color: #E24B4A; }
.p-row__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E24B4A;
}
.p-row__pay-btn {
  padding: 7px 13px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  box-shadow: 0 1px 3px rgba(83, 74, 183, 0.25);
  flex-shrink: 0;
  transition: background 0.12s;
}
.p-row__pay-btn:hover {
  background: #4540a0;
}
</style>
