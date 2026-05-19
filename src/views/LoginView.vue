<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { z } from 'zod'
import { useAuth } from '../composables/useAuth'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const errorMsg = ref('')
const loading = ref(false)

const { login } = useAuth()

async function onSubmit() {
  errors.email = undefined
  errors.password = undefined
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
    await login(form.email, form.password)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-box">
      <h1 class="auth-logo">manna</h1>
      <p class="auth-sub">친구들과 약속을 쉽게 잡아보세요</p>
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
        <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
        <AppButton type="submit" :loading="loading" :full-width="true">로그인</AppButton>
      </form>
      <p class="auth-link">
        계정이 없으신가요?
        <RouterLink to="/sign-up">회원가입</RouterLink>
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
