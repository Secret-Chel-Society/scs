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

    // Get ALL registrations for the current season (not just approved)
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
      .order("gamer_tag")

    if (error) {
      console.error("Error fetching registrations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${registrations?.length || 0} total registrations`)

    // If no registrations, let's check what we have
    if (!registrations || registrations.length === 0) {
      const { data: allRegs, error: allError } = await supabaseAdmin
        .from("season_registrations")
        .select("status, count(*)")
        .group("status")

      console.log("Registration status breakdown:", allRegs, allError)
    }

    return NextResponse.json({ players: registrations || [] })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
