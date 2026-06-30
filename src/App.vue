<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const showHeader = computed(() => !route.meta.public)
const isReady = ref(false)

const { fetchMe } = useAuth()
onMounted(async () => {
  try {
    await fetchMe()
  } finally {
    isReady.value = true
  }
})
</script>

<template>
  <template v-if="isReady">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </template>
  <div v-else class="app-loading">로딩 중...</div>
</template>

<style scoped>
.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--color-text-secondary);
}
</style>
