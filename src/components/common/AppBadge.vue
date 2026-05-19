<script setup lang="ts">
import type { MeetingStatus } from '../../types/meeting'

defineProps<{ status: MeetingStatus }>()

const labelMap: Record<MeetingStatus, string> = {
  OPEN: '조율 중',
  CONFIRMED: '확정',
  CANCELLED: '취소',
}
</script>

<template>
  <span :class="['badge', `badge--${status.toLowerCase()}`]">
    <span class="badge__dot" />
    {{ labelMap[status] }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}
.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.badge--open {
  background-color: rgba(83, 74, 183, 0.1);
  color: var(--color-primary);
}
.badge--open .badge__dot { background-color: var(--color-primary); }
.badge--confirmed {
  background-color: rgba(15, 110, 86, 0.1);
  color: var(--color-success);
}
.badge--confirmed .badge__dot { background-color: var(--color-success); }
.badge--cancelled {
  background-color: rgba(0, 0, 0, 0.06);
  color: #888;
}
.badge--cancelled .badge__dot { background-color: #aaa; }
</style>
