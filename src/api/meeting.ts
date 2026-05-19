import client from './client'
import type {
  Meeting,
  CreateMeetingRequest,
  AvailabilityRequest,
  HeatmapResponse,
  MyAvailabilityResponse,
  ConfirmDateRequest,
} from '../types/meeting'

export const meetingApi = {
  create: (data: CreateMeetingRequest) => client.post<Meeting>('/api/v1/meetings', data),
  getById: (id: number) => client.get<Meeting>(`/api/v1/meetings/${id}`),
  getMy: () => client.get<Meeting[]>('/api/v1/meetings/my'),
  join: (id: number) => client.post(`/api/v1/meetings/${id}/join`),
  setAvailability: (id: number, data: AvailabilityRequest) =>
    client.put(`/api/v1/meetings/${id}/availability`, data),
  getHeatmap: (id: number) => client.get<HeatmapResponse>(`/api/v1/meetings/${id}/heatmap`),
  getMyAvailability: (id: number) =>
    client.get<MyAvailabilityResponse>(`/api/v1/meetings/${id}/availability/me`),
  confirm: (id: number, data: ConfirmDateRequest) =>
    client.post<Meeting>(`/api/v1/meetings/${id}/confirm`, data),
}
