<script setup lang="ts">
import { computed, watch } from 'vue'
import type { MeetingStatus } from '../../types/meeting'
import L1Tabs from './L1Tabs.vue'
import L2Tabs from './L2Tabs.vue'

const props = defineProps<{
  status: MeetingStatus
  l1: string
  l2: string
}>()

const emit = defineEmits<{
  'update:l1': [val: string]
  'update:l2': [val: string]
}>()

const perms = computed(() => {
  const isConfirmedOrLater = props.status !== 'OPEN'
  return {
    mine:   { enabled: !isConfirmedOrLater, hint: '일정이 확정되어 수정할 수 없어요' },
    place:  { enabled: isConfirmedOrLater,  hint: '일정 확정 후 이용할 수 있어요' },
    settle: { enabled: isConfirmedOrLater,  hint: '일정 확정 후 이용할 수 있어요' },
  }
})

watch(
  () => props.status,
  () => {
    if (!perms.value.mine.enabled && props.l2 === 'mine') emit('update:l2', 'heat')
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <L1Tabs :active="l1" :perms="perms" @change="emit('update:l1', $event)" />
    <L2Tabs
      v-if="l1 === 'schedule'"
      :active="l2"
      :perms="perms"
      @change="emit('update:l2', $event)"
    />
  </div>
</template>
