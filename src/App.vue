<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const showHeader = computed(() => !route.meta.public)
</script>

<template>
  <AppHeader v-if="showHeader" />
  <RouterView />
</template>
