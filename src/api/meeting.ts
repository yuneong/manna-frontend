import client from './client'
import type {
  Meeting,
  CreateMeetingRequest,
  SchedulesRequest,
  HeatmapResponse,
  MySchedulesResponse,
  ConfirmDateRequest,
} from '../types/meeting'

export const meetingApi = {
  create: (data: CreateMeetingRequest) => client.post<Meeting>('/api/v1/meetings', data),
  getById: (id: number) => client.get<Meeting>(`/api/v1/meetings/${id}`),
  getMy: () => client.get<Meeting[]>('/api/v1/meetings/my'),
  join: (id: number) => client.post(`/api/v1/meetings/${id}/join`),
  saveSchedules: (id: number, data: SchedulesRequest) =>
    client.put(`/api/v1/meetings/${id}/schedules`, data),
  getHeatmap: (id: number) => client.get<HeatmapResponse>(`/api/v1/meetings/${id}/heatmap`),
  getMySchedules: (id: number) =>
    client.get<MySchedulesResponse>(`/api/v1/meetings/${id}/schedules/me`),
  confirm: (id: number, data: ConfirmDateRequest) =>
    client.post<Meeting>(`/api/v1/meetings/${id}/confirm`, data),
}
