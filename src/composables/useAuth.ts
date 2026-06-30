import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import { userApi } from '../api/user'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  async function login(email: string, password: string) {
    queryClient.clear()
    const res = await userApi.login({ email, password })
    authStore.setToken(res.data.accessToken)
    const userRes = await userApi.me()
    authStore.setUser(userRes.data)
  }

  async function logout() {
    authStore.logout()
    queryClient.clear()
    await router.push('/login')
  }

  async function fetchMe() {
    if (!authStore.token) return
    const res = await userApi.me()
    authStore.setUser(res.data)
  }

  return { login, logout, fetchMe }
}
