<script setup lang="ts">
import { computed } from 'vue'
import { avatarColorForId } from '../../utils/avatar'

const props = withDefaults(
  defineProps<{
    names: string[]
    images?: (string | null | undefined)[]
    ids?: number[]
    max?: number
  }>(),
  { max: 4 },
)

const palette = ['#534AB7', '#0F6E56', '#C8362B', '#D89B1A', '#3B70C9', '#8E4FBE']

const visible = computed(() => props.names.slice(0, props.max))
const overflow = computed(() => Math.max(0, props.names.length - props.max))

function colorFor(name: string, i: number): string {
  if (props.ids?.[i] != null) return avatarColorForId(props.ids[i]!)
  let hash = 0
  for (let j = 0; j < name.length; j++) hash = name.charCodeAt(j) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]!
}
</script>

<template>
  <div class="stack">
    <template v-for="(name, i) in visible" :key="name">
      <img
        v-if="images?.[i]"
        :src="images[i]!"
        class="stack__avatar stack__avatar--img"
        :title="name"
        alt=""
      />
      <span
        v-else
        class="stack__avatar"
        :style="{ background: colorFor(name, i) }"
        :title="name"
      >
        {{ name[0] }}
      </span>
    </template>
    <span v-if="overflow > 0" class="stack__overflow">+{{ overflow }}</span>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  align-items: center;
}
.stack__avatar,
.stack__overflow {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  margin-left: -6px;
}
.stack__avatar:first-child,
.stack__overflow:first-child {
  margin-left: 0;
}
.stack__avatar--img {
  object-fit: cover;
}
.stack__overflow {
  background: #e0dff5;
  color: var(--color-primary);
}
</style>