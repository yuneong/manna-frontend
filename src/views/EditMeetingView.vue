<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMeeting, useUpdateMeeting } from '../composables/useMeeting'
import DateRangeField from '../components/meeting/DateRangeField.vue'

const route = useRoute()
const router = useRouter()
const meetingId = Number(route.params.id)

const { data: meeting, isLoading } = useMeeting(meetingId)
const { mutate: updateMeeting, isPending } = useUpdateMeeting(meetingId)

const title = ref('')
const desc = ref('')
const start = ref<Date | null>(null)
const end = ref<Date | null>(null)
const originalStart = ref('')
const originalEnd = ref('')
const titleFocused = ref(false)
const descFocused = ref(false)
const showRangeModal = ref(false)
const toast = ref<string | null>(null)
let initialized = false

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

function ymd(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD')
}

watch(meeting, (m) => {
  if (!m || initialized) return
  initialized = true
  title.value = m.title
  desc.value = m.description ?? ''
  start.value = parseLocalDate(m.dateRangeStart)
  end.value = parseLocalDate(m.dateRangeEnd)
  originalStart.value = m.dateRangeStart
  originalEnd.value = m.dateRangeEnd
}, { immediate: true })

const isConfirmed = computed(() => meeting.value?.status === 'CONFIRMED')

const titleError = computed(() => {
  if (title.value.length > 50) return '약속 이름은 50자 이하여야 합니다'
  return null
})

const dateError = computed(() => {
  if (start.value && end.value && end.value < start.value)
    return '종료일은 시작일보다 빠를 수 없습니다'
  return null
})

const dateRangeChanged = computed(() => {
  if (!start.value || !end.value) return false
  return ymd(start.value) !== originalStart.value || ymd(end.value) !== originalEnd.value
})

const canSubmit = computed(
  () =>
    title.value.trim().length > 0 &&
    !titleError.value &&
    !!start.value &&
    !!end.value &&
    !dateError.value,
)

function onDateChange(s: Date | null, e: Date | null) {
  start.value = s
  end.value = e
}

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 3000)
}

function doUpdate() {
  if (!canSubmit.value || !start.value || !end.value) return
  updateMeeting(
    {
      title: title.value.trim(),
      description: desc.value.trim() || undefined,
      dateRangeStart: ymd(start.value),
      dateRangeEnd: ymd(end.value),
    },
    {
      onError: (e: any) => {
        const status = e.response?.status
        if (status === 403) showToastMsg('권한이 없어요')
        else if (status === 400) showToastMsg('재투표가 진행 중이에요. 재투표 종료 후 수정해주세요')
        else showToastMsg('수정에 실패했습니다.')
      },
    },
  )
}

function onSubmit() {
  if (!canSubmit.value) return
  if (dateRangeChanged.value) {
    showRangeModal.value = true
  } else {
    doUpdate()
  }
}
</script>

<template>
  <div class="edit">
    <div v-if="isLoading" class="edit__loading">불러오는 중...</div>

    <template v-else-if="meeting">
      <div class="edit__inner">
        <button class="back-btn" @click="router.push(`/meetings/${meetingId}`)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3l-4 4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          약속으로 돌아가기
        </button>

        <div class="edit__heading">
          <h1>약속 수정</h1>
        </div>

        <!-- CONFIRMED 안내 배너 -->
        <div v-if="isConfirmed" class="confirmed-banner">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M7.5 4.5v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="7.5" cy="10.2" r="0.7" fill="currentColor"/>
          </svg>
          확정된 약속을 수정하면 확정이 취소돼요.
        </div>

        <form class="edit__form" @submit.prevent="onSubmit">
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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="field__error-icon">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
                <path d="M7 4v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="7" cy="9.7" r="0.7" fill="currentColor"/>
              </svg>
              {{ titleError }}
            </div>
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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="field__error-icon">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
                <path d="M7 4v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="7" cy="9.7" r="0.7" fill="currentColor"/>
              </svg>
              {{ dateError }}
            </div>
            <div v-else-if="dateRangeChanged" class="field__warn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="field__warn-icon">
                <path d="M7 1.5L13 12.5H1L7 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                <path d="M7 5.5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="7" cy="10" r="0.7" fill="currentColor"/>
              </svg>
              날짜 범위를 변경하면 기존 참여자들의 응답이 초기화돼요.
            </div>
          </div>

          <!-- 버튼 -->
          <div class="edit__actions">
            <button type="button" class="cancel-btn" @click="router.push(`/meetings/${meetingId}`)">취소</button>
            <button
              type="submit"
              :disabled="!canSubmit || isPending"
              :class="['submit-btn', (!canSubmit || isPending) && 'submit-btn--disabled']"
            >
              <span v-if="isPending" class="submit-btn__spinner" />
              저장하기
            </button>
          </div>
        </form>
      </div>
    </template>

    <div v-else class="edit__loading">약속을 찾을 수 없습니다.</div>
  </div>

  <!-- DateRangeChangedModal -->
  <Teleport to="body">
    <div v-if="showRangeModal" class="modal-overlay" @click.self="showRangeModal = false">
      <div class="modal-box">
        <div class="modal-box__icon-wrap modal-box__icon-wrap--warn">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M11 2.5l9.5 17.5H1.5L11 2.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M11 9v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="11" cy="16.5" r="1" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="modal-box__title">날짜 범위를 변경할까요?</h2>
        <p class="modal-box__desc">
          날짜 범위를 변경하면 <b>{{ meeting?.responseCount ?? 0 }}명</b>의 참여자 응답이 초기화돼요.<br>
          참여자들이 날짜를 다시 선택해야 해요.
        </p>
        <div class="modal-box__actions">
          <button class="modal-btn modal-btn--ghost" @click="showRangeModal = false">돌아가기</button>
          <button class="modal-btn modal-btn--primary" :disabled="isPending" @click="doUpdate">
            <span v-if="isPending" class="submit-btn__spinner" />
            {{ isPending ? '저장 중...' : '초기화하고 저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Toast -->
  <Teleport to="body">
    <div v-if="toast" class="toast">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M7.5 4.5v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="7.5" cy="10.2" r="0.7" fill="currentColor"/>
      </svg>
      {{ toast }}
    </div>
  </Teleport>
</template>

<style scoped>
.edit {
  min-height: calc(100vh - 56px);
  background: var(--color-bg-secondary, #f8f8fb);
}
.edit__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 80px;
}
.edit__loading {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-secondary);
  font-size: 15px;
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
.back-btn:hover { background: #f4f4f6; color: var(--color-text-primary); }
.edit__heading {
  margin-bottom: 24px;
}
.edit__heading h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.15;
}
.confirmed-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: rgba(200, 140, 0, 0.08);
  border: 1px solid rgba(200, 140, 0, 0.25);
  border-radius: 10px;
  font-size: 13.5px;
  color: #7A5000;
  font-weight: 500;
  margin-bottom: 24px;
  line-height: 1.4;
}
.confirmed-banner svg { flex-shrink: 0; color: #B07800; }
.edit__form {
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
.field__warn {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12.5px;
  color: #B07800;
  font-weight: 500;
  line-height: 1.4;
}
.field__warn-icon { flex-shrink: 0; margin-top: 1px; color: #B07800; }
.edit__actions {
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
.cancel-btn:hover { background: #fafafa; color: var(--color-text-primary); }
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
  min-width: 130px;
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
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 30, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease-out;
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  padding: 28px 28px 22px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.18s ease-out;
}
.modal-box__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.modal-box__icon-wrap--warn {
  background: rgba(200, 140, 0, 0.10);
  color: #B07800;
}
.modal-box__title {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  line-height: 1.3;
}
.modal-box__desc {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  letter-spacing: -0.01em;
}
.modal-box__desc b { color: var(--color-text-primary); font-weight: 700; }
.modal-box__actions {
  display: flex;
  gap: 8px;
}
.modal-btn {
  flex: 1;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.modal-btn--primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  box-shadow: 0 1px 2px rgba(83, 74, 183, 0.18);
}
.modal-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(83, 74, 183, 0.28);
}
.modal-btn--primary:disabled { opacity: 0.7; cursor: not-allowed; }
.modal-btn--ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
}
.modal-btn--ghost:hover { background: #fafafa; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: #1E1E2E;
  color: #fff;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 1100;
  white-space: nowrap;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }

@media (max-width: 767px) {
  .edit__inner { padding: 12px 20px 100px; }
  .edit__heading h1 { font-size: 24px; }
  .edit__actions {
    flex-direction: column-reverse;
    margin-top: 8px;
  }
  .cancel-btn,
  .submit-btn { width: 100%; justify-content: center; }
  .modal-box { padding: 24px 20px 18px; }
}
</style>
