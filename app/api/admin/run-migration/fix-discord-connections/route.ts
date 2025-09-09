import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    console.log("Starting Discord connections fix migration...")

    // First, add discord_id column to users table if it doesn't exist
    const addColumnQuery = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discord_id') THEN
              ALTER TABLE users ADD COLUMN discord_id TEXT;
              CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
          END IF;
      END $$;
    `

    const { error: addColumnError } = await supabaseAdmin.rpc("exec_sql", { sql_query: addColumnQuery })

    if (addColumnError) {
      console.error("Error adding discord_id column:", addColumnError)
      return NextResponse.json({ error: addColumnError.message }, { status: 500 })
    }

    console.log("✓ Added discord_id column to users table")

    // Update users table with discord_id from discord_users table
    const updateUsersQuery = `
      UPDATE users 
      SET discord_id = du.discord_id
      FROM discord_users du
      WHERE users.id = du.user_id 
      AND users.discord_id IS NULL;
    `

    const { data: updateResult, error: updateError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: updateUsersQuery,
    })

    if (updateError) {
      console.error("Error updating users with discord_id:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("✓ Updated users table with Discord IDs")

    // Add discord_role_id column to teams table if it doesn't exist
    const addTeamColumnQuery = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'discord_role_id') THEN
              ALTER TABLE teams ADD COLUMN discord_role_id TEXT;
              CREATE INDEX IF NOT EXISTS idx_teams_discord_role_id ON teams(discord_role_id);
          END IF;
      END $$;
    `

    const { error: addTeamColumnError } = await supabaseAdmin.rpc("exec_sql", { sql_query: addTeamColumnQuery })

    if (addTeamColumnError) {
      console.error("Error adding discord_role_id column to teams:", addTeamColumnError)
      return NextResponse.json({ error: addTeamColumnError.message }, { status: 500 })
    }

    console.log("✓ Added discord_role_id column to teams table")

    // Get current counts
    const { data: discordUsersCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact" })
      .not("discord_id", "is", null)

    const { data: teamsWithRolesCount } = await supabaseAdmin
      .from("teams")
      .select("id", { count: "exact" })
      .not("discord_role_id", "is", null)

    console.log("Discord connections fix migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Discord connections fix migration completed",
      results: {
        usersWithDiscordId: discordUsersCount?.length || 0,
        teamsWithDiscordRoles: teamsWithRolesCount?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("Error in Discord connections fix migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
