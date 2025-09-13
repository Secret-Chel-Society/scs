import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a fresh Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🚀 SIMPLE WAIVER API CALLED')
  
  try {
    // Parse the request body
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { action, playerId, teamId } = body
    
    // Validate required fields
    if (!action) {
      console.log('❌ No action provided')
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }
    
    if (!playerId) {
      console.log('❌ No playerId provided')
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }
    
    if (!teamId) {
      console.log('❌ No teamId provided')
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }
    
    console.log('✅ All required fields present:', { action, playerId, teamId })
    
    if (action === 'waive') {
      return await handleSimpleWaive(playerId, teamId)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('💥 SIMPLE WAIVER API ERROR:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleSimpleWaive(playerId: string, teamId: string) {
  console.log('🔄 Starting simple waive process:', { playerId, teamId })
  
  try {
    // Step 1: Check if player exists
    console.log('🔍 Step 1: Checking if player exists...')
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, user_id, team_id, salary, role')
      .eq('id', playerId)
      .single()
    
    if (playerError) {
      console.error('❌ Player query failed:', playerError)
      return NextResponse.json({ 
        error: 'Player not found',
        details: playerError.message 
      }, { status: 404 })
    }
    
    if (!player) {
      console.log('❌ Player not found')
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    
    console.log('✅ Player found:', player)
    
    // Step 2: Check if player is on the correct team
    if (player.team_id !== teamId) {
      console.log('❌ Player not on team:', { playerTeamId: player.team_id, requestedTeamId: teamId })
      return NextResponse.json({ 
        error: 'Player is not on the specified team' 
      }, { status: 400 })
    }
    
    console.log('✅ Player is on correct team')
    
    // Step 3: Check if player is already on waivers
    console.log('🔍 Step 3: Checking for existing waivers...')
    const { data: existingWaiver, error: waiverCheckError } = await supabase
      .from('waivers')
      .select('id, status')
      .eq('player_id', playerId)
      .eq('status', 'active')
      .single()
    
    if (waiverCheckError && waiverCheckError.code !== 'PGRST116') {
      console.error('❌ Waiver check failed:', waiverCheckError)
      return NextResponse.json({ 
        error: 'Failed to check existing waivers',
        details: waiverCheckError.message 
      }, { status: 500 })
    }
    
    if (existingWaiver) {
      console.log('❌ Player already on waivers')
      return NextResponse.json({ 
        error: 'Player is already on waivers' 
      }, { status: 409 })
    }
    
    console.log('✅ No existing waivers found')
    
    // Step 4: Create waiver
    console.log('🔍 Step 4: Creating waiver...')
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
    
    // Step 5: Update player team_id to null
    console.log('🔍 Step 5: Updating player team...')
    const { error: updateError } = await supabase
      .from('players')
      .update({ team_id: null })
      .eq('id', playerId)
    
    if (updateError) {
      console.error('❌ Player update failed:', updateError)
      // Don't fail the whole operation, just log the error
      console.log('⚠️ Continuing despite player update failure')
    } else {
      console.log('✅ Player team updated to null')
    }
    
    console.log('🎉 SIMPLE WAIVE SUCCESS!')
    return NextResponse.json({
      success: true,
      message: 'Player placed on waivers successfully',
      waiver: waiver
    })
    
  } catch (error) {
    console.error('💥 SIMPLE WAIVE ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to waive player',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}