import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET() {
  try {
    console.log("[/api/players-signups] Fetching player signups...")

    // 1) Get current season (active or fallback to 9)
    let { data: currentSeason, error: seasonError } = await supabaseAdmin
      .from("seasons")
      .select("id, name, season_number")
      .eq("is_active", true)
      .order("season_number", { ascending: false })
      .maybeSingle()

    if (!currentSeason) {
      console.log("[/api/players-signups] No active season found, falling back to season 9")
      const { data: fallbackSeason, error: fallbackError } = await supabaseAdmin
        .from("seasons")
        .select("id, name, season_number")
        .eq("season_number", 9)
        .maybeSingle()

      currentSeason = fallbackSeason
      seasonError = fallbackError
    }

    if (seasonError || !currentSeason) {
      console.error("[/api/players-signups] Error fetching current season:", seasonError)
      return NextResponse.json({ error: "Current season not found" }, { status: 500 })
    }

    console.log(
      `[/api/players-signups] Using current season: ${currentSeason.name} (Number: ${currentSeason.season_number}, ID: ${currentSeason.id})`
    )

    // 2) Approved registrations for current season
    const { data: registrations, error } = await supabaseAdmin
      .from("season_registrations")
      .select(`
        id,
        user_id,
        gamer_tag,
        primary_position,
        secondary_position,
        console,
        status,
        season_id
      `)
      .eq("status", "Approved")
      .eq("season_id", currentSeason.id) // ✅ use season_id
      .order("gamer_tag")

    if (error) {
      console.error(
        `[/api/players-signups] Error fetching ${currentSeason.name} registrations:`,
        error
      )
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(
      `[/api/players-signups] Found ${registrations?.length || 0} approved ${currentSeason.name} registrations`
    )

    // 3) If none, log breakdown and in dev return all
    if (!registrations || registrations.length === 0) {
      const { data: allRegs, error: allError } = await supabaseAdmin
        .from("season_registrations")
        .select("status, count:count(*)")
        .eq("season_id", currentSeason.id) // ✅ use season_id
        .group("status")

      console.log(
        `[/api/players-signups] ${currentSeason.name} registration status breakdown:`,
        allRegs,
        allError
      )

      if (process.env.NODE_ENV === "development") {
        const { data: devRegs, error: devError } = await supabaseAdmin
          .from("season_registrations")
          .select(`
            id,
            user_id,
            gamer_tag,
            primary_position,
            secondary_position,
            console,
            status,
            season_id
          `)
          .eq("season_id", currentSeason.id) // ✅ use season_id
          .order("gamer_tag")

        if (!devError && devRegs) {
          console.log(
            `[/api/players-signups] Development mode: returning ${devRegs.length} total ${currentSeason.name} registrations`
          )
          return NextResponse.json({ players: devRegs })
        }
      }
    }

    return NextResponse.json({ players: registrations || [] })
  } catch (error: any) {
    console.error("[/api/players-signups] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
