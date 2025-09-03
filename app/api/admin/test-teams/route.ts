import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Simple test: try to fetch teams
    const { data: teams, error } = await supabase.from("teams").select("*").limit(5)
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      })
    }

    return NextResponse.json({
      success: true,
      teamsCount: teams?.length || 0,
      teams: teams,
      message: "Teams fetched successfully"
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      type: "exception"
    })
  }
}
