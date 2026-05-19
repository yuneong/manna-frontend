<script setup lang="ts">
import type { MeetingStatus } from '../../types/meeting'

defineProps<{ status: MeetingStatus }>()

const labelMap: Record<MeetingStatus, string> = {
  OPEN: '모집중',
  CONFIRMED: '확정',
  CANCELLED: '취소',
}
</script>

<template>
  <span :class="['badge', `badge--${status.toLowerCase()}`]">
    {{ labelMap[status] }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}
.badge--open {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}
.badge--confirmed {
  background-color: var(--color-success-light);
  color: var(--color-success);
}
.badge--cancelled {
  background-color: #f5f5f5;
  color: #999;
}
</style>
