import client from './client'
import type {
  Meeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  SchedulesRequest,
  HeatmapResponse,
  MySchedulesResponse,
  ConfirmDateRequest,
  RevoteResponse,
  CreateRevoteRequest,
  VoteRevoteRequest,
  ConfirmRevoteRequest,
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
  update: (id: number, data: UpdateMeetingRequest) => client.put<Meeting>(`/api/v1/meetings/${id}`, data),
  deleteMeeting: (id: number) => client.delete(`/api/v1/meetings/${id}`),
  cancelConfirm: (id: number) => client.delete(`/api/v1/meetings/${id}/confirm`),
  getRevote: (id: number) => client.get<RevoteResponse>(`/api/v1/meetings/${id}/revote`),
  createRevote: (id: number, data: CreateRevoteRequest) =>
    client.post<RevoteResponse>(`/api/v1/meetings/${id}/revote`, data),
  voteRevote: (id: number, data: VoteRevoteRequest) =>
    client.post<RevoteResponse>(`/api/v1/meetings/${id}/revote/vote`, data),
  confirmRevote: (id: number, data: ConfirmRevoteRequest) =>
    client.post<Meeting>(`/api/v1/meetings/${id}/revote/confirm`, data),
}
