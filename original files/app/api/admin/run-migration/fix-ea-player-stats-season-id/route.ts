import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const cookieStore = request.headers.get("cookie") as string
    const supabase = createClient(cookieStore)

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration to fix season_id
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Fix all existing ea_player_stats records to have season_id = 1
        UPDATE ea_player_stats 
        SET season_id = 1 
        WHERE season_id IS NULL OR season_id != 1;
      `,
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get count of updated records
    const { data: countData, error: countError } = await supabase
      .from("ea_player_stats")
      .select("id", { count: "exact" })
      .eq("season_id", 1)

    const updatedCount = countData?.length || 0

    return NextResponse.json({
      success: true,
      message: `Successfully updated ea_player_stats season_id. ${updatedCount} records now have season_id = 1.`,
    })
  } catch (error: any) {
    console.error("Error in fix-ea-player-stats-season-id route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
