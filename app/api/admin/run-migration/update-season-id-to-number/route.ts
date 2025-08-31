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
    -- Update season_id references to use season_number where appropriate
    -- This migration ensures proper handling of playoffs and regular seasons
    
    -- First, ensure all seasons have a season_number
    UPDATE public.seasons
    SET season_number = CAST(regexp_replace(name, '[^0-9]', '', 'g') AS INTEGER)
    WHERE season_number IS NULL
    AND regexp_replace(name, '[^0-9]', '', 'g') ~ '^[0-9]+$';

    -- Update matches table to use season_number for filtering
    -- Add a computed column for season_number if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'matches'
          AND column_name = 'season_number'
      ) THEN
        ALTER TABLE public.matches ADD COLUMN season_number INTEGER;
        
        -- Populate season_number from season_id
        UPDATE public.matches
        SET season_number = (
          SELECT s.season_number
          FROM public.seasons s
          WHERE s.id = matches.season_id
        )
        WHERE season_number IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_matches_season_number ON public.matches(season_number);
        
        RAISE NOTICE 'Added season_number column to matches table';
      ELSE
        RAISE NOTICE 'season_number column already exists in matches table';
      END IF;
    END $$;

    -- Update player_statistics table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'player_statistics'
          AND column_name = 'season_number'
      ) THEN
        ALTER TABLE public.player_statistics ADD COLUMN season_number INTEGER;
        
        -- Populate season_number from season_id
        UPDATE public.player_statistics
        SET season_number = (
          SELECT s.season_number
          FROM public.seasons s
          WHERE s.id = player_statistics.season_id
        )
        WHERE season_number IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_player_statistics_season_number ON public.player_statistics(season_number);
        
        RAISE NOTICE 'Added season_number column to player_statistics table';
      ELSE
        RAISE NOTICE 'season_number column already exists in player_statistics table';
      END IF;
    END $$;

    -- Update team_statistics table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'team_statistics'
          AND column_name = 'season_number'
      ) THEN
        ALTER TABLE public.team_statistics ADD COLUMN season_number INTEGER;
        
        -- Populate season_number from season_id
        UPDATE public.team_statistics
        SET season_number = (
          SELECT s.season_number
          FROM public.seasons s
          WHERE s.id = team_statistics.season_id
        )
        WHERE season_number IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_team_statistics_season_number ON public.team_statistics(season_number);
        
        RAISE NOTICE 'Added season_number column to team_statistics table';
      ELSE
        RAISE NOTICE 'season_number column already exists in team_statistics table';
      END IF;
    END $$;

    -- Update season_registrations table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'season_registrations'
          AND column_name = 'season_number'
      ) THEN
        ALTER TABLE public.season_registrations ADD COLUMN season_number INTEGER;
        
        -- Populate season_number from season_id
        UPDATE public.season_registrations
        SET season_number = (
          SELECT s.season_number
          FROM public.seasons s
          WHERE s.id = season_registrations.season_id
        )
        WHERE season_number IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_season_registrations_season_number ON public.season_registrations(season_number);
        
        RAISE NOTICE 'Added season_number column to season_registrations table';
      ELSE
        RAISE NOTICE 'season_number column already exists in season_registrations table';
      END IF;
    END $$;

    -- Update tokens table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tokens'
          AND column_name = 'season_number'
      ) THEN
        ALTER TABLE public.tokens ADD COLUMN season_number INTEGER;
        
        -- Populate season_number from season_id
        UPDATE public.tokens
        SET season_number = (
          SELECT s.season_number
          FROM public.seasons s
          WHERE s.id = tokens.season_id
        )
        WHERE season_number IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_tokens_season_number ON public.tokens(season_number);
        
        RAISE NOTICE 'Added season_number column to tokens table';
      ELSE
        RAISE NOTICE 'season_number column already exists in tokens table';
      END IF;
    END $$;

    -- Create a function to get season number from season ID
    CREATE OR REPLACE FUNCTION get_season_number(season_id UUID)
    RETURNS INTEGER AS $$
    DECLARE
      season_num INTEGER;
    BEGIN
      SELECT season_number INTO season_num
      FROM public.seasons
      WHERE id = season_id;
      
      RETURN COALESCE(season_num, 1); -- Default to season 1 if not found
    END;
    $$ LANGUAGE plpgsql;

    -- Create a function to get season ID from season number
    CREATE OR REPLACE FUNCTION get_season_id(season_num INTEGER)
    RETURNS UUID AS $$
    DECLARE
      season_uuid UUID;
    BEGIN
      SELECT id INTO season_uuid
      FROM public.seasons
      WHERE season_number = season_num
      AND parent_season_id IS NULL -- Get main season, not playoff
      ORDER BY created_at ASC
      LIMIT 1;
      
      RETURN season_uuid;
    END;
    $$ LANGUAGE plpgsql;

    -- Create a function to get current season number
    CREATE OR REPLACE FUNCTION get_current_season_number()
    RETURNS INTEGER AS $$
    DECLARE
      current_season_num INTEGER;
    BEGIN
      SELECT season_number INTO current_season_num
      FROM public.seasons
      WHERE is_active = true
      AND parent_season_id IS NULL -- Get main season, not playoff
      ORDER BY season_number DESC
      LIMIT 1;
      
      RETURN COALESCE(current_season_num, 1); -- Default to season 1 if not found
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers to automatically update season_number when season_id changes
    CREATE OR REPLACE FUNCTION update_season_number()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.season_id IS NOT NULL THEN
        NEW.season_number := get_season_number(NEW.season_id);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Add triggers to relevant tables
    DROP TRIGGER IF EXISTS update_matches_season_number ON public.matches;
    CREATE TRIGGER update_matches_season_number
    BEFORE INSERT OR UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION update_season_number();

    DROP TRIGGER IF EXISTS update_player_statistics_season_number ON public.player_statistics;
    CREATE TRIGGER update_player_statistics_season_number
    BEFORE INSERT OR UPDATE ON public.player_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_season_number();

    DROP TRIGGER IF EXISTS update_team_statistics_season_number ON public.team_statistics;
    CREATE TRIGGER update_team_statistics_season_number
    BEFORE INSERT OR UPDATE ON public.team_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_season_number();

    DROP TRIGGER IF EXISTS update_season_registrations_season_number ON public.season_registrations;
    CREATE TRIGGER update_season_registrations_season_number
    BEFORE INSERT OR UPDATE ON public.season_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_season_number();

    DROP TRIGGER IF EXISTS update_tokens_season_number ON public.tokens;
    CREATE TRIGGER update_tokens_season_number
    BEFORE INSERT OR UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_season_number();
    `

    // Execute the SQL migration
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }

    console.log("✅ Successfully updated season_id to season_number")

    return NextResponse.json({
      success: true,
      message: "Successfully updated season_id to season_number and added helper functions",
    })
  } catch (error: any) {
    console.error("Migration failed:", error)
    return NextResponse.json({ error: error.message || "Migration failed" }, { status: 500 })
  }
}
