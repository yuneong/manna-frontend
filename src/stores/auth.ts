import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '../types/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(accessToken: string) {
    token.value = accessToken
    localStorage.setItem('accessToken', accessToken)
  }

  function setUser(userData: User) {
    user.value = userData
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('accessToken')
  }

  return { token, user, isAuthenticated, setToken, setUser, logout }
})
