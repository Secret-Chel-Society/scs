import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "migrations", "fix_user_roles_constraint.sql")
    let sql

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)
      // If we can't read the file, use an inline SQL statement
      sql = `
        -- Drop the existing constraint
        ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
        
        -- Add a new constraint that allows all the necessary roles
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
        CHECK (role = ANY (ARRAY['Player'::text, 'GM'::text, 'AGM'::text, 'Owner'::text, 'Admin'::text]));
      `
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "User roles constraint fixed successfully",
    })
  } catch (error: any) {
    console.error("Error in fix-user-roles-constraint route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
