import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthEndpoint = url.includes('/users/login') || url.includes('/users/signup')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken')
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?redirect=${redirect}`
      return new Promise(() => {})
    }
    return Promise.reject(error)
  },
)

export default client
