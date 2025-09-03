import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Check if teams table exists and get its structure
    const { data: teams, error: teamsError } = await supabase.from("teams").select("*").limit(5)
    
    if (teamsError) {
      return NextResponse.json({ 
        error: teamsError.message,
        code: teamsError.code,
        details: teamsError.details,
        hint: teamsError.hint
      }, { status: 500 })
    }

    // Get table info
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from("teams")
      .select("*")
      .limit(0)

    // Check for specific columns
    const { data: seasonCheck, error: seasonCheckError } = await supabase
      .from("teams")
      .select("season_id")
      .limit(1)

    const { data: nameCheck, error: nameCheckError } = await supabase
      .from("teams")
      .select("name")
      .limit(1)

    return NextResponse.json({
      teamsCount: teams?.length || 0,
      sampleTeams: teams,
      hasSeasonId: !seasonCheckError,
      hasName: !nameCheckError,
      tableStructure: tableInfoError ? "Error getting structure" : "Table exists",
      seasonCheckError: seasonCheckError?.message,
      nameCheckError: nameCheckError?.message
    })
  } catch (error: any) {
    console.error("Error debugging teams table:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
