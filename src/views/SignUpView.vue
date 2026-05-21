<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { userApi } from '../api/user'
import AppLogo from '../components/common/AppLogo.vue'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'
import SocialButton from '../components/common/SocialButton.vue'

const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '', nickname: '' })
const touched = reactive({ email: false, password: false, nickname: false })
const serverError = ref<string | null>(null)
const emailServerError = ref<string | null>(null)
const loading = ref(false)

function validateEmail(v: string) {
  if (!v) return '이메일을 입력해주세요'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '올바른 이메일 형식이 아닙니다'
  return null
}
function validatePassword(v: string) {
  if (!v) return '비밀번호를 입력해주세요'
  if (v.length < 8) return '비밀번호는 8자 이상이어야 합니다'
  return null
}
function validateNickname(v: string) {
  if (!v) return '닉네임을 입력해주세요'
  if (v.length < 2) return '닉네임은 2자 이상이어야 합니다'
  return null
}

const errors = computed(() => ({
  email:
    emailServerError.value ||
    (touched.email ? validateEmail(form.email) || undefined : undefined),
  password: touched.password ? validatePassword(form.password) || undefined : undefined,
  nickname: touched.nickname ? validateNickname(form.nickname) || undefined : undefined,
}))

async function onSubmit() {
  touched.email = true
  touched.password = true
  touched.nickname = true
  if (errors.value.email || errors.value.password || errors.value.nickname) return

  loading.value = true
  serverError.value = null
  try {
    await userApi.signUp({ email: form.email, password: form.password, nickname: form.nickname })
    const redirect = route.query.redirect as string | undefined
    await router.push({ name: 'login', query: redirect ? { redirect } : {} })
  } catch (e: any) {
    if (e.response?.status === 409) {
      emailServerError.value = '이미 사용 중인 이메일입니다'
    } else {
      serverError.value = e.response?.data?.message || '회원가입에 실패했습니다'
    }
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
          <AppLogo :size="38" />
          <h1>manna 시작하기</h1>
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
            @blur="touched.email = true; emailServerError = null"
          />
          <AppInput
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력"
            autocomplete="new-password"
            :error="errors.password"
            :hint="!errors.password ? '영문, 숫자를 조합한 8자 이상' : undefined"
            @blur="touched.password = true"
          />
          <AppInput
            v-model="form.nickname"
            label="닉네임"
            placeholder="친구들에게 보일 이름"
            :error="errors.nickname"
            @blur="touched.nickname = true"
          />

          <div class="auth-terms">
            계속 진행하면 manna의
            <a href="#">이용약관</a> 및
            <a href="#">개인정보처리방침</a>에 동의하게 됩니다.
          </div>

          <AppButton type="submit" :loading="loading" :full-width="true">시작하기</AppButton>

          <div class="auth-divider">
            <span class="auth-divider__line" />
            <span class="auth-divider__text">또는</span>
            <span class="auth-divider__line" />
          </div>

          <div class="auth-social">
            <SocialButton provider="kakao" />
            <SocialButton provider="google" />
          </div>

          <p class="auth-switch">
            이미 계정이 있으신가요?
            <RouterLink :to="{ name: 'login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">로그인</RouterLink>
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
.auth-terms {
  padding: 11px 13px;
  background: var(--color-bg-secondary);
  border-radius: 9px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.auth-terms a {
  color: var(--color-text-primary);
  font-weight: 500;
  text-decoration: none;
}
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
