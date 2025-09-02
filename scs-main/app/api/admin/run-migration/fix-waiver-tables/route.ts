import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 403 })
    }

    // Read the SQL file
    const { data: sqlData, error: sqlError } = await supabase.storage
      .from("migrations")
      .download("fix_waiver_tables.sql")

    if (sqlError || !sqlData) {
      // If the file doesn't exist in storage, use the hardcoded SQL
      console.log("Using hardcoded SQL - file not found in storage")

      // Execute the migration SQL directly
      const { error: migrationError } = await supabase.rpc("exec_sql", {
        sql_query: `
        -- First check if tables exist and drop them if they do
        DO $$
        BEGIN
            -- Drop waiver_claims if it exists
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_claims') THEN
                DROP TABLE public.waiver_claims;
            END IF;
            
            -- Drop waiver_priority if it exists
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_priority') THEN
                DROP TABLE public.waiver_priority;
            END IF;
        END
        $$;

        -- Create waiver_priority table with correct schema
        CREATE TABLE public.waiver_priority (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
            priority INTEGER NOT NULL,
            last_used TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(team_id)
        );

        -- Create waiver_claims table with correct schema
        CREATE TABLE public.waiver_claims (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            waiver_id UUID NOT NULL REFERENCES public.waivers(id) ON DELETE CASCADE,
            team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
            priority_at_claim INTEGER,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(waiver_id, team_id)
        );

        -- Create trigger function to update timestamps
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create triggers for both tables
        DROP TRIGGER IF EXISTS update_waiver_priority_timestamp ON public.waiver_priority;
        CREATE TRIGGER update_waiver_priority_timestamp
        BEFORE UPDATE ON public.waiver_priority
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        DROP TRIGGER IF EXISTS update_waiver_claims_timestamp ON public.waiver_claims;
        CREATE TRIGGER update_waiver_claims_timestamp
        BEFORE UPDATE ON public.waiver_claims
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Initialize waiver priority for all active teams based on standings
        INSERT INTO public.waiver_priority (team_id, priority)
        SELECT 
            id as team_id,
            ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as priority
        FROM 
            public.teams
        WHERE 
            is_active = true
        ON CONFLICT (team_id) DO UPDATE
        SET priority = EXCLUDED.priority;

        -- Create function to reset waiver priority
        CREATE OR REPLACE FUNCTION reset_waiver_priority()
        RETURNS VOID AS $$
        BEGIN
            -- Update priority based on current standings
            WITH team_standings AS (
                SELECT 
                    id as team_id,
                    ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as new_priority
                FROM 
                    public.teams
                WHERE 
                    is_active = true
            )
            UPDATE public.waiver_priority wp
            SET 
                priority = ts.new_priority,
                updated_at = NOW()
            FROM 
                team_standings ts
            WHERE 
                wp.team_id = ts.team_id;
            
            -- Insert any missing teams
            INSERT INTO public.waiver_priority (team_id, priority)
            SELECT 
                t.id as team_id,
                ROW_NUMBER() OVER (ORDER BY t.points DESC, t.wins DESC, t.losses ASC) as priority
            FROM 
                public.teams t
            LEFT JOIN 
                public.waiver_priority wp ON t.id = wp.team_id
            WHERE 
                t.is_active = true AND wp.id IS NULL;
        END;
        $$ LANGUAGE plpgsql;

        -- Create function to process waiver claims
        CREATE OR REPLACE FUNCTION process_waiver_claim(waiver_id UUID)
        RETURNS UUID AS $$
        DECLARE
            winning_claim_id UUID;
            winning_team_id UUID;
        BEGIN
            -- Find the claim with the highest priority (lowest number)
            SELECT 
                wc.id, wc.team_id INTO winning_claim_id, winning_team_id
            FROM 
                public.waiver_claims wc
            JOIN 
                public.waiver_priority wp ON wc.team_id = wp.team_id
            WHERE 
                wc.waiver_id = waiver_id AND wc.status = 'pending'
            ORDER BY 
                wp.priority ASC
            LIMIT 1;
            
            -- If we found a winning claim
            IF winning_claim_id IS NOT NULL THEN
                -- Update the winning claim to approved
                UPDATE public.waiver_claims
                SET status = 'approved'
                WHERE id = winning_claim_id;
                
                -- Update all other claims to rejected
                UPDATE public.waiver_claims
                SET status = 'rejected'
                WHERE waiver_id = waiver_id AND id != winning_claim_id;
                
                -- Update the waiver to claimed
                UPDATE public.waivers
                SET status = 'claimed', claimed_by = winning_team_id, claimed_at = NOW()
                WHERE id = waiver_id;
                
                -- Update the winning team's priority to the lowest
                WITH max_priority AS (
                    SELECT MAX(priority) + 1 as max_p FROM public.waiver_priority
                )
                UPDATE public.waiver_priority
                SET priority = (SELECT max_p FROM max_priority), last_used = NOW()
                WHERE team_id = winning_team_id;
            END IF;
            
            RETURN winning_claim_id;
        END;
        $$ LANGUAGE plpgsql;
        `,
      })

      if (migrationError) {
        console.error("Migration error:", migrationError)
        return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
      }
    } else {
      // If we have the SQL file from storage, use that
      const sqlText = await sqlData.text()

      // Execute the migration SQL
      const { error: migrationError } = await supabase.rpc("exec_sql", {
        sql_query: sqlText,
      })

      if (migrationError) {
        console.error("Migration error:", migrationError)
        return NextResponse.json({ error: `Migration failed: ${migrationError.message}` }, { status: 500 })
      }
    }

    // Upload the SQL file to storage for future reference if it doesn't exist
    if (sqlError) {
      try {
        const sqlContent = `
        -- First check if tables exist and drop them if they do
        DO $$
        BEGIN
            -- Drop waiver_claims if it exists
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_claims') THEN
                DROP TABLE public.waiver_claims;
            END IF;
            
            -- Drop waiver_priority if it exists
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_priority') THEN
                DROP TABLE public.waiver_priority;
            END IF;
        END
        $$;

        -- Create waiver_priority table with correct schema
        CREATE TABLE public.waiver_priority (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
            priority INTEGER NOT NULL,
            last_used TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(team_id)
        );

        -- Create waiver_claims table with correct schema
        CREATE TABLE public.waiver_claims (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            waiver_id UUID NOT NULL REFERENCES public.waivers(id) ON DELETE CASCADE,
            team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
            priority_at_claim INTEGER,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(waiver_id, team_id)
        );

        -- Create trigger function to update timestamps
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create triggers for both tables
        DROP TRIGGER IF EXISTS update_waiver_priority_timestamp ON public.waiver_priority;
        CREATE TRIGGER update_waiver_priority_timestamp
        BEFORE UPDATE ON public.waiver_priority
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        DROP TRIGGER IF EXISTS update_waiver_claims_timestamp ON public.waiver_claims;
        CREATE TRIGGER update_waiver_claims_timestamp
        BEFORE UPDATE ON public.waiver_claims
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Initialize waiver priority for all active teams based on standings
        INSERT INTO public.waiver_priority (team_id, priority)
        SELECT 
            id as team_id,
            ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as priority
        FROM 
            public.teams
        WHERE 
            is_active = true
        ON CONFLICT (team_id) DO UPDATE
        SET priority = EXCLUDED.priority;

        -- Create function to reset waiver priority
        CREATE OR REPLACE FUNCTION reset_waiver_priority()
        RETURNS VOID AS $$
        BEGIN
            -- Update priority based on current standings
            WITH team_standings AS (
                SELECT 
                    id as team_id,
                    ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as new_priority
                FROM 
                    public.teams
                WHERE 
                    is_active = true
            )
            UPDATE public.waiver_priority wp
            SET 
                priority = ts.new_priority,
                updated_at = NOW()
            FROM 
                team_standings ts
            WHERE 
                wp.team_id = ts.team_id;
            
            -- Insert any missing teams
            INSERT INTO public.waiver_priority (team_id, priority)
            SELECT 
                t.id as team_id,
                ROW_NUMBER() OVER (ORDER BY t.points DESC, t.wins DESC, t.losses ASC) as priority
            FROM 
                public.teams t
            LEFT JOIN 
                public.waiver_priority wp ON t.id = wp.team_id
            WHERE 
                t.is_active = true AND wp.id IS NULL;
        END;
        $$ LANGUAGE plpgsql;

        -- Create function to process waiver claims
        CREATE OR REPLACE FUNCTION process_waiver_claim(waiver_id UUID)
        RETURNS UUID AS $$
        DECLARE
            winning_claim_id UUID;
            winning_team_id UUID;
        BEGIN
            -- Find the claim with the highest priority (lowest number)
            SELECT 
                wc.id, wc.team_id INTO winning_claim_id, winning_team_id
            FROM 
                public.waiver_claims wc
            JOIN 
                public.waiver_priority wp ON wc.team_id = wp.team_id
            WHERE 
                wc.waiver_id = waiver_id AND wc.status = 'pending'
            ORDER BY 
                wp.priority ASC
            LIMIT 1;
            
            -- If we found a winning claim
            IF winning_claim_id IS NOT NULL THEN
                -- Update the winning claim to approved
                UPDATE public.waiver_claims
                SET status = 'approved'
                WHERE id = winning_claim_id;
                
                -- Update all other claims to rejected
                UPDATE public.waiver_claims
                SET status = 'rejected'
                WHERE waiver_id = waiver_id AND id != winning_claim_id;
                
                -- Update the waiver to claimed
                UPDATE public.waivers
                SET status = 'claimed', claimed_by = winning_team_id, claimed_at = NOW()
                WHERE id = waiver_id;
                
                -- Update the winning team's priority to the lowest
                WITH max_priority AS (
                    SELECT MAX(priority) + 1 as max_p FROM public.waiver_priority
                )
                UPDATE public.waiver_priority
                SET priority = (SELECT max_p FROM max_priority), last_used = NOW()
                WHERE team_id = winning_team_id;
            END IF;
            
            RETURN winning_claim_id;
        END;
        $$ LANGUAGE plpgsql;
        `

        await supabase.storage.from("migrations").upload("fix_waiver_tables.sql", sqlContent, {
          contentType: "text/plain",
          upsert: true,
        })
      } catch (uploadError) {
        console.error("Error uploading SQL file:", uploadError)
        // Continue even if upload fails
      }
    }

    // Update the waiver_claims API to handle missing priority
    try {
      const { data: apiData, error: apiError } = await supabase.from("waiver_claims").select("id").limit(1)

      if (apiError) {
        console.error("Error checking waiver_claims table:", apiError)
      }
    } catch (error) {
      console.error("Error checking waiver_claims table:", error)
    }

    return NextResponse.json({
      message:
        "Waiver tables fixed successfully. The waiver_priority and waiver_claims tables have been recreated with the correct schema.",
    })
  } catch (error: any) {
    console.error("Error in fix-waiver-tables migration:", error)
    return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
  }
}
