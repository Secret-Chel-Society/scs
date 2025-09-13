// Midnight Studios INTl - All rights reserved
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const now = new Date().toISOString()
    
    // Get expired waivers
    const { data: expiredWaivers, error: expiredError } = await supabase
      .from('waivers')
      .select(`
        *,
        waiver_claims (
          *,
          claiming_team:teams (*)
        )
      `)
      .eq('status', 'active')
      .lt('claim_deadline', now)

    if (expiredError) {
      return NextResponse.json({
        error: 'Failed to fetch expired waivers',
        details: expiredError.message
      }, { status: 500 })
    }

    const processedWaivers = []

    for (const waiver of expiredWaivers || []) {
      // Sort claims by priority (lower number = higher priority)
      const sortedClaims = waiver.waiver_claims
        .filter((claim: any) => claim.status === 'pending')
        .sort((a: any, b: any) => a.priority_at_claim - b.priority_at_claim)

      let newStatus = 'cleared'
      let winningTeamId = null

      if (sortedClaims.length > 0) {
        // Award to highest priority team
        const winningClaim = sortedClaims[0]
        newStatus = 'claimed'
        winningTeamId = winningClaim.claiming_team_id

        // Update player's team and status
        const { error: playerError } = await supabase
          .from('players')
          .update({ 
            team_id: winningTeamId,
            status: 'active'
          })
          .eq('id', waiver.player_id)

        if (playerError) {
          console.error('❌ Failed to update player team:', playerError)
        }

        // Update all claims for this waiver
        for (const claim of sortedClaims) {
          await supabase
            .from('waiver_claims')
            .update({
              status: claim.id === winningClaim.id ? 'approved' : 'rejected'
            })
            .eq('id', claim.id)
        }

        // Update waiver priority - move winning team to bottom
        await updateWaiverPriority(winningClaim.claiming_team_id)
      } else {
        // No claims, player becomes free agent
        const { error: playerError } = await supabase
          .from('players')
          .update({ status: 'free_agent' })
          .eq('id', waiver.player_id)

        if (playerError) {
          console.error('❌ Failed to update player status:', playerError)
        }
      }

      // Update waiver status
      const { error: waiverError } = await supabase
        .from('waivers')
        .update({
          status: newStatus,
          winning_team_id: winningTeamId,
          processed_at: now
        })
        .eq('id', waiver.id)

      if (waiverError) {
        console.error('❌ Failed to update waiver status:', waiverError)
      }

      processedWaivers.push({
        waiverId: waiver.id,
        playerId: waiver.player_id,
        playerName: waiver.players?.users?.gamer_tag_id || 'Unknown',
        status: newStatus,
        winningTeamId,
        winningTeamName: winningTeamId ? 
          sortedClaims.find((c: any) => c.claiming_team_id === winningTeamId)?.claiming_team?.name : 
          null,
        claimsCount: sortedClaims.length
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedWaivers.length} expired waivers`,
      processedWaivers,
      timestamp: now
    })

  } catch (error) {
    console.error('❌ Process waivers error:', error)
    return NextResponse.json({
      error: 'Failed to process waivers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function updateWaiverPriority(winningTeamId: string) {
  try {
    // Get current priority of winning team
    const { data: currentPriority, error: priorityError } = await supabase
      .from('waiver_priority')
      .select('priority')
      .eq('team_id', winningTeamId)
      .single()

    if (priorityError || !currentPriority) {
      console.error('❌ Failed to get current priority:', priorityError)
      return
    }

    // Get highest priority number
    const { data: maxPriority, error: maxError } = await supabase
      .from('waiver_priority')
      .select('priority')
      .order('priority', { ascending: false })
      .limit(1)
      .single()

    if (maxError || !maxPriority) {
      console.error('❌ Failed to get max priority:', maxError)
      return
    }

    // Move teams with higher priority (lower numbers) up by 1
    const { error: updateError } = await supabase
      .from('waiver_priority')
      .update({ priority: supabase.raw('priority - 1') })
      .lt('priority', currentPriority.priority)

    if (updateError) {
      console.error('❌ Failed to update other priorities:', updateError)
    }

    // Move winning team to bottom
    const { error: moveError } = await supabase
      .from('waiver_priority')
      .update({ 
        priority: maxPriority.priority,
        last_used: new Date().toISOString()
      })
      .eq('team_id', winningTeamId)

    if (moveError) {
      console.error('❌ Failed to move winning team to bottom:', moveError)
    }

  } catch (error) {
    console.error('❌ Update waiver priority error:', error)
  }
}
