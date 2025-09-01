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
    -- Check if any seasons are missing season_number
    DO $$
    DECLARE
      missing_count INTEGER;
    BEGIN
      -- Count seasons with null season_number
      SELECT COUNT(*) INTO missing_count
      FROM public.seasons
      WHERE season_number IS NULL;
      
      -- If we have seasons missing the season_number, update them
      IF missing_count > 0 THEN
        -- First, try to update seasons with numbers in their names
        UPDATE public.seasons
        SET season_number = CAST(regexp_replace(name, '[^0-9]', '', 'g') AS INTEGER)
        WHERE season_number IS NULL 
          AND regexp_replace(name, '[^0-9]', '', 'g') ~ '^[0-9]+$';
        
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
        
        RAISE NOTICE 'Updated % seasons with missing season_number', missing_count;
      ELSE
        RAISE NOTICE 'All seasons already have a season_number';
      END IF;
    END $$;

    -- Ensure the season_number column has a NOT NULL constraint
    DO $$
    BEGIN
      -- Check if the column already has a NOT NULL constraint
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'seasons'
          AND column_name = 'season_number'
          AND is_nullable = 'NO'
      ) THEN
        RAISE NOTICE 'season_number column already has NOT NULL constraint';
      ELSE
        -- Add the NOT NULL constraint
        ALTER TABLE public.seasons
        ALTER COLUMN season_number SET NOT NULL;
        
        RAISE NOTICE 'Added NOT NULL constraint to season_number column';
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
      .order("season_number", { ascending: true })

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
