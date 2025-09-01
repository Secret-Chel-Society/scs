import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRole } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration SQL
    const { error } = await supabase.rpc("run_sql", {
      query: `
        -- Create a table to map EA player names to player IDs
        CREATE TABLE IF NOT EXISTS ea_player_mappings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          persona TEXT NOT NULL,
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(persona)
        );
        
        -- Create an index on persona for faster lookups
        CREATE INDEX IF NOT EXISTS idx_ea_player_mappings_persona ON ea_player_mappings(persona);
      `,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
