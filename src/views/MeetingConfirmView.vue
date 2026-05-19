<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting, useHeatmap, useConfirmDate } from '../composables/useMeeting'
import HeatmapCalendar from '../components/meeting/HeatmapCalendar.vue'
import AppButton from '../components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)

const selectedDate = ref<string | undefined>()
const errorMsg = ref('')

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { mutate: confirmDate, isPending } = useConfirmDate(meetingId)

const heatmap = computed(() => heatmapData.value?.heatmap ?? {})

function onSelectDate(date: string) {
  selectedDate.value = date
}

function confirm() {
  if (!selectedDate.value) {
    errorMsg.value = '날짜를 선택해주세요'
    return
  }
  errorMsg.value = ''
  confirmDate(
    { confirmedDate: selectedDate.value },
    {
      onError: (e: any) => {
        errorMsg.value = e.response?.data?.message || '날짜 확정에 실패했습니다.'
      },
    },
  )
}
</script>

<template>
  <div class="confirm-page">
    <div class="confirm-box">
      <div class="confirm-header">
        <button class="back-btn" @click="router.back()">←</button>
        <h2>날짜 확정</h2>
      </div>
      <div v-if="isLoading" class="confirm-state">불러오는 중...</div>
      <template v-else-if="meeting">
        <p class="confirm-guide">히트맵에서 확정할 날짜를 선택하세요</p>
        <HeatmapCalendar
          :date-range-start="meeting.dateRangeStart"
          :date-range-end="meeting.dateRangeEnd"
          :heatmap="heatmap"
          :selectable="true"
          :selected-date="selectedDate"
          @select="onSelectDate"
        />
        <p v-if="selectedDate" class="confirm-selected">
          선택: <strong>{{ selectedDate }}</strong>
        </p>
        <p v-if="errorMsg" class="confirm-error">{{ errorMsg }}</p>
        <AppButton :loading="isPending" :full-width="true" @click="confirm">
          이 날로 확정하기
        </AppButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: calc(100vh - 56px);
  background: var(--color-bg-secondary);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 24px;
}
.confirm-box {
  width: 100%;
  max-width: 560px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.confirm-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.back-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 0;
  line-height: 1;
}
.confirm-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px 0;
}
.confirm-guide {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.confirm-selected {
  font-size: 15px;
  color: var(--color-text-primary);
  text-align: center;
}
.confirm-error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
}
@media (max-width: 767px) {
  .confirm-page { padding: 16px; }
  .confirm-box { padding: 20px; }
}
</style>
