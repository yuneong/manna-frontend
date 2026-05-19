import client from './client'
import type { User, LoginResponse, SignUpRequest, LoginRequest } from '../types/user'

export const userApi = {
  signUp: (data: SignUpRequest) => client.post<User>('/api/v1/users/sign-up', data),
  login: (data: LoginRequest) => client.post<LoginResponse>('/api/v1/users/login', data),
  me: () => client.get<User>('/api/v1/users/me'),
  deleteMe: () => client.delete('/api/v1/users/me'),
}
