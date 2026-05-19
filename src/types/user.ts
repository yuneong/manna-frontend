export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
}

export interface SignUpRequest {
  email: string
  password: string
  nickname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ErrorResponse {
  status: number
  message: string
}
