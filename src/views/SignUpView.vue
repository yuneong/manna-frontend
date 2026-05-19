<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { z } from 'zod'
import { userApi } from '../api/user'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'

const router = useRouter()

const schema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  nickname: z.string().min(1, '닉네임을 입력해주세요').max(20, '20자 이하로 입력해주세요'),
})

const form = reactive({ email: '', password: '', nickname: '' })
const errors = reactive<{ email?: string; password?: string; nickname?: string }>({})
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  errors.email = undefined
  errors.password = undefined
  errors.nickname = undefined
  errorMsg.value = ''

  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((e: import('zod').ZodIssue) => {
      const key = e.path[0] as keyof typeof errors
      if (!(key in errors) || !errors[key]) errors[key] = e.message
    })
    return
  }

  loading.value = true
  try {
    await userApi.signUp({ email: form.email, password: form.password, nickname: form.nickname })
    await router.push('/login')
  } catch (e: any) {
    if (e.response?.status === 409) {
      errorMsg.value = '이미 사용 중인 이메일입니다.'
    } else {
      errorMsg.value = e.response?.data?.message || '회원가입에 실패했습니다.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-box">
      <h1 class="auth-logo">manna</h1>
      <p class="auth-sub">새 계정 만들기</p>
      <form class="auth-form" @submit.prevent="onSubmit">
        <AppInput
          v-model="form.email"
          label="이메일"
          type="email"
          placeholder="email@example.com"
          :error="errors.email"
        />
        <AppInput
          v-model="form.password"
          label="비밀번호"
          type="password"
          placeholder="8자 이상"
          :error="errors.password"
        />
        <AppInput
          v-model="form.nickname"
          label="닉네임"
          placeholder="20자 이하"
          :error="errors.nickname"
        />
        <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
        <AppButton type="submit" :loading="loading" :full-width="true">회원가입</AppButton>
      </form>
      <p class="auth-link">
        이미 계정이 있으신가요?
        <RouterLink to="/login">로그인</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  padding: 24px;
}
.auth-box {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.auth-logo {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-primary);
  text-align: center;
  letter-spacing: -1px;
}
.auth-sub {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: -10px;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.auth-error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
}
.auth-link {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.auth-link a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
