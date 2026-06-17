<script setup lang="ts">
import type { MeetingStatus } from '../../types/meeting'

defineProps<{ status: MeetingStatus }>()

const labelMap: Record<MeetingStatus, string> = {
  OPEN: '일정 조율 중',
  CONFIRMED: '장소 제안 필요',
  PLACE_VOTING: '장소 제안 중',
  SETTLING: '정산 중',
  DONE: '완료',
  CANCELLED: '취소됨',
}

const classMap: Record<MeetingStatus, string> = {
  OPEN: 'open',
  CONFIRMED: 'confirmed',
  PLACE_VOTING: 'place-voting',
  SETTLING: 'settling',
  DONE: 'done',
  CANCELLED: 'cancelled',
}
</script>

<template>
  <span :class="['badge', `badge--${classMap[status]}`]">
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
  color: #534AB7;
}
.badge--open .badge__dot { background-color: #534AB7; }

.badge--confirmed {
  background-color: rgba(224, 122, 47, 0.12);
  color: #E07A2F;
}
.badge--confirmed .badge__dot { background-color: #E07A2F; }

.badge--place-voting {
  background-color: rgba(59, 112, 201, 0.12);
  color: #3B70C9;
}
.badge--place-voting .badge__dot { background-color: #3B70C9; }

.badge--settling {
  background-color: rgba(8, 145, 178, 0.1);
  color: #0891B2;
}
.badge--settling .badge__dot { background-color: #0891B2; }

.badge--done {
  background-color: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}
.badge--done .badge__dot { background-color: #16a34a; }

.badge--cancelled {
  background-color: rgba(0, 0, 0, 0.06);
  color: #888;
}
.badge--cancelled .badge__dot { background-color: #aaa; }
</style>
