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
      <div class="home__top">
        <div>
          <h2 class="home__title">내 약속</h2>
          <p class="home__subtitle">친구들과 일정을 조율해보세요</p>
        </div>
        <button v-if="meetings?.length" class="home__new-btn" @click="router.push('/meetings/new')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          새 약속 만들기
        </button>
      </div>

      <div v-if="isLoading" class="home__state">불러오는 중...</div>
      <div v-else-if="isError" class="home__state home__state--error">
        약속 목록을 불러오지 못했습니다.
      </div>

      <div v-else-if="!meetings?.length" class="home__empty">
        <div class="home__empty-illustration">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect x="8" y="12" width="48" height="44" rx="8" fill="#f0effe" stroke="#d4d1f5" stroke-width="1.5" />
            <path d="M8 22h48" stroke="#d4d1f5" stroke-width="1.5" />
            <path d="M20 8v8M44 8v8" stroke="#9f9bd0" stroke-width="2" stroke-linecap="round" />
            <rect x="18" y="30" width="8" height="8" rx="2" fill="#b8b4e8" />
            <rect x="30" y="30" width="8" height="8" rx="2" fill="#d4d1f5" />
            <rect x="42" y="30" width="8" height="8" rx="2" fill="#d4d1f5" />
            <rect x="18" y="42" width="8" height="8" rx="2" fill="#d4d1f5" />
            <rect x="30" y="42" width="8" height="8" rx="2" fill="#d4d1f5" />
          </svg>
        </div>
        <p class="home__empty-title">아직 약속이 없어요</p>
        <p class="home__empty-desc">새 약속을 만들어 친구들을 초대해보세요</p>
        <button class="home__empty-cta" @click="router.push('/meetings/new')">약속 만들기</button>
      </div>

      <div v-else class="home__grid">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: calc(100vh - 56px);
  background: var(--color-bg-secondary, #f8f8fb);
}
.home__content {
  max-width: 960px;
  margin: 0 auto;
  padding: 36px 24px;
}
.home__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.home__title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin: 0 0 4px;
}
.home__subtitle {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  margin: 0;
}
.home__new-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.home__new-btn:hover { background: var(--color-primary-dark); }
.home__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.home__state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 64px 0;
  font-size: 15px;
}
.home__state--error { color: #e53935; }
.home__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 0 48px;
  gap: 8px;
}
.home__empty-illustration { margin-bottom: 8px; }
.home__empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.home__empty-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
.home__empty-cta {
  margin-top: 16px;
  height: 40px;
  padding: 0 22px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.home__empty-cta:hover { background: var(--color-primary-dark); }
@media (max-width: 767px) {
  .home__grid { grid-template-columns: 1fr; }
  .home__content { padding: 24px 16px; }
  .home__top { flex-direction: column; gap: 16px; }
  .home__new-btn { width: 100%; justify-content: center; }
}
</style>
