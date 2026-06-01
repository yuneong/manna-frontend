<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AppLogo from '../components/common/AppLogo.vue'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'
import SocialButton from '../components/common/SocialButton.vue'

const { login } = useAuth()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const rememberEmail = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('savedEmail')
  if (saved) {
    form.email = saved
    rememberEmail.value = true
  }
})
const touched = reactive({ email: false, password: false })
const serverError = ref<string | null>(null)
const loading = ref(false)

function validateEmail(v: string) {
  if (!v) return '이메일을 입력해주세요'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '올바른 이메일 형식이 아닙니다'
  return null
}
function validatePassword(v: string) {
  if (!v) return '비밀번호를 입력해주세요'
  return null
}

const errors = computed(() => ({
  email: touched.email ? validateEmail(form.email) || undefined : undefined,
  password: touched.password ? validatePassword(form.password) || undefined : undefined,
}))

async function onSubmit() {
  touched.email = true
  touched.password = true
  if (errors.value.email || errors.value.password) return

  loading.value = true
  serverError.value = null
  try {
    await login(form.email, form.password)
    if (rememberEmail.value) {
      localStorage.setItem('savedEmail', form.email)
    } else {
      localStorage.removeItem('savedEmail')
    }
    const redirect =
      sessionStorage.getItem('redirectAfterLogin') ||
      (route.query.redirect as string | undefined)
    sessionStorage.removeItem('redirectAfterLogin')
    await router.push(redirect || '/')
  } catch (e: any) {
    serverError.value = e.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <nav class="auth-nav">
      <AppLogo :size="22" />
      <span class="auth-nav__help">도움말</span>
    </nav>

    <div class="auth-center">
      <div class="auth-card">
        <div class="auth-heading">
          <AppLogo :size="38" text-only />
          <h1>다시 만나서 반가워요</h1>
          <p>친구들과 약속을 더 쉽게</p>
        </div>

        <div v-if="serverError" class="auth-server-error">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            class="auth-server-error__icon"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
            <path d="M8 4.5v4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
          </svg>
          {{ serverError }}
        </div>

        <form class="auth-form" @submit.prevent="onSubmit">
          <AppInput
            v-model="form.email"
            label="이메일"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            :error="errors.email"
            @blur="touched.email = true; serverError = null"
          />
          <AppInput
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호 입력"
            autocomplete="current-password"
            :error="errors.password"
            @blur="touched.password = true"
          />

          <div class="auth-options">
            <label class="remember-check">
              <input type="checkbox" v-model="rememberEmail" />
              <span>이메일 저장</span>
            </label>
            <a href="#" class="auth-forgot__link">비밀번호 찾기</a>
          </div>

          <AppButton type="submit" :loading="loading" :full-width="true">로그인</AppButton>

          <div class="auth-divider">
            <span class="auth-divider__line" />
            <span class="auth-divider__text">또는</span>
            <span class="auth-divider__line" />
          </div>

          <div class="auth-social">
            <SocialButton provider="kakao" />
<!--            <SocialButton provider="google" />-->
          </div>

          <p class="auth-switch">
            아직 manna 회원이 아니신가요?
            <RouterLink :to="{ name: 'sign-up', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">회원가입</RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.auth-nav {
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.auth-nav__help {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.auth-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  overflow: auto;
}
.auth-card { width: 100%; max-width: 380px; }
.auth-heading {
  text-align: center;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.auth-heading h1 {
  margin: 18px 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}
.auth-heading p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: -0.01em;
}
.auth-server-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 14px;
  background: var(--color-error-bg);
  border: 1px solid rgba(200, 54, 43, 0.2);
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-error);
  font-weight: 500;
  line-height: 1.45;
  margin-bottom: 16px;
}
.auth-server-error__icon { flex-shrink: 0; margin-top: 1px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.auth-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -4px;
}
.remember-check {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
.remember-check input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.auth-forgot__link {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
}
.auth-forgot__link:hover { color: var(--color-text-primary); }
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}
.auth-divider__line { flex: 1; height: 1px; background: var(--color-border); }
.auth-divider__text {
  font-size: 12px;
  color: var(--color-text-placeholder);
  font-weight: 500;
}
.auth-social { display: flex; flex-direction: column; gap: 8px; }
.auth-switch {
  text-align: center;
  font-size: 13.5px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}
.auth-switch a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
