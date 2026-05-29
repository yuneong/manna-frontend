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
  PlacesResponse,
  PlaceSuggestRequest,
  Place,
} from '../types/meeting'

export const meetingApi = {
  create: (data: CreateMeetingRequest) => client.post<Meeting>('/v1/meetings', data),
  getById: (id: number) => client.get<Meeting>(`/v1/meetings/${id}`),
  getMy: () => client.get<Meeting[]>('/v1/meetings/my'),
  join: (id: number) => client.post(`/v1/meetings/${id}/join`),
  saveSchedules: (id: number, data: SchedulesRequest) =>
    client.put(`/v1/meetings/${id}/schedules`, data),
  getHeatmap: (id: number) => client.get<HeatmapResponse>(`/v1/meetings/${id}/heatmap`),
  getMySchedules: (id: number) =>
    client.get<MySchedulesResponse>(`/v1/meetings/${id}/schedules/me`),
  confirm: (id: number, data: ConfirmDateRequest) =>
    client.post<Meeting>(`/v1/meetings/${id}/confirm`, data),
  update: (id: number, data: UpdateMeetingRequest) => client.put<Meeting>(`/v1/meetings/${id}`, data),
  deleteMeeting: (id: number) => client.delete(`/v1/meetings/${id}`),
  cancelConfirm: (id: number) => client.delete(`/v1/meetings/${id}/confirm`),
  getRevote: (id: number) => client.get<RevoteResponse>(`/v1/meetings/${id}/revote`),
  createRevote: (id: number, data: CreateRevoteRequest) =>
    client.post<RevoteResponse>(`/v1/meetings/${id}/revote`, data),
  voteRevote: (id: number, data: VoteRevoteRequest) =>
    client.post<RevoteResponse>(`/v1/meetings/${id}/revote/vote`, data),
  confirmRevote: (id: number, data: ConfirmRevoteRequest) =>
    client.post<Meeting>(`/v1/meetings/${id}/revote/confirm`, data),
  getPlaces: (id: number) => client.get<PlacesResponse>(`/v1/meetings/${id}/places`),
  suggestPlace: (id: number, data: PlaceSuggestRequest) =>
    client.post<Place>(`/v1/meetings/${id}/places`, data),
  votePlace: (id: number, placeId: number) =>
    client.post(`/v1/meetings/${id}/places/${placeId}/vote`),
}
