import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS policies
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    console.log("=== WAIVERS API DEBUG START ===")
    console.log("Fetching recent waivers with limit:", limit)
    console.log("Using service role key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // First, let's see if we can access the waivers table at all
    console.log("Testing basic waivers table access...")
    const { data: testWaivers, error: testError, count: testCount } = await supabase
      .from("waivers")
      .select("*", { count: 'exact' })
      .limit(1)

    console.log("Test query result:")
    console.log("- Error:", testError)
    console.log("- Count:", testCount)
    console.log("- Data length:", testWaivers?.length)
    console.log("- Sample data:", testWaivers?.[0])

    if (testError) {
      console.error("Cannot access waivers table:", testError)
      return NextResponse.json({ 
        error: "Cannot access waivers table: " + testError.message,
        debug: {
          testError: testError,
          testCount: testCount,
          usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        waivers: []
      }, { status: 500 })
    }

    // Now get the actual waivers data
    console.log("Fetching full waivers data...")
    const { data: waivers, error, count } = await supabase
      .from("waivers")
      .select(`
        id,
        created_at,
        waived_at,
        claim_deadline,
        status,
        player:player_id(id, salary, role, user_id),
        waiving_team:waiving_team_id(id, name, logo_url),
        winning_team:winning_team_id(id, name, logo_url)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    console.log("Full query result:")
    console.log("- Error:", error)
    console.log("- Count:", count)
    console.log("- Data length:", waivers?.length)
    console.log("- Raw waivers data:", JSON.stringify(waivers?.slice(0, 2), null, 2))

    if (error) {
      console.error("Error fetching waivers:", error)
      return NextResponse.json({ 
        error: "Failed to fetch waivers: " + error.message,
        debug: {
          error: error,
          count: count,
          usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        waivers: []
      }, { status: 500 })
    }

    if (!waivers || waivers.length === 0) {
      console.log("No waivers found in database")
      return NextResponse.json({ 
        waivers: [],
        count: 0,
        debug: {
          totalCount: count,
          message: "No waivers found in database",
          usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      })
    }

    console.log(`Found ${waivers.length} waivers, enriching with related data...`)

    // Manually enrich each waiver with related data
    const enrichedWaivers = await Promise.all(
      waivers.map(async (waiver, index) => {
        console.log(`Processing waiver ${index + 1}/${waivers.length}:`, waiver.id)
        
        let playerData = null
        let waivingTeamData = null
        let winningTeamData = null

        // Get player data if player_id exists
        if (waiver.player) {
          console.log(`  - Fetching player data for ID: ${waiver.player.id}`)
          
          // Get user data and season registration for gamer tag and position
          let userData = null
          let registrationData = null

          if (waiver.player.user_id) {
            console.log(`  - Fetching user data for ID: ${waiver.player.user_id}`)
            
            // Try to get user data
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("id, gamer_tag_id")
              .eq("id", waiver.player.user_id)
              .single()

            console.log(`  - User query result:`, { user, userError })

            if (user && !userError) {
              userData = user
            }

            // Try to get season registration for position and gamer_tag
            const { data: registration, error: regError } = await supabase
              .from("season_registrations")
              .select("primary_position, secondary_position, gamer_tag")
              .eq("user_id", waiver.player.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            console.log(`  - Registration query result:`, { registration, regError })

            if (registration && !regError) {
              registrationData = registration
            }
          }

          playerData = {
            id: waiver.player.id,
            salary: waiver.player.salary,
            role: waiver.player.role,
            position: registrationData?.primary_position || null,
            first_name: null,
            last_name: null,
            users: {
              id: waiver.player.user_id,
              username: null,
              gamer_tag: registrationData?.gamer_tag || userData?.gamer_tag_id || null,
              gamer_tag_id: userData?.gamer_tag_id || null
            }
          }
          console.log(`  - Final player data:`, playerData)
        }

        // Get waiving team data if waiving_team_id exists
        if (waiver.waiving_team) {
          console.log(`  - Fetching waiving team data for ID: ${waiver.waiving_team.id}`)
          waivingTeamData = waiver.waiving_team
        }

        // Get winning team data if winning_team_id exists
        if (waiver.winning_team) {
          console.log(`  - Fetching winning team data for ID: ${waiver.winning_team.id}`)
          winningTeamData = waiver.winning_team
        }

        const enrichedWaiver = {
          ...waiver,
          players: playerData,
          waiving_team: waivingTeamData,
          winning_team: winningTeamData
        }

        console.log(`  - Final enriched waiver:`, JSON.stringify(enrichedWaiver, null, 2))
        return enrichedWaiver
      })
    )

    console.log(`Successfully enriched ${enrichedWaivers.length} waivers`)
    console.log("=== WAIVERS API DEBUG END ===")

    return NextResponse.json({ 
      waivers: enrichedWaivers,
      count: enrichedWaivers.length,
      debug: {
        totalInDatabase: count,
        returned: enrichedWaivers.length,
        limit: limit,
        usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error: any) {
    console.error("=== WAIVERS API ERROR ===")
    console.error("Error in waivers/recent GET:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ 
      error: error.message || "An error occurred",
      debug: {
        errorType: error.constructor.name,
        stack: error.stack,
        usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      waivers: []
    }, { status: 500 })
  }
}
