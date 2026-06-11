import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { meetingApi } from '../api/meeting'
import type { CreateSettlementRequest } from '../types/settlement'

export function useSettlements(meetingId: number) {
  return useQuery({
    queryKey: ['settlements', meetingId],
    queryFn: () => meetingApi.getSettlements(meetingId).then((r) => r.data),
    retry: false,
  })
}

export function useCreateSettlement(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSettlementRequest) =>
      meetingApi.createSettlement(meetingId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', meetingId] })
    },
  })
}

export function usePaySettlement(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settlementId: number) => meetingApi.paySettlement(meetingId, settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', meetingId] })
    },
  })
}

export function useCompleteSettlement(meetingId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settlementId: number) =>
      meetingApi.completeSettlement(meetingId, settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', meetingId] })
    },
  })
}
