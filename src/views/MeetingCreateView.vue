<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useCreateMeeting } from '../composables/useMeeting'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'

const router = useRouter()

const schema = z
  .object({
    title: z.string().min(1, '약속 이름을 입력해주세요').max(50, '50자 이하로 입력해주세요'),
    description: z.string().max(200, '200자 이하로 입력해주세요').optional(),
    dateRangeStart: z.string().min(1, '시작 날짜를 선택해주세요'),
    dateRangeEnd: z.string().min(1, '종료 날짜를 선택해주세요'),
  })
  .refine((d) => !d.dateRangeStart || !d.dateRangeEnd || d.dateRangeStart <= d.dateRangeEnd, {
    message: '시작 날짜는 종료 날짜보다 이전이어야 합니다',
    path: ['dateRangeEnd'],
  })

const form = reactive({ title: '', description: '', dateRangeStart: '', dateRangeEnd: '' })
const errors = reactive<{
  title?: string
  description?: string
  dateRangeStart?: string
  dateRangeEnd?: string
}>({})
const errorMsg = ref('')

const { mutate: createMeeting, isPending } = useCreateMeeting()

function onSubmit() {
  errors.title = undefined
  errors.description = undefined
  errors.dateRangeStart = undefined
  errors.dateRangeEnd = undefined
  errorMsg.value = ''

  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((e: import('zod').ZodIssue) => {
      const key = e.path[0] as keyof typeof errors
      if (!(key in errors) || !errors[key]) errors[key] = e.message
    })
    return
  }

  createMeeting(
    {
      title: form.title,
      description: form.description || undefined,
      dateRangeStart: form.dateRangeStart,
      dateRangeEnd: form.dateRangeEnd,
    },
    {
      onError: (e: any) => {
        errorMsg.value = e.response?.data?.message || '약속 생성에 실패했습니다.'
      },
    },
  )
}
</script>

<template>
  <div class="create-page">
    <div class="create-box">
      <div class="create-header">
        <button class="back-btn" @click="router.back()">←</button>
        <h2>약속 만들기</h2>
      </div>
      <form class="create-form" @submit.prevent="onSubmit">
        <AppInput
          v-model="form.title"
          label="약속 이름"
          placeholder="예) 6월 회식"
          :error="errors.title"
        />
        <AppInput
          v-model="form.description"
          label="설명 (선택)"
          placeholder="간단한 메모를 남겨보세요"
          :error="errors.description"
        />
        <div class="date-row">
          <AppInput
            v-model="form.dateRangeStart"
            label="시작 날짜"
            type="date"
            :error="errors.dateRangeStart"
          />
          <AppInput
            v-model="form.dateRangeEnd"
            label="종료 날짜"
            type="date"
            :error="errors.dateRangeEnd"
          />
        </div>
        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
        <AppButton type="submit" :loading="isPending" :full-width="true">약속 만들기</AppButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  min-height: calc(100vh - 56px);
  background: var(--color-bg-secondary);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 24px;
}
.create-box {
  width: 100%;
  max-width: 560px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 32px;
}
.create-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.create-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.back-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-primary);
  padding: 0;
  line-height: 1;
}
.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
}
@media (max-width: 767px) {
  .create-page { padding: 16px; }
  .create-box { padding: 20px; }
  .date-row { grid-template-columns: 1fr; }
}
</style>
