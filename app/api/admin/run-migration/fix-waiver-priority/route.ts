import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Read the SQL file content from the migrations file
    const sqlQuery = `
    -- First, add the status column to waiver_claims if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waiver_claims' AND column_name = 'status'
      ) THEN
        ALTER TABLE waiver_claims ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
      END IF;
    END $$;
    
    -- Drop the existing trigger
    DROP TRIGGER IF EXISTS waiver_claim_successful ON waiver_claims;
    
    -- Create an updated trigger that works with or without the status column
    CREATE OR REPLACE FUNCTION update_waiver_priority_after_claim()
    RETURNS TRIGGER AS $$
    DECLARE
      current_priority INTEGER;
      max_priority INTEGER;
    BEGIN
      -- Get the current priority of the claiming team
      SELECT priority INTO current_priority FROM waiver_priority WHERE team_id = NEW.claiming_team_id;
      SELECT MAX(priority) INTO max_priority FROM waiver_priority;
      
      -- Move the claiming team to the bottom of the priority list
      IF current_priority IS NOT NULL AND max_priority IS NOT NULL THEN
        -- Update priorities for teams that were below the claiming team
        UPDATE waiver_priority
        SET priority = priority - 1
        WHERE priority > current_priority;
        
        -- Set the claiming team to the lowest priority
        UPDATE waiver_priority
        SET priority = max_priority,
            last_updated = NOW()
        WHERE team_id = NEW.claiming_team_id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create a new trigger without the status condition
    CREATE TRIGGER waiver_claim_successful
    AFTER INSERT ON waiver_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_waiver_priority_after_claim();
    
    -- Create a function to reset waiver priority based on standings
    CREATE OR REPLACE FUNCTION reset_waiver_priority()
    RETURNS INTEGER AS $$
    DECLARE
      team_record RECORD;
      priority_counter INTEGER := 1;
      next_reset TIMESTAMP WITH TIME ZONE;
      teams_updated INTEGER := 0;
    BEGIN
      -- Calculate next reset date (next Saturday at 8 AM EST)
      next_reset := (NOW() AT TIME ZONE 'EST')::date + 
                    ((6 - EXTRACT(DOW FROM (NOW() AT TIME ZONE 'EST'))::integer + 7) % 7 || ' days')::interval +
                    '8 hours'::interval;
      
      -- Get teams ordered by standings (worst to best)
      FOR team_record IN 
        SELECT id 
        FROM teams 
        WHERE is_active = true
        ORDER BY points ASC, -- Lowest points first
                 wins ASC,   -- Tiebreaker: fewer wins first
                 goal_differential ASC -- Tiebreaker: lower goal differential first
      LOOP
        -- Update or insert priority for this team
        INSERT INTO waiver_priority (team_id, priority, last_updated, next_reset)
        VALUES (team_record.id, priority_counter, NOW(), next_reset)
        ON CONFLICT (team_id) 
        DO UPDATE SET 
          priority = priority_counter,
          last_updated = NOW(),
          next_reset = next_reset;
          
        priority_counter := priority_counter + 1;
        teams_updated := teams_updated + 1;
      END LOOP;
      
      RETURN teams_updated;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Execute the SQL query
    const { error } = await supabaseAdmin.rpc("exec_sql", { query: sqlQuery })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Run the reset_waiver_priority function to initialize priorities
    const { data: resetResult, error: resetError } = await supabaseAdmin.rpc("reset_waiver_priority")

    if (resetError) {
      console.error("Error resetting waiver priorities:", resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Waiver priority trigger fixed and priorities reset successfully",
      teamsUpdated: resetResult,
    })
  } catch (error: any) {
    console.error("Error in migration execution:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
