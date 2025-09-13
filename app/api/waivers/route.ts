import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    
    const { data: waivers, error } = await supabase
      .from('waivers')
      .select(`
        id,
        player_id,
        waiving_team_id,
        waived_at,
        claim_deadline,
        status,
        winning_team_id,
        processed_at,
        created_at,
        updated_at,
        players (
          id,
          name,
          position,
          overall_rating,
          salary,
          team_id
        ),
        waiving_team:teams!waiving_team_id (
          id,
          name,
          logo_url
        ),
        winning_team:teams!winning_team_id (
          id,
          name,
          logo_url
        )
      `)
      .eq('status', status)
      .order('claim_deadline', { ascending: true })

    if (error) {
      console.error('❌ Waiver fetch error:', error)
      return NextResponse.json({
        error: 'Failed to fetch waivers',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      waivers: waivers || [],
      count: waivers?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Waivers API error:', error)
    return NextResponse.json({
      error: 'Waivers system error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, waiverId, teamId, playerId } = body

    if (!action) {
      return NextResponse.json({
        error: 'Action is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'claim':
        return await handleWaiverClaim(waiverId, teamId)
      case 'waive':
        return await handleWaivePlayer(playerId, teamId)
      case 'process_expired':
        return await processExpiredWaivers()
      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Waiver POST error:', error)
      return NextResponse.json({ 
      error: 'Failed to process waiver action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleWaiverClaim(waiverId: string, teamId: string) {
  try {
    // Check if waiver exists and is active
    const { data: waiver, error: waiverError } = await supabase
      .from('waivers')
      .select('*')
      .eq('id', waiverId)
      .eq('status', 'active')
      .single()

    if (waiverError || !waiver) {
      return NextResponse.json({
        error: 'Waiver not found or not active',
        details: waiverError?.message
      }, { status: 404 })
    }

    // Check if team already has a claim
    const { data: existingClaim } = await supabase
      .from('waiver_claims')
      .select('id')
      .eq('waiver_id', waiverId)
      .eq('claiming_team_id', teamId)
      .single()

    if (existingClaim) {
      return NextResponse.json({ 
        error: 'Team already has a claim on this waiver'
      }, { status: 409 })
    }

    // Get team's current waiver priority
    const { data: priority, error: priorityError } = await supabase
      .from('waiver_priority')
      .select('priority')
      .eq('team_id', teamId)
      .single()

    if (priorityError) {
      return NextResponse.json({
        error: 'Failed to get team priority',
        details: priorityError.message
      }, { status: 500 })
    }

    // Create waiver claim
    const { data: claim, error: claimError } = await supabase
      .from('waiver_claims')
      .insert({
        waiver_id: waiverId,
        claiming_team_id: teamId,
        priority_at_claim: priority.priority,
        status: 'pending'
      })
      .select()
      .single()

    if (claimError) {
      return NextResponse.json({
        error: 'Failed to create waiver claim',
        details: claimError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Waiver claim submitted successfully',
      claim
    })

  } catch (error) {
    console.error('❌ Claim handling error:', error)
    return NextResponse.json({
      error: 'Failed to process claim',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleWaivePlayer(playerId: string, teamId: string) {
  try {
    // Check if player exists and is on the team
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('team_id', teamId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ 
        error: 'Player not found or not on team',
        details: playerError?.message
      }, { status: 404 })
    }

    // Check if player is already on waivers
    const { data: existingWaiver } = await supabase
      .from('waivers')
      .select('id')
      .eq('player_id', playerId)
      .eq('status', 'active')
      .single()

    if (existingWaiver) {
      return NextResponse.json({ 
        error: 'Player is already on waivers'
      }, { status: 409 })
    }

    // Create waiver (48 hours from now)
    const claimDeadline = new Date()
    claimDeadline.setHours(claimDeadline.getHours() + 48)

    const { data: waiver, error: waiverError } = await supabase
      .from('waivers')
      .insert({
        player_id: playerId,
        waiving_team_id: teamId,
        claim_deadline: claimDeadline.toISOString(),
        status: 'active'
      })
      .select()
      .single()

    if (waiverError) {
      return NextResponse.json({ 
        error: 'Failed to create waiver',
        details: waiverError.message 
      }, { status: 500 })
    }

    // Remove player from team roster temporarily
    const { error: updateError } = await supabase
      .from('players')
      .update({ team_id: null })
      .eq('id', playerId)

    if (updateError) {
      console.error('❌ Failed to update player team:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Player placed on waivers successfully',
      waiver
    })

  } catch (error) {
    console.error('❌ Waive player error:', error)
    return NextResponse.json({ 
      error: 'Failed to waive player',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processExpiredWaivers() {
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

        // Update player's team
        await supabase
          .from('players')
          .update({ team_id: winningTeamId })
          .eq('id', waiver.player_id)

        // Update all claims for this waiver
        for (const claim of sortedClaims) {
          await supabase
            .from('waiver_claims')
            .update({
              status: claim.id === winningClaim.id ? 'approved' : 'rejected'
            })
            .eq('id', claim.id)
        }
      }

      // Update waiver status
      await supabase
        .from('waivers')
        .update({
          status: newStatus,
          winning_team_id: winningTeamId,
          processed_at: now
        })
        .eq('id', waiver.id)

      processedWaivers.push({
        waiverId: waiver.id,
        playerId: waiver.player_id,
        status: newStatus,
        winningTeamId
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedWaivers.length} expired waivers`,
      processedWaivers
    })

  } catch (error) {
    console.error('❌ Process expired waivers error:', error)
    return NextResponse.json({
      error: 'Failed to process expired waivers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}