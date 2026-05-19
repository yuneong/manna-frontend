<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAuth } from '../../composables/useAuth'
import AppLogo from '../common/AppLogo.vue'

const authStore = useAuthStore()
const { logout } = useAuth()

const initial = computed(() => authStore.user?.nickname?.[0]?.toUpperCase() ?? '')
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink to="/" class="header__logo-link">
        <AppLogo :size="20" />
      </RouterLink>
      <div v-if="authStore.isAuthenticated" class="header__right">
        <span class="header__avatar" aria-hidden="true">{{ initial }}</span>
        <button class="header__logout" @click="logout">로그아웃</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg-primary);
  border-bottom: 0.5px solid var(--color-border);
}
.header__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header__logo-link { text-decoration: none; }
.header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #534AB7, #7a72d4);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header__logout {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  padding: 7px 12px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.header__logout:hover {
  background: #fafafa;
  color: var(--color-text-primary);
}
</style>
