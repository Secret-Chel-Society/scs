import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Read the migration file
    const migrationSQL = `
-- Create table to track failed Discord role sync attempts
CREATE TABLE IF NOT EXISTS discord_sync_failures (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    discord_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discord_sync_failures_user_id ON discord_sync_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_sync_failures_discord_id ON discord_sync_failures(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_sync_failures_resolved ON discord_sync_failures(resolved_at);
CREATE INDEX IF NOT EXISTS idx_discord_sync_failures_created_at ON discord_sync_failures(created_at);

-- Add RLS policy
ALTER TABLE discord_sync_failures ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all failures
CREATE POLICY "Admins can view all discord sync failures" ON discord_sync_failures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Discord sync failures table created successfully",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
