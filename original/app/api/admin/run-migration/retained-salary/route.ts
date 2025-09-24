import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Check authentication and admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 403 })
    }

    // Read the migration SQL
    const migrationSQL = `
      -- Add retained_salary column to players table
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'players' 
              AND column_name = 'retained_salary'
          ) THEN
              ALTER TABLE players ADD COLUMN retained_salary BIGINT DEFAULT 0;
          END IF;
      END $$;

      -- Add total_retained_salary column to teams table
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'teams' 
              AND column_name = 'total_retained_salary'
          ) THEN
              ALTER TABLE teams ADD COLUMN total_retained_salary BIGINT DEFAULT 0;
          END IF;
      END $$;

      -- Add comments to explain the columns
      COMMENT ON COLUMN players.retained_salary IS 'Amount of salary retained by the original team when traded';
      COMMENT ON COLUMN teams.total_retained_salary IS 'Total amount of salary retained by this team for traded players';
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (migrationError) {
      console.error("Migration error:", migrationError)
      return NextResponse.json(
        {
          error: `Migration failed: ${migrationError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Retained salary columns added successfully",
    })
  } catch (error: any) {
    console.error("Error running retained salary migration:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to run migration",
      },
      { status: 500 },
    )
  }
}
