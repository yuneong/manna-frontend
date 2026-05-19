<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string | undefined
    label?: string
    type?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    autocomplete?: string
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const focused = ref(false)
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label">{{ label }}</label>
    <div
      :class="[
        'field__wrap',
        { 'field__wrap--focused': focused && !error, 'field__wrap--error': !!error },
      ]"
    >
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        class="field__input"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false; emit('blur')"
      />
      <slot name="suffix" />
    </div>
    <div v-if="error" class="field__error">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        class="field__error-icon"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" />
        <path d="M7 4v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="7" cy="9.7" r="0.7" fill="currentColor" />
      </svg>
      {{ error }}
    </div>
    <div v-else-if="hint" class="field__hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.field__wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field__wrap--focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.field__wrap--error { border-color: var(--color-error); }
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
  min-width: 0;
}
.field__input::placeholder { color: var(--color-text-placeholder); }
.field__input:disabled { cursor: not-allowed; opacity: 0.6; }
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
</style>
