import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Management endpoint accessed')
    
    // Check waiver system status
    const { data: waivers, error: waiversError } = await supabase
      .from('waivers')
      .select(`
        *,
        players(*),
        waiving_team:teams!waiving_team_id(*),
        winning_team:teams!winning_team_id(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (waiversError) {
      console.error('❌ Waiver fetch error:', waiversError)
      return NextResponse.json({
        error: 'Failed to fetch waivers',
        details: waiversError.message,
        code: waiversError.code
      }, { status: 500 })
    }

    // Check waiver claims
    const { data: claims, error: claimsError } = await supabase
      .from('waiver_claims')
      .select(`
        *,
        waiver:waivers(*),
        claiming_team:teams(*)
      `)
      .eq('status', 'pending')

    if (claimsError) {
      console.error('❌ Claims fetch error:', claimsError)
    }

    // Check waiver priorities
    const { data: priorities, error: prioritiesError } = await supabase
      .from('waiver_priority')
      .select(`
        *,
        team:teams(*)
      `)
      .order('priority', { ascending: true })

    if (prioritiesError) {
      console.error('❌ Priorities fetch error:', prioritiesError)
    }

    return NextResponse.json({
      success: true,
      management: {
        waiversCount: waivers?.length || 0,
        pendingClaims: claims?.length || 0,
        priorityTeams: priorities?.length || 0,
        waivers: waivers || [],
        claims: claims || [],
        priorities: priorities || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Management API error:', error)
    
    return NextResponse.json({
      error: 'Management system error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
