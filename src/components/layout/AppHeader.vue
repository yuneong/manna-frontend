<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAuth } from '../../composables/useAuth'
import AppLogo from '../common/AppLogo.vue'

const authStore = useAuthStore()
const { logout } = useAuth()
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink to="/" class="header__logo-link">
        <AppLogo :size="20" />
      </RouterLink>
      <div v-if="authStore.isAuthenticated" class="header__right">
        <span class="header__nickname">{{ authStore.user?.nickname }}</span>
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
  gap: 16px;
}
.header__nickname {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.header__logout {
  font-size: 14px;
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.header__logout:hover { color: var(--color-text-primary); }
</style>
