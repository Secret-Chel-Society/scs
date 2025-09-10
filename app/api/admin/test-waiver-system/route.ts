import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Check if user is admin
    const cookieStore = cookies()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["Admin", "SuperAdmin"])

    if (!adminRoles || adminRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized - Admin privileges required" }, { status: 403 })
    }

    // Test 1: Check if waiver_priority table exists and has data
    const { data: priorityData, error: priorityError } = await supabase
      .from("waiver_priority")
      .select("id, team_id, priority")
      .limit(5)

    // Test 2: Check if waiver_claims table exists
    const { data: claimsData, error: claimsError } = await supabase
      .from("waiver_claims")
      .select("id, waiver_id, claiming_team_id, status")
      .limit(5)

    // Test 3: Check if waivers table exists and has active waivers
    const { data: waiversData, error: waiversError } = await supabase
      .from("waivers")
      .select("id, player_id, status, claim_deadline")
      .eq("status", "active")
      .limit(5)

    // Test 4: Check if teams table has active teams
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, is_active")
      .eq("is_active", true)
      .limit(5)

    // Test 5: Test the get_team_waiver_priority function
    let priorityFunctionTest = null
    if (teamsData && teamsData.length > 0) {
      const { data: functionTest, error: functionError } = await supabase
        .rpc("get_team_waiver_priority", { team_uuid: teamsData[0].id })
      
      priorityFunctionTest = {
        team_id: teamsData[0].id,
        priority: functionTest,
        error: functionError
      }
    }

    const results = {
      success: true,
      tests: {
        waiver_priority_table: {
          exists: !priorityError,
          record_count: priorityData?.length || 0,
          sample_data: priorityData,
          error: priorityError?.message
        },
        waiver_claims_table: {
          exists: !claimsError,
          record_count: claimsData?.length || 0,
          sample_data: claimsData,
          error: claimsError?.message
        },
        waivers_table: {
          exists: !waiversError,
          active_waivers: waiversData?.length || 0,
          sample_data: waiversData,
          error: waiversError?.message
        },
        teams_table: {
          exists: !teamsError,
          active_teams: teamsData?.length || 0,
          sample_data: teamsData,
          error: teamsError?.message
        },
        priority_function: priorityFunctionTest
      },
      summary: {
        all_tables_exist: !priorityError && !claimsError && !waiversError && !teamsError,
        has_priority_data: (priorityData?.length || 0) > 0,
        has_active_teams: (teamsData?.length || 0) > 0,
        has_active_waivers: (waiversData?.length || 0) > 0
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error("Error testing waiver system:", error)
    return NextResponse.json({ 
      error: "Test failed", 
      details: error.message 
    }, { status: 500 })
  }
}
