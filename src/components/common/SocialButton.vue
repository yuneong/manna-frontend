<script setup lang="ts">
const props = defineProps<{ provider: 'kakao' | 'google' }>()

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function login() {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (redirect) sessionStorage.setItem('redirectAfterLogin', redirect)
  window.location.href = `${BASE}/v1/auth/${props.provider}`
}
</script>

<template>
  <button :class="['social-btn', `social-btn--${provider}`]" type="button" @click="login">
    <svg
      v-if="provider === 'kakao'"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 2.5C5.13 2.5 2 4.95 2 7.97c0 1.94 1.29 3.64 3.24 4.6l-.82 3 3.5-2.32c.36.04.72.07 1.08.07 3.87 0 7-2.45 7-5.47S12.87 2.5 9 2.5z"
        fill="#191919"
      />
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M16.6 9.2c0-.6-.05-1.18-.15-1.73H9v3.27h4.27c-.18 1-.74 1.84-1.58 2.4v2h2.56c1.5-1.38 2.36-3.42 2.36-5.94z"
        fill="#4285F4"
      />
      <path
        d="M9 17c2.13 0 3.92-.7 5.23-1.9l-2.56-2c-.71.48-1.62.76-2.67.76-2.05 0-3.8-1.38-4.42-3.24H1.92v2.07A8 8 0 0 0 9 17z"
        fill="#34A853"
      />
      <path
        d="M4.58 10.62A4.8 4.8 0 0 1 4.33 9c0-.56.1-1.1.25-1.62V5.31H1.92A8 8 0 0 0 1 9c0 1.3.31 2.52.92 3.69l2.66-2.07z"
        fill="#FBBC05"
      />
      <path
        d="M9 4.14c1.16 0 2.2.4 3.02 1.18l2.27-2.27C12.92 1.78 11.13 1 9 1A8 8 0 0 0 1.92 5.31l2.66 2.07C5.2 5.52 6.95 4.14 9 4.14z"
        fill="#EA4335"
      />
    </svg>
    {{ provider === 'kakao' ? '카카오로 계속하기' : 'Google로 계속하기' }}
  </button>
</template>

<style scoped>
.social-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: filter 0.12s;
  letter-spacing: -0.01em;
  border: none;
}
.social-btn:hover { filter: brightness(0.97); }
.social-btn--kakao {
  background: #fee500;
  color: #191919;
}
.social-btn--google {
  background: #fff;
  color: #1a1a1f;
  border: 1.5px solid #e5e5ea;
}
</style>
