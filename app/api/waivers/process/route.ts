import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing expired waivers...')
    
    const now = new Date()
    
    // Get all expired waivers that haven't been processed
    const { data: expiredWaivers, error: waiversError } = await supabase
      .from('waivers')
      .select(`
        *,
        players!inner (
          id,
          user_id,
          salary,
          users (
            id,
            gamer_tag_id
          )
        ),
        waiver_claims (
          id,
          claiming_team_id,
          priority_at_claim,
          status,
          teams:claiming_team_id (
            id,
            name
          )
        )
      `)
      .lt('claim_deadline', now.toISOString())
      .eq('status', 'active')

    if (waiversError) {
      console.error('❌ Error fetching expired waivers:', waiversError)
      throw waiversError
    }

    console.log(`Found ${expiredWaivers?.length || 0} expired waivers`)

    if (!expiredWaivers || expiredWaivers.length === 0) {
      return NextResponse.json({
        message: 'No expired waivers to process',
        processedCount: 0,
      })
    }

    let processedCount = 0
    let assignedCount = 0
    let clearedCount = 0

    for (const waiver of expiredWaivers) {
      try {
        console.log(`Processing waiver ${waiver.id} for player ${waiver.players?.users?.gamer_tag_id}`)
        
        // Sort claims by priority (lower number = higher priority)
        const sortedClaims = waiver.waiver_claims
          .filter(claim => claim.status === 'pending')
          .sort((a, b) => a.priority_at_claim - b.priority_at_claim)

        let newStatus = 'cleared'
        let winningTeamId = null

        if (sortedClaims.length > 0) {
          // Award to highest priority team
          const winningClaim = sortedClaims[0]
          newStatus = 'claimed'
          winningTeamId = winningClaim.claiming_team_id

          console.log(`Awarding player to team ${winningClaim.teams?.name} (priority: ${winningClaim.priority_at_claim})`)

          // Update player's team
          const { error: playerUpdateError } = await supabase
            .from('players')
            .update({ 
              team_id: winningTeamId,
              status: 'active'
            })
            .eq('id', waiver.player_id)

          if (playerUpdateError) {
            console.error(`❌ Failed to update player team:`, playerUpdateError)
          } else {
            console.log(`✅ Player assigned to team ${winningClaim.teams?.name}`)
            assignedCount++
          }

          // Update all claims for this waiver
          for (const claim of sortedClaims) {
            const claimStatus = claim.id === winningClaim.id ? 'approved' : 'rejected'
            
            const { error: claimUpdateError } = await supabase
              .from('waiver_claims')
              .update({ status: claimStatus })
              .eq('id', claim.id)

            if (claimUpdateError) {
              console.error(`❌ Failed to update claim ${claim.id}:`, claimUpdateError)
            }
          }

          // Create notification for winning team
          const { data: winningTeam } = await supabase
            .from('teams')
            .select('name')
            .eq('id', winningTeamId)
            .single()

          if (winningTeam) {
            const { data: teamManagers } = await supabase
              .from('players')
              .select('user_id')
              .eq('team_id', winningTeamId)
              .in('role', ['GM', 'AGM', 'Owner'])

            if (teamManagers && teamManagers.length > 0) {
              const notifications = teamManagers.map(manager => ({
                user_id: manager.user_id,
                title: 'Waiver Claim Successful',
                message: `You successfully claimed ${waiver.players?.users?.gamer_tag_id} from waivers!`,
                link: '/management?tab=waivers',
                read: false
              }))

              await supabase
                .from('notifications')
                .insert(notifications)
            }
          }
        } else {
          console.log(`No claims for waiver ${waiver.id}, clearing player`)
          clearedCount++
        }

        // Update waiver status
        const { error: waiverUpdateError } = await supabase
          .from('waivers')
          .update({
            status: newStatus,
            winning_team_id: winningTeamId,
            processed_at: now.toISOString()
          })
          .eq('id', waiver.id)

        if (waiverUpdateError) {
          console.error(`❌ Failed to update waiver ${waiver.id}:`, waiverUpdateError)
        } else {
          console.log(`✅ Waiver ${waiver.id} updated to ${newStatus}`)
          processedCount++
        }

      } catch (waiverError) {
        console.error(`❌ Error processing waiver ${waiver.id}:`, waiverError)
        // Continue with other waivers
      }
    }

    console.log(`🎉 Waiver processing complete: ${processedCount} processed, ${assignedCount} assigned, ${clearedCount} cleared`)

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} expired waivers`,
      processedCount,
      assignedCount,
      clearedCount,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('❌ Process expired waivers error:', error)
    return NextResponse.json({
      error: 'Failed to process expired waivers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}