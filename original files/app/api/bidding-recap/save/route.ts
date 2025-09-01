import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createAdminClient()

    console.log("Attempting to save bidding recap data...")

    // First, ensure the system_settings table exists and has the right structure
    const { error: upsertError } = await supabase.from("system_settings").upsert(
      {
        key: "bidding_recap_data",
        value: data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (upsertError) {
      console.error("Error upserting bidding recap:", upsertError)

      // If upsert fails, try a simple insert
      const { error: insertError } = await supabase.from("system_settings").insert({
        key: "bidding_recap_data",
        value: data,
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting bidding recap:", insertError)
        return NextResponse.json(
          {
            error: "Failed to save recap data",
            details: insertError.message,
          },
          { status: 500 },
        )
      }
    }

    console.log("Successfully saved bidding recap data")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in save bidding recap:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
