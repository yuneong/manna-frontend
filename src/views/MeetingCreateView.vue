<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateMeeting } from '../composables/useMeeting'
import DateRangeField from '../components/meeting/DateRangeField.vue'

const router = useRouter()
const { mutate: createMeeting, isPending } = useCreateMeeting()

const title = ref('')
const desc = ref('')
const start = ref<Date | null>(null)
const end = ref<Date | null>(null)
const serverError = ref<string | null>(null)
const titleFocused = ref(false)
const descFocused = ref(false)

const titleError = computed(() => {
  if (title.value.length > 50) return '약속 이름은 50자 이하여야 합니다'
  return null
})

const dateError = computed(() => {
  if (start.value && end.value && end.value < start.value)
    return '종료일은 시작일보다 빠를 수 없습니다'
  return null
})

const canSubmit = computed(
  () =>
    title.value.trim().length > 0 &&
    !titleError.value &&
    !!start.value &&
    !!end.value &&
    !dateError.value,
)

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onDateChange(s: Date | null, e: Date | null) {
  start.value = s
  end.value = e
}

function onSubmit() {
  if (!canSubmit.value || !start.value || !end.value) return
  serverError.value = null
  createMeeting(
    {
      title: title.value.trim(),
      description: desc.value.trim() || undefined,
      dateRangeStart: ymd(start.value),
      dateRangeEnd: ymd(end.value),
    },
    {
      onError: (e: any) => {
        serverError.value = e.response?.data?.message || '약속 생성에 실패했습니다.'
      },
    },
  )
}
</script>

<template>
  <div class="create">
    <div class="create__inner">
      <button class="back-btn" @click="router.back()">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M8.5 3l-4 4 4 4"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        뒤로
      </button>

      <div class="create__heading">
        <h1>약속 만들기</h1>
        <p>약속방을 만들고 친구들을 초대해 날짜를 모아보세요</p>
      </div>

      <div v-if="serverError" class="create__server-error">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          class="create__server-error-icon"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
          <path d="M8 4.5v4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
        </svg>
        {{ serverError }}
      </div>

      <form class="create__form" @submit.prevent="onSubmit">
        <!-- 약속 이름 -->
        <div class="field">
          <div class="field__head">
            <label class="field__label">약속 이름 <span class="field__required">*</span></label>
            <span :class="['field__counter', title.length > 50 && 'field__counter--over']">
              {{ title.length }}/50
            </span>
          </div>
          <div
            :class="[
              'field__input-wrap',
              titleFocused && !titleError && 'field__input-wrap--focused',
              titleError && 'field__input-wrap--error',
            ]"
          >
            <input
              v-model="title"
              type="text"
              class="field__input"
              placeholder="어떤 약속인가요?"
              maxlength="60"
              @focus="titleFocused = true"
              @blur="titleFocused = false"
            />
          </div>
          <div v-if="titleError" class="field__error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              class="field__error-icon"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" />
              <path d="M7 4v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              <circle cx="7" cy="9.7" r="0.7" fill="currentColor" />
            </svg>
            {{ titleError }}
          </div>
          <div v-else class="field__hint">예) 6월 동아리 회식, 지원이 생일파티</div>
        </div>

        <!-- 설명 -->
        <div class="field">
          <label class="field__label">설명</label>
          <textarea
            v-model="desc"
            :class="['field__textarea', descFocused && 'field__textarea--focused']"
            placeholder="(선택) 친구들에게 전달할 내용이 있다면 적어주세요"
            rows="3"
            @focus="descFocused = true"
            @blur="descFocused = false"
          />
          <div class="field__hint">약속에 대한 안내, 참고사항을 적어보세요</div>
        </div>

        <!-- 날짜 범위 -->
        <div class="field">
          <label class="field__label">날짜 범위 <span class="field__required">*</span></label>
          <DateRangeField
            :start="start"
            :end="end"
            :error="!!dateError"
            @change="onDateChange"
          />
          <div v-if="dateError" class="field__error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              class="field__error-icon"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" />
              <path d="M7 4v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              <circle cx="7" cy="9.7" r="0.7" fill="currentColor" />
            </svg>
            {{ dateError }}
          </div>
          <div v-else class="field__hint">친구들이 가능한 날짜를 투표할 수 있는 범위를 정해주세요</div>
        </div>

        <!-- 버튼 -->
        <div class="create__actions">
          <button type="button" class="cancel-btn" @click="router.back()">취소</button>
          <button
            type="submit"
            :disabled="!canSubmit || isPending"
            :class="['submit-btn', (!canSubmit || isPending) && 'submit-btn--disabled']"
          >
            <span v-if="isPending" class="submit-btn__spinner" />
            약속방 만들기
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create {
  min-height: calc(100vh - 56px);
  background: var(--color-bg-secondary, #f8f8fb);
}
.create__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 6px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  margin-bottom: 8px;
  margin-left: -6px;
  transition: background 0.12s, color 0.12s;
}
.back-btn:hover {
  background: #f4f4f6;
  color: var(--color-text-primary);
}
.create__heading {
  margin-bottom: 32px;
}
.create__heading h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.15;
}
.create__heading p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: -0.01em;
}
.create__server-error {
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
  margin-bottom: 20px;
  max-width: 560px;
}
.create__server-error-icon { flex-shrink: 0; margin-top: 1px; }
.create__form {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.field { display: flex; flex-direction: column; gap: 8px; }
.field__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.field__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.field__required { color: var(--color-primary); margin-left: 3px; }
.field__counter {
  font-size: 12px;
  color: var(--color-text-placeholder);
  font-weight: 500;
}
.field__counter--over { color: var(--color-error); }
.field__input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.field__input-wrap--focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__input-wrap--error { border-color: var(--color-error); }
.field__input {
  flex: 1;
  padding: 13px 14px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--color-text-primary);
  font-family: inherit;
  letter-spacing: -0.005em;
}
.field__input::placeholder { color: var(--color-text-placeholder); }
.field__textarea {
  width: 100%;
  padding: 13px 14px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  color: var(--color-text-primary);
  outline: none;
  resize: vertical;
  font-family: inherit;
  letter-spacing: -0.005em;
  transition: border-color 0.12s, box-shadow 0.12s;
  line-height: 1.55;
  min-height: 80px;
  box-sizing: border-box;
}
.field__textarea--focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__textarea::placeholder { color: var(--color-text-placeholder); }
.field__error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12.5px;
  color: var(--color-error);
  font-weight: 500;
  line-height: 1.4;
}
.field__error-icon { flex-shrink: 0; margin-top: 1px; }
.field__hint {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.create__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.cancel-btn {
  padding: 13px 22px;
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, color 0.12s;
}
.cancel-btn:hover {
  background: #fafafa;
  color: var(--color-text-primary);
}
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 22px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, box-shadow 0.12s;
  box-shadow: 0 1px 2px rgba(83, 74, 183, 0.18);
  min-width: 160px;
}
.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(83, 74, 183, 0.28);
}
.submit-btn--disabled,
.submit-btn:disabled {
  background: #c9c6e4;
  cursor: not-allowed;
  box-shadow: none;
}
.submit-btn__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 767px) {
  .create__inner { padding: 12px 20px 100px; }
  .create__heading h1 { font-size: 24px; }
  .create__actions {
    flex-direction: column-reverse;
    margin-top: 8px;
  }
  .cancel-btn,
  .submit-btn { width: 100%; justify-content: center; }
}
</style>
