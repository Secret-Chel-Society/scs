import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("📖 [API] Fetching most recent saved daily recap...")

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const forceRefresh = searchParams.get("refresh") === "true"

    console.log("📖 [API] Query params:", { date, forceRefresh })

    let query = supabase
      .from("daily_recaps")
      .select("id, date, recap_data, created_at, updated_at")
      .order("updated_at", { ascending: false })

    if (date) {
      query = query.eq("date", date)
      console.log("📖 [API] Filtering by date:", date)
    } else {
      query = query.limit(1)
      console.log("📖 [API] Getting most recent recap")
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ [API] Database error fetching recap:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("📖 [API] Query result:", {
      count: data?.length,
      hasData: data?.[0] ? "Found data" : "No data",
      firstRecap: data?.[0]
        ? {
            id: data[0].id,
            date: data[0].date,
            updated_at: data[0].updated_at,
            hasRecapData: !!data[0].recap_data,
            teamCount: data[0].recap_data?.team_recaps?.length || 0,
            timeWindow: data[0].recap_data?.time_window_hours || "unknown",
          }
        : null,
    })

    if (!data || data.length === 0) {
      console.log("📖 [API] No saved recap found in database")
      return NextResponse.json({
        success: false,
        error: "No saved recap found",
      })
    }

    const recap = data[0]

    // Validate the recap data structure
    if (!recap.recap_data || !recap.recap_data.team_recaps) {
      console.error("❌ [API] Invalid recap data structure:", recap.recap_data)
      return NextResponse.json({
        success: false,
        error: "Invalid recap data structure",
      })
    }

    // Ensure time window is set
    if (!recap.recap_data.time_window_hours) {
      console.warn("⚠️ [API] Setting default time window to 24 hours")
      recap.recap_data.time_window_hours = 24
    }

    console.log("✅ [API] Found valid recap:", {
      id: recap.id,
      date: recap.date,
      updated_at: recap.updated_at,
      teamCount: recap.recap_data.team_recaps.length,
      totalMatches: recap.recap_data.total_matches,
      timeWindow: recap.recap_data.time_window_hours,
    })

    return NextResponse.json({
      success: true,
      data: recap.recap_data,
      metadata: {
        id: recap.id,
        date: recap.date,
        created_at: recap.created_at,
        updated_at: recap.updated_at,
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error fetching saved daily recap:", error)
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
