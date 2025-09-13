// Midnight Studios INTl - All rights reserved
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (teamsError) {
      return NextResponse.json({
        error: 'Failed to fetch teams',
        details: teamsError.message
      }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        error: 'No active teams found'
      }, { status: 404 })
    }

    // Clear existing priority
    const { error: clearError } = await supabase
      .from('waiver_priority')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (clearError) {
      return NextResponse.json({
        error: 'Failed to clear existing priority',
        details: clearError.message
      }, { status: 500 })
    }

    // Create new priority order
    const priorityData = teams.map((team, index) => ({
      team_id: team.id,
      priority: index + 1,
      last_used: null
    }))

    const { data: newPriority, error: insertError } = await supabase
      .from('waiver_priority')
      .insert(priorityData)
      .select()

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create new priority order',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Waiver priority reset for ${teams.length} teams`,
      priority: newPriority
    })

  } catch (error) {
    console.error('❌ Reset priority error:', error)
    return NextResponse.json({
      error: 'Failed to reset waiver priority',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
