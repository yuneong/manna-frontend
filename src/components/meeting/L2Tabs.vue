<script setup lang="ts">
import TabItem from './TabItem.vue'

defineProps<{
  active: string
  perms: {
    mine: { enabled: boolean; hint?: string }
  }
}>()

const emit = defineEmits<{ change: [val: string] }>()
</script>

<template>
  <div class="l2-tabs">
    <TabItem
      label="내 일정 선택"
      :active="active === 'mine'"
      :locked="!perms.mine.enabled"
      :lock-hint="perms.mine.hint"
      :level="2"
      @click="emit('change', 'mine')"
    />
    <TabItem
      label="전체 현황"
      :active="active === 'heat'"
      :level="2"
      @click="emit('change', 'heat')"
    />
  </div>
</template>

<style scoped>
.l2-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: #FAFAFB;
  padding: 0 4px;
  margin-top: -1px;
}
</style>
