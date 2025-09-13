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
    
    console.log(`🔍 Fetching waivers with status: ${status}`)
    
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
          user_id,
          salary,
          role,
          users (
            id,
            gamer_tag_id,
            primary_position,
            secondary_position,
            console,
            avatar_url
          )
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
        ),
        waiver_claims (
          id,
          claiming_team_id,
          priority_at_claim,
          status,
          claimed_at,
          teams:claiming_team_id (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('status', status)
      .order('claim_deadline', { ascending: true })

    if (error) {
      console.error('❌ Error fetching waivers:', error)
      return NextResponse.json({
        error: 'Failed to fetch waivers',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully fetched ${waivers?.length || 0} waivers`)
    
    return NextResponse.json({
      success: true,
      waivers: waivers || [],
      count: waivers?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Waivers GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Waiver API POST request:', body)
    
    const { action, playerId, teamId, waiverId } = body

    if (!action) {
      return NextResponse.json({
        error: 'Action is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'waive':
        return await waivePlayer(playerId, teamId)
      case 'claim':
        return await claimPlayer(waiverId, teamId)
      case 'cancel':
        return await cancelWaiver(waiverId, teamId)
      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Waiver POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function waivePlayer(playerId: string, teamId: string) {
  console.log(`🔄 Waiving player ${playerId} from team ${teamId}`)
  
  try {
    // Step 1: Validate player exists and is on team
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, user_id, team_id, salary, role, status')
      .eq('id', playerId)
      .eq('team_id', teamId)
      .single()

    if (playerError || !player) {
      console.error('❌ Player validation failed:', playerError)
      return NextResponse.json({
        error: 'Player not found or not on team',
        details: playerError?.message
      }, { status: 404 })
    }

    if (player.status === 'waived') {
      return NextResponse.json({
        error: 'Player is already on waivers'
      }, { status: 409 })
    }

    console.log('✅ Player validation passed:', player)

    // Step 2: Check for existing active waivers
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

    // Step 3: Create waiver (48 hours from now)
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
      console.error('❌ Waiver creation failed:', waiverError)
      return NextResponse.json({
        error: 'Failed to create waiver',
        details: waiverError.message
      }, { status: 500 })
    }

    console.log('✅ Waiver created:', waiver)

    // Step 4: Update player status
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        team_id: null,
        status: 'waived'
      })
      .eq('id', playerId)

    if (updateError) {
      console.error('❌ Player update failed:', updateError)
      // Don't fail the whole operation
    } else {
      console.log('✅ Player status updated')
    }

    // Step 5: Create notification
    const { data: teamData } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single()

    const { data: playerData } = await supabase
      .from('players')
      .select(`
        users (
          gamer_tag_id
        )
      `)
      .eq('id', playerId)
      .single()

    if (teamData && playerData) {
      // Notify all team managers
      const { data: managers } = await supabase
        .from('players')
        .select('user_id')
        .eq('team_id', teamId)
        .in('role', ['GM', 'AGM', 'Owner'])

      if (managers && managers.length > 0) {
        const notifications = managers.map(manager => ({
          user_id: manager.user_id,
          title: `Player Waived`,
          message: `${teamData.name} has waived ${playerData.users?.gamer_tag_id || 'a player'}. The player is now available for claims.`,
          link: '/management?tab=waivers',
          read: false
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
      }
    }

    console.log('🎉 Player successfully waived!')
    return NextResponse.json({
      success: true,
      message: 'Player placed on waivers successfully',
      waiver: waiver
    })

  } catch (error) {
    console.error('❌ Waive player error:', error)
    return NextResponse.json({
      error: 'Failed to waive player',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function claimPlayer(waiverId: string, teamId: string) {
  console.log(`🔄 Claiming waiver ${waiverId} for team ${teamId}`)
  
  try {
    // Step 1: Validate waiver exists and is active
    const { data: waiver, error: waiverError } = await supabase
      .from('waivers')
      .select('id, player_id, waiving_team_id, claim_deadline, status')
      .eq('id', waiverId)
      .eq('status', 'active')
      .single()

    if (waiverError || !waiver) {
      return NextResponse.json({
        error: 'Waiver not found or not active'
      }, { status: 404 })
    }

    // Step 2: Check if deadline has passed
    const deadline = new Date(waiver.claim_deadline)
    if (new Date() > deadline) {
      return NextResponse.json({
        error: 'Waiver claim deadline has passed'
      }, { status: 400 })
    }

    // Step 3: Check if team is trying to claim their own waived player
    if (waiver.waiving_team_id === teamId) {
      return NextResponse.json({
        error: 'Cannot claim your own waived player'
      }, { status: 400 })
    }

    // Step 4: Check if team already has a claim
    const { data: existingClaim } = await supabase
      .from('waiver_claims')
      .select('id')
      .eq('waiver_id', waiverId)
      .eq('claiming_team_id', teamId)
      .eq('status', 'pending')
      .single()

    if (existingClaim) {
      return NextResponse.json({
        error: 'Team has already claimed this waiver'
      }, { status: 409 })
    }

    // Step 5: Get team's waiver priority
    const { data: priorityData } = await supabase
      .from('waiver_priority')
      .select('priority')
      .eq('team_id', teamId)
      .single()

    let priority = 999 // Default low priority
    if (priorityData) {
      priority = priorityData.priority
    } else {
      // Create priority entry
      const { data: maxPriority } = await supabase
        .from('waiver_priority')
        .select('priority')
        .order('priority', { ascending: false })
        .limit(1)
        .single()

      priority = (maxPriority?.priority || 0) + 1

      await supabase
        .from('waiver_priority')
        .insert({
          team_id: teamId,
          priority: priority
        })
    }

    // Step 6: Create waiver claim
    const { data: claim, error: claimError } = await supabase
      .from('waiver_claims')
      .insert({
        waiver_id: waiverId,
        claiming_team_id: teamId,
        priority_at_claim: priority,
        status: 'pending'
      })
      .select()
      .single()

    if (claimError) {
      console.error('❌ Claim creation failed:', claimError)
      return NextResponse.json({
        error: 'Failed to create waiver claim',
        details: claimError.message
      }, { status: 500 })
    }

    console.log('✅ Waiver claim created:', claim)

    // Step 7: Create notification
    const { data: teamData } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single()

    if (teamData) {
      // Notify waiving team
      const { data: waivingTeamManagers } = await supabase
        .from('players')
        .select('user_id')
        .eq('team_id', waiver.waiving_team_id)
        .in('role', ['GM', 'AGM', 'Owner'])

      if (waivingTeamManagers && waivingTeamManagers.length > 0) {
        const notifications = waivingTeamManagers.map(manager => ({
          user_id: manager.user_id,
          title: `Waiver Claimed`,
          message: `${teamData.name} has claimed your waived player.`,
          link: '/management?tab=waivers',
          read: false
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
      }
    }

    console.log('🎉 Waiver claim successful!')
    return NextResponse.json({
      success: true,
      message: 'Waiver claim submitted successfully',
      claim: claim
    })

  } catch (error) {
    console.error('❌ Claim player error:', error)
    return NextResponse.json({
      error: 'Failed to claim player',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function cancelWaiver(waiverId: string, teamId: string) {
  console.log(`🔄 Cancelling waiver ${waiverId} for team ${teamId}`)
  
  try {
    // Step 1: Validate waiver exists and belongs to team
    const { data: waiver, error: waiverError } = await supabase
      .from('waivers')
      .select('id, player_id, waiving_team_id, status')
      .eq('id', waiverId)
      .eq('waiving_team_id', teamId)
      .eq('status', 'active')
      .single()

    if (waiverError || !waiver) {
      return NextResponse.json({
        error: 'Waiver not found or not authorized to cancel'
      }, { status: 404 })
    }

    // Step 2: Update waiver status to cancelled
    const { error: updateError } = await supabase
      .from('waivers')
      .update({ status: 'cancelled' })
      .eq('id', waiverId)

    if (updateError) {
      console.error('❌ Waiver cancellation failed:', updateError)
      return NextResponse.json({
        error: 'Failed to cancel waiver',
        details: updateError.message
      }, { status: 500 })
    }

    // Step 3: Return player to team
    const { error: playerUpdateError } = await supabase
      .from('players')
      .update({ 
        team_id: teamId,
        status: 'active'
      })
      .eq('id', waiver.player_id)

    if (playerUpdateError) {
      console.error('❌ Player return failed:', playerUpdateError)
      // Don't fail the whole operation
    }

    // Step 4: Cancel all pending claims
    await supabase
      .from('waiver_claims')
      .update({ status: 'rejected' })
      .eq('waiver_id', waiverId)
      .eq('status', 'pending')

    console.log('🎉 Waiver cancelled successfully!')
    return NextResponse.json({
      success: true,
      message: 'Waiver cancelled successfully'
    })

  } catch (error) {
    console.error('❌ Cancel waiver error:', error)
    return NextResponse.json({
      error: 'Failed to cancel waiver',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
