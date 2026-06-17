export type MeetingStatus = 'OPEN' | 'CONFIRMED' | 'PLACE_VOTING' | 'SETTLING' | 'DONE' | 'CANCELLED'

export interface Participant {
  id: number
  nickname: string
  profileImageUrl?: string | null
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
  hasRevote: boolean
}

export interface CreateMeetingRequest {
  title: string
  description?: string
  dateRangeStart: string
  dateRangeEnd: string
}

export interface UpdateMeetingRequest {
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

export type RevoteStatus = 'OPEN' | 'CLOSED'

export interface RevoteVoter {
  id: number
  nickname: string
}

export interface RevoteCandidate {
  date: string
  count: number
  voters: RevoteVoter[]
}

export interface RevoteResponse {
  status: RevoteStatus
  candidates: RevoteCandidate[]
  votedCount: number
  totalCount: number
  myVotedDate: string | null
}

export interface CreateRevoteRequest {
  candidateDates: string[]
}

export interface VoteRevoteRequest {
  votedDate: string
}

export interface ConfirmRevoteRequest {
  confirmedDate: string
}

export interface PlaceProposer {
  id: number
  nickname: string
}

export interface PlaceVoter {
  id: number
  nickname: string
  profileImageUrl?: string | null
}

export interface Place {
  id: number
  name: string
  url?: string | null
  memo?: string | null
  voteCount: number
  myVoted: boolean
  proposer: PlaceProposer
  voters: PlaceVoter[]
}

export interface PlacesResponse {
  places: Place[]
  totalParticipants: number
}

export interface PlaceSuggestRequest {
  name: string
  url?: string
  memo?: string
}
