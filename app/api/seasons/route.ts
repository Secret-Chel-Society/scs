import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentOnly = searchParams.get("current") === "true"

    let query = supabase.from("system_settings").select("value").eq("key", "seasons")

    if (currentOnly) {
      // Get current season
      const { data: currentSeasonData, error: currentSeasonError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (currentSeasonError) {
        throw currentSeasonError
      }

      return NextResponse.json({ currentSeason: currentSeasonData?.value || 1 })
    }

    const { data: seasonsData, error } = await query.single()

    if (error) {
      throw error
    }

    return NextResponse.json({ seasons: seasonsData?.value || [] })
  } catch (error: any) {
    console.error("Error fetching seasons:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
