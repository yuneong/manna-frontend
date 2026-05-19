import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { userApi } from '../api/user'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function login(email: string, password: string) {
    const res = await userApi.login({ email, password })
    authStore.setToken(res.data.accessToken)
    const userRes = await userApi.me()
    authStore.setUser(userRes.data)
    await router.push('/')
  }

  async function logout() {
    authStore.logout()
    await router.push('/login')
  }

  async function fetchMe() {
    if (!authStore.token) return
    const res = await userApi.me()
    authStore.setUser(res.data)
  }

  return { login, logout, fetchMe }
}
