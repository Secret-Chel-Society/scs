import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Create system_settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value JSONB,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
        
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('bidding_recap_data', '{}', NOW())
        ON CONFLICT (key) DO NOTHING;
      `,
    })

    if (createTableError) {
      console.error("Error creating system_settings table:", createTableError)
      return NextResponse.json({ error: createTableError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "System settings table ensured successfully" })
  } catch (error) {
    console.error("Error in ensure system settings migration:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
