import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import type { Ref } from 'vue'
import { meetingApi } from '../api/meeting'
import type {
  CreateMeetingRequest,
  UpdateMeetingRequest,
  SchedulesRequest,
  ConfirmDateRequest,
  CreateRevoteRequest,
  VoteRevoteRequest,
  ConfirmRevoteRequest,
  PlacesResponse,
  PlaceSuggestRequest,
} from '../types/meeting'

export function useMyMeetings(enabled: Ref<boolean> | boolean = true) {
  return useQuery({
    queryKey: ['meetings', 'my'],
    queryFn: () => meetingApi.getMy().then((r) => r.data),
    enabled,
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

export function useUpdateMeeting(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMeetingRequest) =>
      meetingApi.update(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'my'] })
      router.push(`/meetings/${meetingId}`)
    },
  })
}

export function useDeleteMeeting(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => meetingApi.deleteMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'my'] })
      router.push('/')
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

 export function useCancelRevote(meetingId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => meetingApi.cancelRevote(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'revote'] })
      router.push(`/meetings/${meetingId}`)
    },
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

export function usePlaces(meetingId: number) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'places'],
    queryFn: () => meetingApi.getPlaces(meetingId).then((r) => r.data),
    retry: false,
  })
}

export function useSuggestPlace(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceSuggestRequest) =>
      meetingApi.suggestPlace(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'places'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
    },
  })
}

export function useCloseMeeting(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => meetingApi.closeMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'my'] })
    },
  })
}

export function useVotePlace(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (placeId: number) => meetingApi.votePlace(meetingId, placeId),
    onMutate: async (placeId: number) => {
      await queryClient.cancelQueries({ queryKey: ['meetings', meetingId, 'places'] })
      const prev = queryClient.getQueryData<PlacesResponse>(['meetings', meetingId, 'places'])
      queryClient.setQueryData<PlacesResponse>(['meetings', meetingId, 'places'], (old) => {
        if (!old) return old
        return {
          ...old,
          places: old.places.map((p) =>
            p.id === placeId ? { ...p, myVoted: !p.myVoted } : p,
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _placeId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['meetings', meetingId, 'places'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'places'] })
    },
  })
}
