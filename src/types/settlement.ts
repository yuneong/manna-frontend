export interface SettlementCreator {
  userId: number
  nickname: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface SettlementParticipant {
  userId: number
  nickname: string
  profileImage?: string
  amount: number
  isPaid: boolean
}

export interface SettlementItem {
  name: string
  amount: number
  participantUserIds: number[]
}

export interface Settlement {
  settlementId: number
  title: string
  type: 'TOTAL' | 'ITEMIZED'
  status: 'IN_PROGRESS' | 'COMPLETED'
  totalAmount?: number
  creator: SettlementCreator
  participants: SettlementParticipant[]
  items?: SettlementItem[]
}

export interface SettlementsResponse {
  settlements: Settlement[]
}

export interface CreateSettlementItemRequest {
  name: string
  amount: number
  participantUserIds: number[]
}

export interface CreateSettlementRequest {
  title: string
  type: 'TOTAL' | 'ITEMIZED'
  totalAmount?: number
  bankName: string
  accountNumber: string
  accountHolder: string
  participantUserIds?: number[]
  items?: CreateSettlementItemRequest[]
}
