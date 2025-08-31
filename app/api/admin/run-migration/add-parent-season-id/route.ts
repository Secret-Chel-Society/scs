import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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
    -- Add parent_season_id column to seasons table if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'seasons'
          AND column_name = 'parent_season_id'
      ) THEN
        -- Add the parent_season_id column
        ALTER TABLE public.seasons ADD COLUMN parent_season_id UUID REFERENCES public.seasons(id);
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_seasons_parent_season_id ON public.seasons(parent_season_id);
        
        RAISE NOTICE 'Added parent_season_id column to seasons table';
      ELSE
        RAISE NOTICE 'parent_season_id column already exists';
      END IF;
    END $$;

    -- Update existing playoff seasons to have proper parent_season_id
    -- This assumes playoff seasons have names like "Season 1 (Playoffs)" or similar
    UPDATE public.seasons
    SET parent_season_id = (
      SELECT s2.id 
      FROM public.seasons s2 
      WHERE s2.name = regexp_replace(seasons.name, '\\s*\\(Playoffs?\\)\\s*', '', 'gi')
      AND s2.id != seasons.id
      LIMIT 1
    )
    WHERE seasons.name ILIKE '%playoff%'
    AND seasons.parent_season_id IS NULL;

    -- Also handle other playoff naming patterns
    UPDATE public.seasons
    SET parent_season_id = (
      SELECT s2.id 
      FROM public.seasons s2 
      WHERE s2.name = regexp_replace(seasons.name, '\\s*Playoffs?\\s*', '', 'gi')
      AND s2.id != seasons.id
      LIMIT 1
    )
    WHERE seasons.name ILIKE '%playoff%'
    AND seasons.parent_season_id IS NULL;

    -- Create a function to get the main season for any season (including playoffs)
    CREATE OR REPLACE FUNCTION get_main_season_id(season_id UUID)
    RETURNS UUID AS $$
    DECLARE
      main_season_id UUID;
    BEGIN
      -- First check if this season has a parent
      SELECT parent_season_id INTO main_season_id
      FROM public.seasons
      WHERE id = season_id;
      
      -- If it has a parent, return the parent
      IF main_season_id IS NOT NULL THEN
        RETURN main_season_id;
      END IF;
      
      -- Otherwise, return the season itself
      RETURN season_id;
    END;
    $$ LANGUAGE plpgsql;

    -- Create a function to check if a season is a playoff season
    CREATE OR REPLACE FUNCTION is_playoff_season(season_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM public.seasons 
        WHERE id = season_id 
        AND parent_season_id IS NOT NULL
      );
    END;
    $$ LANGUAGE plpgsql;

    -- Update the season_registrations table to use parent_season_id for role assignment
    -- This ensures playoff registrations give the proper role for the main season
    CREATE OR REPLACE FUNCTION assign_season_role()
    RETURNS TRIGGER AS $$
    DECLARE
      main_season_id UUID;
      season_name TEXT;
    BEGIN
      -- Get the main season ID (not playoff)
      SELECT get_main_season_id(NEW.season_id) INTO main_season_id;
      
      -- Get the season name for role assignment
      SELECT name INTO season_name
      FROM public.seasons
      WHERE id = main_season_id;
      
      -- Assign role based on main season, not playoff season
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'Season ' || regexp_replace(season_name, '[^0-9]', '', 'g'))
      ON CONFLICT (user_id, role) DO NOTHING;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for season registrations
    DROP TRIGGER IF EXISTS season_registration_role_trigger ON public.season_registrations;
    CREATE TRIGGER season_registration_role_trigger
    AFTER INSERT ON public.season_registrations
    FOR EACH ROW
    EXECUTE FUNCTION assign_season_role();
    `

    // Execute the SQL migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }

    console.log("✅ Successfully added parent_season_id and related functions")

    return NextResponse.json({
      success: true,
      message: "Successfully added parent_season_id column and related functions",
    })
  } catch (error: any) {
    console.error("Migration failed:", error)
    return NextResponse.json({ error: error.message || "Migration failed" }, { status: 500 })
  }
}
