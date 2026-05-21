<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import type { Meeting, Participant } from '../../types/meeting'
import AppBadge from '../common/AppBadge.vue'
import AvatarStack from '../common/AvatarStack.vue'

const props = defineProps<{ meeting: Meeting }>()

const dateLabel = computed(() => {
  if (props.meeting.confirmedDate) {
    return dayjs(props.meeting.confirmedDate).format('M월 D일 (ddd)')
  }
  const start = dayjs(props.meeting.dateRangeStart)
  const end = dayjs(props.meeting.dateRangeEnd)
  return `${start.format('M월 D일')} ~ ${end.format('M월 D일')}`
})

const dateDetail = computed(() => {
  if (props.meeting.confirmedDate) {
    return dayjs(props.meeting.confirmedDate).format('YYYY년')
  }
  const diff = dayjs(props.meeting.dateRangeEnd).diff(dayjs(props.meeting.dateRangeStart), 'day') + 1
  return `${diff}일 범위`
})

const participantNames = computed(() =>
  props.meeting.participants.map((p: Participant) => p.nickname),
)
</script>

<template>
  <RouterLink :to="`/meetings/${meeting.id}`" class="card">
    <div class="card__header">
      <AppBadge :status="meeting.status" />
      <svg class="card__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <h3 class="card__title">{{ meeting.title }}</h3>

    <div class="card__meta">
      <div class="card__meta-row">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" class="card__meta-icon">
          <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" stroke-width="1.2" />
          <path d="M1 5h11" stroke="currentColor" stroke-width="1.2" />
          <path d="M4 1v2M9 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span class="card__meta-primary">{{ dateLabel }}</span>
        <span class="card__meta-secondary">{{ dateDetail }}</span>
      </div>

      <div v-if="meeting.location" class="card__meta-row">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" class="card__meta-icon">
          <path d="M6.5 1C4.57 1 3 2.57 3 4.5c0 2.63 3.5 7 3.5 7S10 7.13 10 4.5C10 2.57 8.43 1 6.5 1z" stroke="currentColor" stroke-width="1.2" />
          <circle cx="6.5" cy="4.5" r="1.2" stroke="currentColor" stroke-width="1.1" />
        </svg>
        <span class="card__meta-primary">{{ meeting.location }}</span>
      </div>
    </div>

    <div class="card__footer">
      <AvatarStack :names="participantNames" />
      <div class="card__vote-row">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" class="card__meta-icon">
          <path d="M1.5 9.5L4 4l2.5 4L9 2l2.5 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="card__vote-text">{{ meeting.participantCount }}명 참여</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px 18px;
  gap: 10px;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-1px);
  border-color: rgba(83, 74, 183, 0.25);
  box-shadow: 0 4px 16px rgba(83, 74, 183, 0.1);
}
.card:hover .card__chevron {
  transform: translateX(2px);
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card__chevron {
  color: var(--color-text-placeholder);
  transition: transform 0.15s;
}
.card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card__meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.card__meta-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.card__meta-icon { color: var(--color-text-placeholder); flex-shrink: 0; }
.card__meta-primary {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.card__meta-secondary {
  font-size: 12px;
  color: var(--color-text-placeholder);
}
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}
.card__vote-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.card__vote-text {
  font-size: 12px;
  color: var(--color-text-placeholder);
}
</style>
