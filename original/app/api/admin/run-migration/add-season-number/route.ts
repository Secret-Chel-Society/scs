import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (userRolesError || !userRoles || userRoles.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the SQL migration file
    const sql = `
    -- Check if the season_number column exists in the seasons table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'seasons'
          AND column_name = 'season_number'
      ) THEN
        -- Add the season_number column if it doesn't exist
        ALTER TABLE public.seasons ADD COLUMN season_number INTEGER;
        
        -- Populate the season_number column based on season names where possible
        UPDATE public.seasons
        SET season_number = CAST(regexp_replace(name, '[^0-9]', '', 'g') AS INTEGER)
        WHERE regexp_replace(name, '[^0-9]', '', 'g') ~ '^[0-9]+$';
        
        -- For any remaining seasons without numbers, assign sequential numbers
        WITH numbered_seasons AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS row_num
          FROM public.seasons
          WHERE season_number IS NULL
        )
        UPDATE public.seasons s
        SET season_number = ns.row_num
        FROM numbered_seasons ns
        WHERE s.id = ns.id;
        
        RAISE NOTICE 'Added season_number column to seasons table';
      ELSE
        RAISE NOTICE 'season_number column already exists';
      END IF;
    END $$;
    `

    // Execute the SQL migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        { success: false, error: migrationError.message, details: "Failed to run migration" },
        { status: 500 },
      )
    }

    // Get all seasons to return in the response
    const { data: seasons, error: seasonsError } = await supabase
      .from("seasons")
      .select("id, name, season_number")
      .order("created_at", { ascending: true })

    if (seasonsError) {
      console.error("Error fetching seasons:", seasonsError)
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      seasons: seasons || [],
    })
  } catch (error) {
    console.error("Error in migration route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
