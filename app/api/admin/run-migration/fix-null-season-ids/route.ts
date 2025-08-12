import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error checking user roles:", rolesError)
      return NextResponse.json({ error: "Error checking user roles" }, { status: 500 })
    }

    const isAdmin = userRoles?.some((r) => r.role === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 })
    }

    // Run the migration SQL
    const { data, error } = await supabase.rpc("run_sql", {
      sql_query: `
        -- Create a function to handle this update
        CREATE OR REPLACE FUNCTION fix_null_season_ids()
        RETURNS text AS $$
        DECLARE
            season_rec RECORD;
            reg_count INTEGER := 0;
            total_count INTEGER := 0;
            result_message TEXT := '';
        BEGIN
            -- For each season in the system
            FOR season_rec IN SELECT id, name, season_number FROM seasons ORDER BY season_number
            LOOP
                -- Update registrations that have null season_id but matching season_number
                UPDATE season_registrations
                SET season_id = season_rec.id
                WHERE season_id IS NULL 
                AND season_number = season_rec.season_number;
                
                -- Count how many rows were updated
                GET DIAGNOSTICS reg_count = ROW_COUNT;
                total_count := total_count + reg_count;
                
                -- Add to result message
                IF reg_count > 0 THEN
                    result_message := result_message || 'Updated ' || reg_count || ' registrations for season ' || 
                                     COALESCE(season_rec.name, 'Unknown') || ' (ID: ' || season_rec.id || ')\\n';
                END IF;
            END LOOP;
            
            result_message := 'Total registrations updated: ' || total_count || '\\n' || result_message;
            RETURN result_message;
        END;
        $$ LANGUAGE plpgsql;

        -- Execute the function and return its result
        SELECT fix_null_season_ids();

        -- Drop the function after use
        DROP FUNCTION fix_null_season_ids();
      `,
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: "Error running migration: " + error.message }, { status: 500 })
    }

    // Extract the result message from the SQL function
    const resultMessage = data && data.length > 0 ? data[0].run_sql : "Migration completed successfully"

    return NextResponse.json({ message: resultMessage })
  } catch (error: any) {
    console.error("Error in fix-null-season-ids migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
