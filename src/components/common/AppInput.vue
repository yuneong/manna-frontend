<script setup lang="ts">
defineProps<{
  modelValue: string | undefined
  label?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="input-wrap">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :value="modelValue"
      :type="type || 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['input', { 'input--error': error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="input-error">{{ error }}</span>
  </div>
</template>

<style scoped>
.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}
.input {
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--color-primary); }
.input--error { border-color: #e53935; }
.input:disabled {
  background: var(--color-bg-secondary);
  cursor: not-allowed;
}
.input-error {
  font-size: 12px;
  color: #e53935;
}
</style>
