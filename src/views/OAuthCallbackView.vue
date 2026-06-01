<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const authStore = useAuthStore()
const { fetchMe } = useAuth()

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    authStore.setToken(token)
    await fetchMe()
    const redirect = sessionStorage.getItem('redirectAfterLogin') || '/'
    sessionStorage.removeItem('redirectAfterLogin')
    router.replace(redirect)
  } else {
    router.replace({ name: 'login', query: { error: 'social' } })
  }
})
</script>

<template>
  <div class="oauth-loading">로그인 처리 중...</div>
</template>

<style scoped>
.oauth-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--color-text-secondary);
}
</style>
