<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMyMeetings } from '../composables/useMeeting'
import MeetingCard from '../components/meeting/MeetingCard.vue'

const router = useRouter()
const { data: meetings, isLoading, isError } = useMyMeetings()
</script>

<template>
  <div class="home">
    <div class="home__content">
      <h2 class="home__heading">내 약속</h2>
      <div v-if="isLoading" class="home__state">불러오는 중...</div>
      <div v-else-if="isError" class="home__state home__state--error">
        약속 목록을 불러오지 못했습니다.
      </div>
      <div v-else-if="!meetings?.length" class="home__empty">
        <p>아직 참여 중인 약속이 없어요</p>
        <p>아래 + 버튼으로 약속을 만들어보세요</p>
      </div>
      <div v-else class="home__grid">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
          @click="router.push(`/meetings/${meeting.id}`)"
        />
      </div>
    </div>
    <button class="fab" aria-label="약속 만들기" @click="router.push('/meetings/new')">+</button>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  min-height: calc(100vh - 56px);
}
.home__content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}
.home__heading {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}
.home__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.home__state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 48px 0;
  font-size: 15px;
}
.home__state--error { color: #e53935; }
.home__empty {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 64px 0;
  line-height: 2;
  font-size: 15px;
}
.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(83, 74, 183, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
}
.fab:hover {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}
@media (max-width: 767px) {
  .home__grid { grid-template-columns: 1fr; }
  .home__content { padding: 20px 16px; }
  .fab { bottom: 24px; right: 16px; }
}
</style>
