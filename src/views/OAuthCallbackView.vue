<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    localStorage.setItem('accessToken', token)
    router.replace('/')
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