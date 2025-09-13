"use client"

import { toast } from "sonner"

export interface Waiver {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: 'active' | 'claimed' | 'cleared' | 'cancelled'
  winning_team_id?: string
  processed_at?: string
  created_at: string
  updated_at: string
  players?: {
    id: string
    user_id: string
    salary: number
    role: string
    users?: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
      avatar_url?: string
    }
  }
  waiving_team?: {
    id: string
    name: string
    logo_url?: string
  }
  winning_team?: {
    id: string
    name: string
    logo_url?: string
  }
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    status: 'pending' | 'approved' | 'rejected'
    claimed_at: string
    teams?: {
      id: string
      name: string
      logo_url?: string
    }
  }>
}

export interface WaiverResponse {
  success: boolean
  waivers?: Waiver[]
  count?: number
  message?: string
  error?: string
  details?: string
  waiver?: Waiver
  claim?: any
}

/**
 * Fetch all waivers with optional status filter
 */
export async function fetchWaivers(status: string = 'active'): Promise<WaiverResponse> {
  try {
    console.log(`🔍 Fetching waivers with status: ${status}`)
    
    const response = await fetch(`/api/waivers/v2?status=${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Fetch waivers error:', data)
      throw new Error(data.error || `Failed to fetch waivers: ${response.status}`)
    }

    console.log(`✅ Successfully fetched ${data.count || 0} waivers`)
    return data

  } catch (error) {
    console.error('❌ Fetch waivers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch waivers',
      waivers: []
    }
  }
}

/**
 * Place a player on waivers
 */
export async function waivePlayer(playerId: string, teamId: string): Promise<WaiverResponse> {
  try {
    console.log(`🔄 Waiving player ${playerId} from team ${teamId}`)
    
    const response = await fetch('/api/waivers/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'waive',
        playerId,
        teamId
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Waive player error:', data)
      throw new Error(data.error || `Failed to waive player: ${response.status}`)
    }

    console.log('✅ Player successfully waived')
    toast.success('Player placed on waivers successfully')
    return data

  } catch (error) {
    console.error('❌ Waive player error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to waive player'
    toast.error(errorMessage)
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Claim a player from waivers
 */
export async function claimPlayer(waiverId: string, teamId: string): Promise<WaiverResponse> {
  try {
    console.log(`🔄 Claiming waiver ${waiverId} for team ${teamId}`)
    
    const response = await fetch('/api/waivers/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'claim',
        waiverId,
        teamId
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Claim player error:', data)
      throw new Error(data.error || `Failed to claim player: ${response.status}`)
    }

    console.log('✅ Player successfully claimed')
    toast.success('Waiver claim submitted successfully')
    return data

  } catch (error) {
    console.error('❌ Claim player error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to claim player'
    toast.error(errorMessage)
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Cancel a waiver
 */
export async function cancelWaiver(waiverId: string, teamId: string): Promise<WaiverResponse> {
  try {
    console.log(`🔄 Cancelling waiver ${waiverId} for team ${teamId}`)
    
    const response = await fetch('/api/waivers/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        waiverId,
        teamId
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Cancel waiver error:', data)
      throw new Error(data.error || `Failed to cancel waiver: ${response.status}`)
    }

    console.log('✅ Waiver successfully cancelled')
    toast.success('Waiver cancelled successfully')
    return data

  } catch (error) {
    console.error('❌ Cancel waiver error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel waiver'
    toast.error(errorMessage)
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Process expired waivers (admin function)
 */
export async function processExpiredWaivers(): Promise<WaiverResponse> {
  try {
    console.log('🔄 Processing expired waivers')
    
    const response = await fetch('/api/waivers/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process_expired'
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Process expired waivers error:', data)
      throw new Error(data.error || `Failed to process expired waivers: ${response.status}`)
    }

    console.log('✅ Expired waivers processed successfully')
    return data

  } catch (error) {
    console.error('❌ Process expired waivers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process expired waivers'
    }
  }
}
