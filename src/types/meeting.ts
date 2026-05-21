export type MeetingStatus = 'OPEN' | 'CONFIRMED' | 'CANCELLED'

export interface Participant {
  id: number
  nickname: string
}

export interface Meeting {
  id: number
  hostId: number
  title: string
  description: string | null
  location?: string | null
  dateRangeStart: string
  dateRangeEnd: string
  confirmedDate: string | null
  status: MeetingStatus
  participantCount: number
  responseCount: number
  isParticipant?: boolean
  participants: Participant[]
  createdAt: string
}

export interface CreateMeetingRequest {
  title: string
  description?: string
  dateRangeStart: string
  dateRangeEnd: string
}

export interface SchedulesRequest {
  scheduledDates: string[]
}

export interface HeatmapEntry {
  count: number
  availableParticipantIds: number[]
}

export interface HeatmapResponse {
  meetingId: number
  heatmap: Record<string, HeatmapEntry>
}

export interface MySchedulesResponse {
  meetingId: number
  scheduledDates: string[]
}

export interface ConfirmDateRequest {
  confirmedDate: string
}
