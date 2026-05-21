import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { meetingApi } from '../api/meeting'
import type { CreateMeetingRequest, SchedulesRequest, ConfirmDateRequest } from '../types/meeting'

export function useMyMeetings() {
  return useQuery({
    queryKey: ['meetings', 'my'],
    queryFn: () => meetingApi.getMy().then((r) => r.data),
  })
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: ['meetings', id],
    queryFn: () => meetingApi.getById(id).then((r) => r.data),
  })
}

export function useHeatmap(id: number) {
  return useQuery({
    queryKey: ['meetings', id, 'heatmap'],
    queryFn: () => meetingApi.getHeatmap(id).then((r) => r.data),
  })
}

export function useCreateMeeting() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMeetingRequest) => meetingApi.create(data).then((r) => r.data),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'my'] })
      router.push(`/meetings/${meeting.id}`)
    },
  })
}

export function useJoinMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => meetingApi.join(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', id] })
    },
  })
}

export function useSaveSchedules(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SchedulesRequest) => meetingApi.saveSchedules(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'heatmap'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
    },
  })
}

export function useConfirmDate(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ConfirmDateRequest) =>
      meetingApi.confirm(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
      router.push(`/meetings/${meetingId}`)
    },
  })
}
