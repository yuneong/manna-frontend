<script setup lang="ts">
import type { Place } from '../../types/meeting'
import AvatarStack from '../common/AvatarStack.vue'
import { avatarColorForId } from '../../utils/avatar'

defineProps<{
  place: Place
  isLeader: boolean
  isCoLeader: boolean
  totalParticipants: number
  isVoting: boolean
}>()

const emit = defineEmits<{
  vote: []
}>()

function safeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}
</script>

<template>
  <div :class="['card', isLeader && 'card--leader']">
    <!-- Top: name/link/memo left · vote pill right -->
    <div class="card__top">
      <div class="card__info">
        <!-- Rank badge -->
        <div v-if="isLeader || isCoLeader" class="card__badge">
          <svg width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M5.5 1l1.2 2.5L9.5 4l-2 1.9.5 2.7L5.5 7.3 2.5 8.6 3 5.9 1 4l2.8-.5L5.5 1z" fill="#fff"/>
          </svg>
          {{ isCoLeader ? '공동 1위' : '1위' }}
        </div>

        <h3 class="card__name">{{ place.name }}</h3>

        <a
          v-if="place.url"
          :href="safeUrl(place.url)"
          target="_blank"
          rel="noopener noreferrer"
          class="card__url"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style="flex-shrink:0">
            <path d="M4.5 7.5a2 2 0 0 0 2.83 0l2-2a2 2 0 0 0-2.83-2.83l-.42.42M7.5 4.5a2 2 0 0 0-2.83 0l-2 2a2 2 0 0 0 2.83 2.83l.42-.42" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="card__url-text">{{ displayUrl(place.url) }}</span>
        </a>

        <div v-if="place.memo" class="card__memo">{{ place.memo }}</div>
      </div>

      <!-- Vertical vote pill -->
      <button
        :class="['vote-btn', place.myVoted && 'vote-btn--voted']"
        :disabled="isVoting"
        @click="emit('vote')"
        aria-label="투표"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 13.5s-5-3-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 13 6.5c0 4-5 7-5 7z"
            :fill="place.myVoted ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        <span class="vote-btn__count">{{ place.voteCount }}</span>
      </button>
    </div>

    <!-- Bottom: proposer · voters -->
    <div :class="['card__bottom', isLeader && 'card__bottom--leader']">
      <div class="card__proposer">
        <span class="card__proposer-avatar" :style="{ background: avatarColorForId(place.proposer.id) }">{{ place.proposer.nickname[0] }}</span>
        <span class="card__proposer-name">{{ place.proposer.nickname }} 제안</span>
      </div>
      <div v-if="place.voteCount > 0" class="card__voters">
        <AvatarStack
          :names="place.voters.slice(0, 4).map(v => v.nickname)"
          :images="place.voters.slice(0, 4).map(v => v.profileImageUrl ?? null)"
          :ids="place.voters.slice(0, 4).map(v => v.id)"
          :max="4"
        />
        <span class="card__voters-count">{{ place.voteCount }}/{{ totalParticipants }}명</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #FAFAFB;
  border: 1.5px solid transparent;
  border-radius: 14px;
  padding: 18px 18px 16px;
  transition: border-color 0.15s;
}
.card--leader {
  background: #fff;
  border: 2px solid var(--color-primary);
  box-shadow: 0 4px 16px rgba(83, 74, 183, 0.12);
}
.card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.card__info {
  flex: 1;
  min-width: 0;
}
.card__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}
.card__name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  line-height: 1.3;
}
.card__url {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  margin-top: 6px;
  letter-spacing: -0.01em;
  max-width: 100%;
  transition: opacity 0.1s;
}
.card__url:hover { opacity: 0.75; }
.card__url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.card__memo {
  margin-top: 8px;
  padding: 8px 11px;
  background: rgba(83, 74, 183, 0.04);
  border-left: 2.5px solid rgba(83, 74, 183, 0.25);
  border-radius: 2px 8px 8px 2px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  letter-spacing: -0.005em;
  white-space: pre-wrap;
  word-break: break-word;
}
.vote-btn {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 14px;
  background: #fff;
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  min-width: 56px;
}
.vote-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.vote-btn--voted {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(83, 74, 183, 0.25);
}
.vote-btn--voted:hover:not(:disabled) {
  background: var(--color-primary-dark);
}
.vote-btn:disabled { opacity: 0.6; cursor: default; }
.vote-btn__count {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}
.card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.card__bottom--leader {
  border-top-color: var(--color-border);
}
.card__proposer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.card__proposer-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9.5px;
  font-weight: 700;
  flex-shrink: 0;
}
.card__proposer-name { font-weight: 500; }
.card__voters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.card__voters-count { font-weight: 500; }

@media (max-width: 767px) {
  .card { padding: 16px 16px 14px; }
  .card__name { font-size: 15.5px; }
}
</style>
