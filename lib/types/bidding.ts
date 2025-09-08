import { Database } from "@/lib/supabase/database.types"

export type PlayerBidding = Database['public']['Tables']['player_bidding']['Row']
export type PlayerBiddingInsert = Database['public']['Tables']['player_bidding']['Insert']
export type PlayerBiddingUpdate = Database['public']['Tables']['player_bidding']['Update']

export interface ProcessBidWinnerParams {
  winnerId: string
  winningAmount: number
  userId: string
  bidId: string
  playerId: string
}

export interface ProcessBidWinnerResult {
  success: boolean
  message: string
  playerName?: string
  teamName?: string
  amount?: number
  error?: string
}

export interface ExtendBidParams {
  bidId: string
  hoursToAdd: number
}

export interface CancelBidParams {
  bidId: string
}

export interface BidTransactionResult {
  success: boolean
  message: string
  error?: string
  sqlstate?: string
}
