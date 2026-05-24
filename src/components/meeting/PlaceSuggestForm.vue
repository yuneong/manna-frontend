<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isPending: boolean
  alwaysOpen?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { name: string; url: string; memo: string }]
}>()

const name = ref('')
const link = ref('')
const memo = ref('')
const expanded = ref(props.alwaysOpen ?? false)

const canSubmit = computed(() => name.value.trim().length > 0)

function open() { expanded.value = true }
function close() { if (!props.alwaysOpen) expanded.value = false }

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    name: name.value.trim(),
    url: link.value.trim(),
    memo: memo.value.trim(),
  })
}

function reset() {
  name.value = ''
  link.value = ''
  memo.value = ''
  if (!props.alwaysOpen) expanded.value = false
}

defineExpose({ reset })
</script>

<template>
  <!-- Collapsed: dashed pill -->
  <button v-if="!expanded" class="add-btn" type="button" @click="open">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
    새 장소 제안하기
  </button>

  <!-- Expanded form -->
  <div v-else class="form">
    <div class="form__head">
      <span class="form__title">새 장소 제안하기</span>
      <button v-if="!alwaysOpen" class="form__close" type="button" aria-label="닫기" @click="close">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="form__fields">
      <!-- 장소 이름 -->
      <div class="field">
        <label class="field__label">
          장소 이름 <span class="field__required">*</span>
        </label>
        <input
          v-model="name"
          class="field__input"
          type="text"
          placeholder="예) 성수 와인바, 강남 닭갈비집"
          maxlength="100"
        />
      </div>

      <!-- 링크 -->
      <div class="field">
        <label class="field__label">
          링크 <span class="field__optional">(선택)</span>
        </label>
        <div class="field__input-wrap">
          <span class="field__prefix">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5.5 8.5a2 2 0 0 0 2.83 0l2-2a2 2 0 0 0-2.83-2.83l-.42.42M8.5 5.5a2 2 0 0 0-2.83 0l-2 2a2 2 0 0 0 2.83 2.83l.42-.42" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            v-model="link"
            class="field__input field__input--icon"
            type="url"
            placeholder="지도, 메뉴판 등 URL"
          />
        </div>
      </div>

      <!-- 메모 -->
      <div class="field">
        <label class="field__label">
          메모 <span class="field__optional">(선택)</span>
        </label>
        <textarea
          v-model="memo"
          class="field__textarea"
          placeholder="예) 1인당 3만원선, 주차 가능, 예약 필수"
          rows="2"
          maxlength="120"
        />
        <div class="field__counter" :class="memo.length > 100 && 'field__counter--over'">
          {{ memo.length }}/120
        </div>
      </div>
    </div>

    <button
      class="form__submit"
      :class="(!canSubmit || isPending) && 'form__submit--disabled'"
      :disabled="!canSubmit || isPending"
      type="button"
      @click="onSubmit"
    >
      <span v-if="isPending" class="form__spinner" />
      <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <path d="M6.5 2v9M2 6.5h9" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
      {{ isPending ? '제안 중...' : '제안하기' }}
    </button>
  </div>
</template>

<style scoped>
.add-btn {
  width: 100%;
  padding: 14px 16px;
  background: #fff;
  border: 1.5px dashed var(--color-border);
  border-radius: 12px;
  color: var(--color-text-secondary);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.01em;
  transition: border-color 0.12s, color 0.12s;
}
.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.form {
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px 16px;
}
.form__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.form__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
.form__close {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.1s;
}
.form__close:hover { background: #f4f4f6; }
.form__fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field__label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: -0.01em;
}
.field__required { color: var(--color-primary); }
.field__optional {
  color: var(--color-text-placeholder);
  font-weight: 500;
  margin-left: 2px;
}
.field__input {
  padding: 11px 13px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  color: var(--color-text-primary);
  font-family: inherit;
  outline: none;
  background: #fff;
  letter-spacing: -0.005em;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.field__input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__input::placeholder { color: var(--color-text-placeholder); }
.field__input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.field__input-wrap:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__prefix {
  padding: 0 0 0 13px;
  color: var(--color-text-placeholder);
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.field__input--icon {
  flex: 1;
  padding: 11px 13px 11px 8px;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
.field__input--icon:focus {
  border: none;
  box-shadow: none;
}
.field__textarea {
  padding: 11px 13px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--color-text-primary);
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 60px;
  background: #fff;
  letter-spacing: -0.005em;
  line-height: 1.5;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.field__textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__textarea::placeholder { color: var(--color-text-placeholder); }
.field__counter {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-placeholder);
  text-align: right;
  margin-top: 2px;
}
.field__counter--over { color: var(--color-primary); }
.form__submit {
  margin-top: 8px;
  padding: 12px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  align-self: flex-end;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.20);
  transition: background 0.12s;
}
.form__submit:hover:not(:disabled) { background: var(--color-primary-dark); }
.form__submit--disabled,
.form__submit:disabled {
  background: #C9C6E4;
  cursor: not-allowed;
  box-shadow: none;
}
.form__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
