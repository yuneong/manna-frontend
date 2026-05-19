<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'danger'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    fullWidth?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false, loading: false, fullWidth: false },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`, { 'btn--full': fullWidth, 'btn--loading': loading }]"
  >
    <span v-if="loading" class="btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background-color 0.15s;
}
.btn:disabled { cursor: not-allowed; }
.btn--primary:disabled { background-color: #c9c6e4; }
.btn--full { width: 100%; }
.btn--primary {
  background-color: var(--color-primary);
  color: #fff;
}
.btn--primary:hover:not(:disabled) { background-color: var(--color-primary-dark); }
.btn--ghost {
  background-color: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}
.btn--ghost:hover:not(:disabled) { background-color: var(--color-primary-light); }
.btn--danger {
  background-color: #e53935;
  color: #fff;
}
.btn--danger:hover:not(:disabled) { background-color: #c62828; }
.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
