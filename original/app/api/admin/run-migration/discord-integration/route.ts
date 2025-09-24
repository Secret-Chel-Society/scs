import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Read the migration file content
    const migrationSQL = `
-- Create Discord bot configuration table
CREATE TABLE IF NOT EXISTS discord_bot_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    bot_token TEXT NOT NULL,
    registered_role_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Discord users table
CREATE TABLE IF NOT EXISTS discord_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discord_id TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Discord team roles mapping table
CREATE TABLE IF NOT EXISTS discord_team_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    discord_role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Discord management roles mapping table
CREATE TABLE IF NOT EXISTS discord_management_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_type TEXT NOT NULL,
    discord_role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Twitch users table
CREATE TABLE IF NOT EXISTS twitch_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_user_id UUID REFERENCES discord_users(id) ON DELETE CASCADE,
    twitch_id TEXT UNIQUE NOT NULL,
    twitch_username TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_live BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live streams table
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    twitch_user_id UUID REFERENCES twitch_users(id) ON DELETE CASCADE,
    stream_title TEXT,
    stream_url TEXT NOT NULL,
    viewer_count INTEGER DEFAULT 0,
    game_name TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discord_users_user_id ON discord_users(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_discord_id ON discord_users(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_team_roles_team_id ON discord_team_roles(team_id);
CREATE INDEX IF NOT EXISTS idx_twitch_users_discord_user_id ON twitch_users(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active);

-- Insert default bot configuration
INSERT INTO discord_bot_config (guild_id, bot_token, registered_role_id)
VALUES ('1345946042281234442', 'MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc', '1376312623728951339')
ON CONFLICT DO NOTHING;
    `

    // Execute the migration
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
      message: "Discord integration tables created successfully",
    })
  } catch (error: any) {
    console.error("Error running Discord integration migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
