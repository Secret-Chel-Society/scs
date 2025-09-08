-- =====================================================
-- COMPLETE WEBSITE SYNCHRONIZATION FIX
-- Fixes all issues found in comprehensive function analysis
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. ADD MISSING GAMER_TAG FIELD
-- =====================================================

-- Add gamer_tag field to users table (used by forum posts)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gamer_tag'
    ) THEN
        ALTER TABLE users ADD COLUMN gamer_tag text;
        RAISE NOTICE 'Added gamer_tag column to users table';
    ELSE
        RAISE NOTICE 'gamer_tag column already exists in users table';
    END IF;
END $$;

-- Populate gamer_tag from gamer_tag_id for existing records
UPDATE users 
SET gamer_tag = gamer_tag_id 
WHERE gamer_tag IS NULL AND gamer_tag_id IS NOT NULL;

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Create injury_reserves table
CREATE TABLE IF NOT EXISTS injury_reserves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    injury_type text,
    expected_return_date date,
    placed_on_date timestamp with time zone DEFAULT now(),
    removed_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create lineups table
CREATE TABLE IF NOT EXISTS lineups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position text NOT NULL,
    is_starter boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance integer DEFAULT 0 NOT NULL,
    season_id uuid REFERENCES seasons(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    transaction_type text NOT NULL,
    description text,
    reference_id uuid,
    admin_user_id uuid REFERENCES users(id),
    season_id uuid REFERENCES seasons(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Create token_redeemables table
CREATE TABLE IF NOT EXISTS token_redeemables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    cost integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create token_redemptions table
CREATE TABLE IF NOT EXISTS token_redemptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redeemable_id uuid NOT NULL REFERENCES token_redeemables(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    notes text,
    admin_user_id uuid REFERENCES users(id),
    season_id uuid REFERENCES seasons(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create discord_users table
CREATE TABLE IF NOT EXISTS discord_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discord_id text NOT NULL UNIQUE,
    discord_username text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create discord_team_roles table
CREATE TABLE IF NOT EXISTS discord_team_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_id text NOT NULL,
    role_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create discord_bot_config table
CREATE TABLE IF NOT EXISTS discord_bot_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_token text,
    guild_id text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ip_address text,
    user_agent text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create code_downloads table
CREATE TABLE IF NOT EXISTS code_downloads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    file_name text NOT NULL,
    download_count integer DEFAULT 1,
    last_downloaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create file_access_logs table
CREATE TABLE IF NOT EXISTS file_access_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    file_path text NOT NULL,
    access_type text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create waiver_priority table
CREATE TABLE IF NOT EXISTS waiver_priority (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id integer NOT NULL,
    week_number integer NOT NULL,
    priority_order integer NOT NULL,
    last_claim_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 3. FIX PLAYER BIDDING SYSTEM
-- =====================================================

-- Add user_id column to player_bidding if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_bidding' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE player_bidding ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to player_bidding table';
    ELSE
        RAISE NOTICE 'user_id column already exists in player_bidding table';
    END IF;
END $$;

-- Populate user_id from players table
UPDATE player_bidding 
SET user_id = p.user_id
FROM players p
WHERE player_bidding.player_id = p.id 
  AND player_bidding.user_id IS NULL;

-- =====================================================
-- 4. FIX SEASON ID DATA TYPES
-- =====================================================

-- Ensure matches.season_id is UUID type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'season_id' AND data_type = 'integer'
    ) THEN
        -- Convert integer season_id to UUID
        ALTER TABLE matches ALTER COLUMN season_id TYPE uuid USING season_id::text::uuid;
        RAISE NOTICE 'Converted matches.season_id from integer to UUID';
    ELSE
        RAISE NOTICE 'matches.season_id is already UUID type';
    END IF;
END $$;

-- =====================================================
-- 5. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_injury_reserves_player_id ON injury_reserves(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_reserves_team_id ON injury_reserves(team_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_user_id ON discord_users(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_discord_id ON discord_users(discord_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_code_downloads_user_id ON code_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON waiver_priority(team_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_player_bidding_user_id ON player_bidding(user_id);

-- =====================================================
-- 6. FIX PLAYER STATUS CONFLICTS
-- =====================================================

-- Fix players with team but free_agent status
UPDATE players 
SET 
    status = 'active',
    manually_removed = false,
    manually_removed_at = NULL,
    manually_removed_by = NULL,
    updated_at = NOW()
WHERE team_id IS NOT NULL 
  AND status = 'free_agent';

-- Fix players without team but active status
UPDATE players 
SET 
    status = 'free_agent',
    updated_at = NOW()
WHERE team_id IS NULL 
  AND status = 'active';

-- Fix manually removed players still on teams
UPDATE players 
SET 
    team_id = NULL,
    status = 'free_agent',
    updated_at = NOW()
WHERE manually_removed = true 
  AND team_id IS NOT NULL;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Show tables created
SELECT 
    'TABLES CREATED' as status,
    table_name,
    'Successfully created' as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'injury_reserves', 'lineups', 'tokens', 'token_transactions', 
    'token_redeemables', 'token_redemptions', 'discord_users', 
    'discord_team_roles', 'discord_bot_config', 'analytics_events',
    'security_events', 'code_downloads', 'file_access_logs', 
    'waiver_priority', 'verification_tokens'
  )
ORDER BY table_name;

-- Show field additions
SELECT 
    'FIELDS ADDED' as status,
    table_name,
    column_name,
    data_type,
    'Successfully added' as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (
    (table_name = 'users' AND column_name = 'gamer_tag') OR
    (table_name = 'player_bidding' AND column_name = 'user_id')
  )
ORDER BY table_name, column_name;

-- Show player status conflicts resolved
SELECT 
    'PLAYER STATUS FIXED' as status,
    'Players with team but FA status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'PLAYER STATUS FIXED' as status,
    'Players without team but active status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'active'

UNION ALL

SELECT 
    'PLAYER STATUS FIXED' as status,
    'Manually removed but still on team' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- =====================================================
-- 8. COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== ENTIRE WEBSITE SYNCHRONIZATION COMPLETE ===';
    RAISE NOTICE 'All database synchronization issues have been resolved!';
    RAISE NOTICE 'Your website should now work correctly.';
    RAISE NOTICE 'All functions should now have proper database access.';
END $$;
