import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, recap_data } = body

    console.log("💾 [Save] Saving daily recap:", {
      date,
      teamCount: recap_data?.team_recaps?.length || 0,
      totalMatches: recap_data?.total_matches || 0,
      timeWindow: recap_data?.time_window_hours || "unknown",
    })

    if (!date || !recap_data) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: date and recap_data",
        },
        { status: 400 },
      )
    }

    // Validate recap data structure
    if (!recap_data.team_recaps || !Array.isArray(recap_data.team_recaps)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recap data: team_recaps must be an array",
        },
        { status: 400 },
      )
    }

    // Ensure time window is set
    if (!recap_data.time_window_hours) {
      console.warn("⚠️ [Save] Setting default time window to 24 hours")
      recap_data.time_window_hours = 24
    }

    // First, delete any existing recap for today to ensure we only have one current recap
    console.log("🗑️ [Save] Clearing any existing recaps for today...")
    const { error: deleteError } = await supabase.from("daily_recaps").delete().eq("date", date)

    if (deleteError) {
      console.warn("⚠️ [Save] Warning: Could not delete existing recap:", deleteError.message)
      // Continue anyway - this isn't critical
    } else {
      console.log("✅ [Save] Cleared existing recaps for", date)
    }

    // Insert the new recap
    console.log("💾 [Save] Inserting new recap...")
    const { data: insertData, error: insertError } = await supabase
      .from("daily_recaps")
      .insert({
        date,
        recap_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("❌ [Save] Error inserting recap:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save recap: ${insertError.message}`,
        },
        { status: 500 },
      )
    }

    console.log("✅ [Save] Successfully saved recap:", {
      date,
      timeWindow: recap_data.time_window_hours,
      teamCount: recap_data.team_recaps.length,
      totalMatches: recap_data.total_matches,
    })

    // Trigger revalidation of the public page
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

      console.log("🔄 [Save] Triggering page revalidation...")

      // Use fetch to trigger the page to refresh its data
      const revalidateResponse = await fetch(`${baseUrl}/api/revalidate?path=/news/daily-recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (revalidateResponse.ok) {
        console.log("✅ [Save] Page revalidation successful")
      } else {
        console.warn("⚠️ [Save] Revalidation failed:", await revalidateResponse.text())
      }
    } catch (revalidateError) {
      console.warn("⚠️ [Save] Could not trigger revalidation:", revalidateError)
    }

    // Also trigger revalidation for the saved API endpoint
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

      console.log("🔄 [Save] Triggering API revalidation...")

      const apiRevalidateResponse = await fetch(`${baseUrl}/api/revalidate?path=/api/daily-recap/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (apiRevalidateResponse.ok) {
        console.log("✅ [Save] API revalidation successful")
      } else {
        console.warn("⚠️ [Save] API revalidation failed:", await apiRevalidateResponse.text())
      }
    } catch (apiRevalidateError) {
      console.warn("⚠️ [Save] Could not trigger API revalidation:", apiRevalidateError)
    }

    return NextResponse.json({
      success: true,
      message: "Daily recap saved successfully and will appear on the public page",
      data: {
        date,
        time_window_hours: recap_data.time_window_hours,
        team_count: recap_data.team_recaps.length,
        total_matches: recap_data.total_matches,
      },
    })
  } catch (error: any) {
    console.error("❌ [Save] Error saving daily recap:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// Force dynamic to prevent caching
export const dynamic = "force-dynamic"
export const revalidate = 0
