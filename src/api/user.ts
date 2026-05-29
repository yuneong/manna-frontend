import client from './client'
import type { User, LoginResponse, SignUpRequest, LoginRequest } from '../types/user'

export const userApi = {
  signUp: (data: SignUpRequest) => client.post<User>('/v1/users/sign-up', data),
  login: (data: LoginRequest) => client.post<LoginResponse>('/v1/users/login', data),
  me: () => client.get<User>('/v1/users/me'),
  deleteMe: () => client.delete('/v1/users/me'),
}
