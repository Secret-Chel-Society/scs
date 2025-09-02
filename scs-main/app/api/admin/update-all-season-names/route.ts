import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)

    const isAdmin = userRoles?.some((role) => role.role === "admin" || role.role === "Admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all seasons
    const { data: seasons, error: seasonsError } = await supabase.from("seasons").select("id, name")

    if (seasonsError) {
      return NextResponse.json({ error: seasonsError.message }, { status: 500 })
    }

    // Create a map of season IDs to names
    const seasonMap = new Map<string, string>()
    seasons?.forEach((season) => {
      seasonMap.set(season.id.toString(), season.name)
    })

    // Get all matches
    const { data: matches, error: matchesError } = await supabase.from("matches").select("id, season_id")

    if (matchesError) {
      return NextResponse.json({ error: matchesError.message }, { status: 500 })
    }

    // Update each match with its season name
    let updatedCount = 0
    let errorCount = 0

    for (const match of matches || []) {
      if (match.season_id) {
        const seasonName = seasonMap.get(match.season_id.toString()) || `Season ${match.season_id}`

        const { error: updateError } = await supabase
          .from("matches")
          .update({ season_name: seasonName })
          .eq("id", match.id)

        if (updateError) {
          console.error(`Error updating match ${match.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      }
    }

    // Set default season name for any remaining matches
    const { data: defaultUpdated, error: defaultError } = await supabase
      .from("matches")
      .update({ season_name: "Season 1" })
      .is("season_name", null)

    if (defaultError) {
      console.error("Error setting default season names:", defaultError)
    } else {
      updatedCount += defaultUpdated?.length || 0
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} matches with season names. ${errorCount} errors.`,
    })
  } catch (error: any) {
    console.error("Error updating season names:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
