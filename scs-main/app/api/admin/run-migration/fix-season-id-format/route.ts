import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "migrations", "fix_season_id_format.sql")
    const migration = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql_query: migration })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check current season value after migration
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "current_season")
      .single()

    if (settingsError) {
      return NextResponse.json({
        success: true,
        message: "Migration completed, but could not verify current season",
        error: settingsError.message,
      })
    }

    // Get all seasons for debugging
    const { data: seasons } = await supabase.from("seasons").select("id, name")

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      currentSeason: settingsData?.value,
      availableSeasons: seasons,
    })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
