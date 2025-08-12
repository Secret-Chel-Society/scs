import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST() {
  try {
    console.log("Running trades table structure migration...")

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "migrations", "ensure_trades_table_structure.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    console.log("Executing migration SQL...")

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Migration completed successfully")

    // Verify the table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "trades")
      .order("ordinal_position")

    if (tableError) {
      console.error("Error checking table structure:", tableError)
    } else {
      console.log("Current trades table structure:", tableInfo)
    }

    return NextResponse.json({
      success: true,
      message: "Trades table structure migration completed successfully",
      tableStructure: tableInfo,
    })
  } catch (error: any) {
    console.error("Migration failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
