export type MeetingStatus = 'OPEN' | 'CONFIRMED' | 'CANCELLED'

export interface Meeting {
  id: number
  hostId: number
  title: string
  description: string | null
  dateRangeStart: string
  dateRangeEnd: string
  confirmedDate: string | null
  status: MeetingStatus
  createdAt: string
}

export interface CreateMeetingRequest {
  title: string
  description?: string
  dateRangeStart: string
  dateRangeEnd: string
}

export interface AvailabilityRequest {
  availableDates: string[]
}

export interface HeatmapResponse {
  meetingId: number
  heatmap: Record<string, number>
}

export interface ConfirmDateRequest {
  confirmedDate: string
}
