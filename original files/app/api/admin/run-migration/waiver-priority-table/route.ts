import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Read the SQL file content
    const sqlQuery = `
    -- Create waiver_priority table if it doesn't exist
    CREATE TABLE IF NOT EXISTS waiver_priority (
      id SERIAL PRIMARY KEY,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      priority INTEGER NOT NULL,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      next_reset TIMESTAMP WITH TIME ZONE NOT NULL,
      UNIQUE(team_id)
    );
    
    -- Create index on team_id for faster lookups
    CREATE INDEX IF NOT EXISTS waiver_priority_team_id_idx ON waiver_priority(team_id);
    
    -- Create function to update waiver priority when a team claims a player
    CREATE OR REPLACE FUNCTION update_waiver_priority_after_claim()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Get the current priority of the claiming team
      DECLARE
        current_priority INTEGER;
        max_priority INTEGER;
      BEGIN
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
          SET priority = max_priority
          WHERE team_id = NEW.claiming_team_id;
        END IF;
      END;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create trigger to update waiver priority when a claim is successful
    DROP TRIGGER IF EXISTS waiver_claim_successful ON waiver_claims;
    CREATE TRIGGER waiver_claim_successful
    AFTER INSERT ON waiver_claims
    FOR EACH ROW
    WHEN (NEW.status = 'successful')
    EXECUTE FUNCTION update_waiver_priority_after_claim();
    `

    // Execute the SQL query
    const { error } = await supabaseAdmin.rpc("exec_sql", { query: sqlQuery })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Initialize waiver priority based on current standings
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("is_active", true)
      .order("points", { ascending: true }) // Lowest points first
      .order("wins", { ascending: true }) // Tiebreaker: fewer wins first
      .order("goal_differential", { ascending: true }) // Tiebreaker: lower goal differential first

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    // Calculate next reset date (next Saturday at 8 AM EST)
    const now = new Date()
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7 // If today is Saturday, get next Saturday
    const nextSaturday = new Date(now)
    nextSaturday.setDate(now.getDate() + daysUntilSaturday)
    nextSaturday.setHours(8, 0, 0, 0)

    // Adjust for EST (UTC-5)
    const estOffset = 5 * 60 * 60 * 1000 // 5 hours in milliseconds
    const localOffset = now.getTimezoneOffset() * 60 * 1000 // Local offset in milliseconds
    nextSaturday.setTime(nextSaturday.getTime() + localOffset + estOffset)

    // Insert initial waiver priority records
    if (teams && teams.length > 0) {
      const priorityRecords = teams.map((team, index) => ({
        team_id: team.id,
        priority: index + 1,
        last_updated: new Date().toISOString(),
        next_reset: nextSaturday.toISOString(),
      }))

      const { error: insertError } = await supabaseAdmin.from("waiver_priority").insert(priorityRecords)

      if (insertError) {
        console.error("Error inserting waiver priority:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Waiver priority table and trigger created successfully",
    })
  } catch (error: any) {
    console.error("Error in migration execution:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
