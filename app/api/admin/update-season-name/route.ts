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

    // Get match ID from query params
    const url = new URL(request.url)
    const matchId = url.searchParams.get("matchId")

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("season_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    if (!match.season_id) {
      return NextResponse.json({ error: "Match has no season ID" }, { status: 400 })
    }

    // Get the season name
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("name")
      .eq("id", match.season_id)
      .single()

    if (seasonError) {
      // Try with string comparison
      const { data: seasonByString, error: seasonByStringError } = await supabase
        .from("seasons")
        .select("name")
        .filter("id::text", "eq", match.season_id.toString())
        .single()

      if (seasonByStringError) {
        // If all else fails, use a default name
        const seasonName = `Season ${match.season_id}`

        // Update the match with the default season name
        const { error: updateError } = await supabase
          .from("matches")
          .update({ season_name: seasonName })
          .eq("id", matchId)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `Updated with default name: ${seasonName}` })
      }

      // Update the match with the season name
      const { error: updateError } = await supabase
        .from("matches")
        .update({ season_name: seasonByString.name })
        .eq("id", matchId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `Updated with name: ${seasonByString.name}` })
    }

    // Update the match with the season name
    const { error: updateError } = await supabase.from("matches").update({ season_name: season.name }).eq("id", matchId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Updated with name: ${season.name}` })
  } catch (error: any) {
    console.error("Error updating season name:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
