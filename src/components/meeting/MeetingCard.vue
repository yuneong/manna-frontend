<script setup lang="ts">
import dayjs from 'dayjs'
import type { Meeting } from '../../types/meeting'
import AppBadge from '../common/AppBadge.vue'

defineProps<{ meeting: Meeting }>()
</script>

<template>
  <div class="card">
    <div class="card__top">
      <span class="card__title">{{ meeting.title }}</span>
      <AppBadge :status="meeting.status" />
    </div>
    <p class="card__date">
      {{ dayjs(meeting.dateRangeStart).format('YYYY.MM.DD') }} ~
      {{ dayjs(meeting.dateRangeEnd).format('YYYY.MM.DD') }}
    </p>
    <p v-if="meeting.confirmedDate" class="card__confirmed">
      확정일: {{ dayjs(meeting.confirmedDate).format('YYYY.MM.DD (ddd)') }}
    </p>
  </div>
</template>

<style scoped>
.card {
  background: var(--color-bg-primary);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.card:hover { box-shadow: 0 2px 12px rgba(83, 74, 183, 0.12); }
.card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card__date {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.card__confirmed {
  font-size: 13px;
  color: var(--color-success);
  font-weight: 600;
}
</style>
