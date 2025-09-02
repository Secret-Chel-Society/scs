import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

    const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Run the migration
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Add admin_only column to forum_categories table
        ALTER TABLE forum_categories 
        ADD COLUMN IF NOT EXISTS admin_only BOOLEAN DEFAULT FALSE;

        -- Update existing categories
        UPDATE forum_categories 
        SET admin_only = TRUE 
        WHERE name ILIKE '%announcement%' OR name ILIKE '%admin%' OR name ILIKE '%news%';

        -- Ensure we have a general category that's not admin-only
        INSERT INTO forum_categories (name, description, color, admin_only)
        VALUES ('General Discussion', 'General discussion topics', '#6366f1', FALSE)
        ON CONFLICT (name) DO NOTHING;
      `,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Forum categories admin-only migration completed" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
