import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log("Fetching player signups...")

    // First, get the active season
    const { data: activeSeason, error: seasonError } = await supabaseAdmin
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single()

    if (seasonError || !activeSeason) {
      console.error("Error fetching active season:", seasonError)
      return NextResponse.json({ error: "No active season found" }, { status: 500 })
    }

    console.log("Active season ID:", activeSeason.id)

    // Get approved registrations for the active season
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
      .eq("season_id", activeSeason.id)
      .eq("status", "Approved")
      .order("gamer_tag")

    if (error) {
      console.error("Error fetching registrations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter to only include active users
    const userIds = registrations?.map((reg) => reg.user_id) || []
    const { data: activeUsers, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("is_active", true)
      .in("id", userIds)

    if (userError) {
      console.error("Error fetching active users:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    const activeUserIds = new Set(activeUsers?.map((user) => user.id) || [])
    const activeRegistrations = registrations?.filter((reg) => activeUserIds.has(reg.user_id)) || []

    console.log(`Found ${activeRegistrations?.length || 0} approved registrations with active users`)

    // If no approved registrations, let's check what we have
    if (!activeRegistrations || activeRegistrations.length === 0) {
      const { data: allRegs, error: allError } = await supabaseAdmin
        .from("season_registrations")
        .select("status, count(*)")
        .eq("season_id", activeSeason.id)
        .group("status")

      console.log("Registration status breakdown:", allRegs, allError)

      // For development, also return pending registrations
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
          .eq("season_id", activeSeason.id)
          .order("gamer_tag")

        if (!devError && devRegs) {
          console.log(`Development mode: returning ${devRegs.length} total registrations`)
          return NextResponse.json({ players: devRegs })
        }
      }
    }

    return NextResponse.json({ players: activeRegistrations || [] })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
