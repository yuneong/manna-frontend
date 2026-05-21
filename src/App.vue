<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const showHeader = computed(() => !route.meta.public)

const { fetchMe } = useAuth()
onMounted(fetchMe)
</script>

<template>
  <AppHeader v-if="showHeader" />
  <RouterView />
</template>
