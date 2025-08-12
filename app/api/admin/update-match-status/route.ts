import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { matchId, status, overtime } = await request.json()

    if (!matchId || !status) {
      return NextResponse.json({ error: "Match ID and status are required" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = { status }

    // Only include overtime if it's provided
    if (overtime !== undefined) {
      updateData.overtime = overtime
    }

    // Update match status
    const { error: updateError } = await supabase.from("matches").update(updateData).eq("id", matchId)

    if (updateError) {
      return NextResponse.json({ error: `Error updating match: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Match status updated to ${status}` })
  } catch (error: any) {
    console.error("Error in update match status API:", error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
