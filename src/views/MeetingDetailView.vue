<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMeeting, useHeatmap, useSetAvailability, useJoinMeeting } from '../composables/useMeeting'
import { useAuthStore } from '../stores/auth'
import DateCalendar from '../components/meeting/DateCalendar.vue'
import HeatmapCalendar from '../components/meeting/HeatmapCalendar.vue'
import AppBadge from '../components/common/AppBadge.vue'
import AppButton from '../components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)
const authStore = useAuthStore()

const tab = ref<'my' | 'heatmap'>('my')
const selectedDates = ref<string[]>([])

const { data: meeting, isLoading } = useMeeting(meetingId)
const { data: heatmapData } = useHeatmap(meetingId)
const { mutate: setAvailability, isPending: isSaving } = useSetAvailability(meetingId)
const { mutate: joinMeeting, isPending: isJoining } = useJoinMeeting()

const isHost = computed(() => meeting.value?.hostId === authStore.user?.id)
const heatmap = computed(() => heatmapData.value?.heatmap ?? {})

function saveDates() {
  setAvailability({ availableDates: selectedDates.value })
}

function join() {
  joinMeeting(meetingId)
}
</script>

<template>
  <div class="detail-page">
    <div v-if="isLoading" class="detail-state">불러오는 중...</div>
    <template v-else-if="meeting">
      <div class="detail-header">
        <button class="back-btn" @click="router.back()">←</button>
        <div class="detail-meta">
          <div class="detail-title-row">
            <h1 class="detail-title">{{ meeting.title }}</h1>
            <AppBadge :status="meeting.status" />
          </div>
          <p class="detail-date">
            {{ dayjs(meeting.dateRangeStart).format('YYYY.MM.DD') }} ~
            {{ dayjs(meeting.dateRangeEnd).format('YYYY.MM.DD') }}
          </p>
          <p v-if="meeting.description" class="detail-desc">{{ meeting.description }}</p>
          <p v-if="meeting.confirmedDate" class="detail-confirmed">
            확정일: {{ dayjs(meeting.confirmedDate).format('YYYY년 M월 D일') }}
          </p>
        </div>
      </div>

      <div v-if="meeting.status === 'CONFIRMED'" class="detail-confirmed-banner">
        약속이 확정되었습니다 🎉
      </div>

      <div v-if="meeting.status === 'OPEN'" class="detail-body">
        <div class="tab-row">
          <button :class="['tab', { 'tab--active': tab === 'my' }]" @click="tab = 'my'">
            내 가용 날짜
          </button>
          <button :class="['tab', { 'tab--active': tab === 'heatmap' }]" @click="tab = 'heatmap'">
            전체 현황
          </button>
        </div>

        <div v-if="tab === 'my'" class="tab-panel">
          <DateCalendar
            v-model="selectedDates"
            :date-range-start="meeting.dateRangeStart"
            :date-range-end="meeting.dateRangeEnd"
          />
          <AppButton :loading="isSaving" :full-width="true" @click="saveDates">저장</AppButton>
        </div>

        <div v-else class="tab-panel">
          <HeatmapCalendar
            :date-range-start="meeting.dateRangeStart"
            :date-range-end="meeting.dateRangeEnd"
            :heatmap="heatmap"
          />
        </div>
      </div>

      <div class="detail-actions">
        <AppButton
          v-if="isHost && meeting.status === 'OPEN'"
          @click="router.push(`/meetings/${meeting.id}/confirm`)"
        >
          날짜 확정하기
        </AppButton>
        <AppButton
          v-if="!isHost && meeting.status === 'OPEN'"
          variant="ghost"
          :loading="isJoining"
          @click="join"
        >
          참여하기
        </AppButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}
.detail-state {
  text-align: center;
  padding: 60px 0;
  color: var(--color-text-secondary);
}
.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}
.back-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 3px;
}
.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.detail-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.detail-date {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.detail-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
}
.detail-confirmed {
  font-size: 14px;
  color: var(--color-success);
  font-weight: 600;
}
.detail-confirmed-banner {
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 24px;
}
.tab-row {
  display: flex;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 20px;
}
.tab {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 15px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1.5px;
  font-weight: 500;
}
.tab--active {
  color: var(--color-primary);
  font-weight: 700;
  border-bottom-color: var(--color-primary);
}
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}
@media (max-width: 767px) {
  .detail-page { padding: 16px; }
}
</style>
