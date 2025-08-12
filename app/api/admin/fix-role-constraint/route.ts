import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Validate admin key
    if (!process.env.ADMIN_VERIFICATION_KEY || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      console.error("Invalid admin key provided")
      return NextResponse.json({ error: "Invalid admin key provided" }, { status: 401 })
    }

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Check if player_role type exists
    const { data: typeExists, error: typeCheckError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'player_role')",
    })

    if (typeCheckError) {
      console.error("Error checking if player_role type exists:", typeCheckError)
      return NextResponse.json({ error: "Failed to check if player_role type exists" }, { status: 500 })
    }

    const result = { message: "Role constraint fixed successfully", actions: [] }

    // If the type doesn't exist, create it
    if (!typeExists[0].exists) {
      const { error: createTypeError } = await supabaseAdmin.rpc("exec_sql", {
        sql_query: `
          CREATE TYPE player_role AS ENUM ('Player', 'GM', 'AGM', 'Owner', 'Admin');
        `,
      })

      if (createTypeError) {
        console.error("Error creating player_role type:", createTypeError)
        return NextResponse.json({ error: "Failed to create player_role type" }, { status: 500 })
      }

      result.actions.push("Created player_role enum type")
    }

    // Check current constraint
    const { data: constraintData, error: constraintError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: "SELECT conname, consrc FROM pg_constraint WHERE conname = 'players_role_check'",
    })

    if (constraintError) {
      console.error("Error checking constraint:", constraintError)
      return NextResponse.json({ error: "Failed to check constraint" }, { status: 500 })
    }

    // If constraint exists, drop it
    if (constraintData && constraintData.length > 0) {
      const { error: dropConstraintError } = await supabaseAdmin.rpc("exec_sql", {
        sql_query: "ALTER TABLE players DROP CONSTRAINT players_role_check",
      })

      if (dropConstraintError) {
        console.error("Error dropping constraint:", dropConstraintError)
        return NextResponse.json({ error: "Failed to drop constraint" }, { status: 500 })
      }

      result.actions.push("Dropped existing constraint")
    }

    // Add new constraint
    const { error: addConstraintError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        ALTER TABLE players 
        ADD CONSTRAINT players_role_check 
        CHECK (role IN ('Player', 'GM', 'AGM', 'Owner', 'Admin'))
      `,
    })

    if (addConstraintError) {
      console.error("Error adding constraint:", addConstraintError)
      return NextResponse.json({ error: "Failed to add constraint" }, { status: 500 })
    }

    result.actions.push("Added new role constraint")

    // Fix any existing invalid roles
    const { data: fixedRoles, error: fixRolesError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        UPDATE players 
        SET role = 'Player' 
        WHERE role NOT IN ('Player', 'GM', 'AGM', 'Owner', 'Admin')
        RETURNING id
      `,
    })

    if (fixRolesError) {
      console.error("Error fixing invalid roles:", fixRolesError)
      return NextResponse.json({ error: "Failed to fix invalid roles" }, { status: 500 })
    }

    const fixedCount = fixedRoles?.length || 0
    result.actions.push(`Fixed ${fixedCount} invalid role values`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fixing role constraint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
