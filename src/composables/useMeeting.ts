import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import type { Ref } from 'vue'
import { meetingApi } from '../api/meeting'
import type {
  CreateMeetingRequest,
  SchedulesRequest,
  ConfirmDateRequest,
  CreateRevoteRequest,
  VoteRevoteRequest,
  ConfirmRevoteRequest,
} from '../types/meeting'

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

export function useCancelConfirm(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => meetingApi.cancelConfirm(meetingId),
    onSuccess: () => {
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

export function useRevote(
  meetingId: number,
  refetchInterval: number | false = false,
  enabled: Ref<boolean> | boolean = true,
) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'revote'],
    queryFn: async () => {
      try {
        const r = await meetingApi.getRevote(meetingId)
        return r.data
      } catch (e: any) {
        if (e.response?.status === 404) return null
        throw e
      }
    },
    retry: false,
    refetchInterval,
    enabled,
  })
}

export function useCreateRevote(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRevoteRequest) =>
      meetingApi.createRevote(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'revote'] })
      router.push(`/meetings/${meetingId}/revote`)
    },
  })
}

export function useVoteRevote(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VoteRevoteRequest) =>
      meetingApi.voteRevote(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'revote'] })
    },
  })
}

export function useConfirmRevote(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ConfirmRevoteRequest) =>
      meetingApi.confirmRevote(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'revote'] })
      router.push(`/meetings/${meetingId}`)
    },
  })
}
