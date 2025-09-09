import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Read the migration file content
    const migrationSQL = `
-- Create discord_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS discord_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discord_id TEXT NOT NULL UNIQUE,
    discord_username TEXT NOT NULL,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discord_users_user_id ON discord_users(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_discord_id ON discord_users(discord_id);

-- Enable RLS
ALTER TABLE discord_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own Discord connection" ON discord_users;
DROP POLICY IF EXISTS "Users can update their own Discord connection" ON discord_users;
DROP POLICY IF EXISTS "Users can delete their own Discord connection" ON discord_users;
DROP POLICY IF EXISTS "Service role can manage all Discord connections" ON discord_users;

-- Create policies
CREATE POLICY "Users can view their own Discord connection" ON discord_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Discord connection" ON discord_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Discord connection" ON discord_users
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all Discord connections" ON discord_users
    FOR ALL USING (auth.role() = 'service_role');
    `

    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Discord users table created successfully",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
