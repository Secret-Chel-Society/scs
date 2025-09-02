import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST() {
  try {
    console.log("Fixing sequence permissions...")

    const sql = `
      -- Fix sequence permissions for system_settings
      GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
      GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;

      -- Also ensure table permissions are correct  
      GRANT SELECT ON system_settings TO authenticated;
      GRANT ALL ON system_settings TO service_role;
    `

    const { error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: sql,
    })

    if (error) {
      console.error("SQL error:", error)
      throw new Error(`Migration failed: ${error.message}`)
    }

    console.log("✅ Sequence permissions fixed successfully")

    return NextResponse.json({
      success: true,
      message: "Sequence permissions fixed successfully",
    })
  } catch (error: any) {
    console.error("❌ Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
