<script setup lang="ts">
import TabItem from './TabItem.vue'

defineProps<{
  active: string
  perms: {
    place: { enabled: boolean; hint?: string }
    settle: { enabled: boolean; hint?: string }
  }
}>()

const emit = defineEmits<{ change: [val: string] }>()
</script>

<template>
  <div class="l1-tabs">
    <TabItem label="일정" :active="active === 'schedule'" @click="emit('change', 'schedule')" />
    <TabItem
      label="장소"
      :active="active === 'place'"
      :locked="!perms.place.enabled"
      :lock-hint="perms.place.hint"
      @click="emit('change', 'place')"
    />
    <TabItem
      label="정산"
      :active="active === 'settle'"
      :locked="!perms.settle.enabled"
      :lock-hint="perms.settle.hint"
      @click="emit('change', 'settle')"
    />
  </div>
</template>

<style scoped>
.l1-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}
</style>
