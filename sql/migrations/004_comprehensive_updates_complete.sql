-- =====================================================
-- SIMPLE DATABASE UPDATES - Version 2.0 Features
-- =====================================================
-- This migration adds new features to existing tables
-- All changes are safe and work with your current database structure
-- =====================================================

-- =====================================================
-- 1. ENHANCE EXISTING SEASONS TABLE
-- =====================================================

-- Add is_playoff column to distinguish playoff seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS is_playoff BOOLEAN DEFAULT false;

-- Add playoff date columns
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS playoff_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS playoff_end_date TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 2. ENHANCE EXISTING MATCHES TABLE
-- =====================================================

-- Add featured column for homepage highlighting
ALTER TABLE matches ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Add three stars column for match highlights
ALTER TABLE matches ADD COLUMN IF NOT EXISTS three_stars JSONB;

-- Add team stats column for comprehensive match data
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_stats JSONB;

-- =====================================================
-- 3. ENHANCE EXISTING PLAYER_BIDDING TABLE
-- =====================================================

-- Add privacy controls for bidding
ALTER TABLE player_bidding ADD COLUMN IF NOT EXISTS hide_winning_team BOOLEAN DEFAULT false;
ALTER TABLE player_bidding ADD COLUMN IF NOT EXISTS show_time_remaining BOOLEAN DEFAULT true;
ALTER TABLE player_bidding ADD COLUMN IF NOT EXISTS show_bid_count BOOLEAN DEFAULT true;

-- Add bid history tracking
ALTER TABLE player_bidding ADD COLUMN IF NOT EXISTS bid_history JSONB;

-- =====================================================
-- 4. ENHANCE EXISTING TEAMS TABLE
-- =====================================================

-- Add playoff stats columns
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_wins INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_losses INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_otl INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_points INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_goals_for INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS playoff_goals_against INTEGER DEFAULT 0;

-- Add special teams stats (some already exist)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS powerplay_attempts INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shorthanded_goals INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shorthanded_attempts INTEGER DEFAULT 0;

-- =====================================================
-- 5. ENHANCE EXISTING WAIVER_CLAIMS TABLE
-- =====================================================

-- Add priority tracking
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS priority_at_claim INTEGER;

-- =====================================================
-- 6. CREATE SIMPLE USER TOKENS TABLE
-- =====================================================

-- Create a simple user tokens table for API access
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type VARCHAR(20) NOT NULL DEFAULT 'api' CHECK (token_type IN ('access', 'refresh', 'admin', 'api', 'redemption')),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
  request_reason TEXT,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  permissions TEXT[],
  metadata JSONB
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_token_type ON user_tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_user_tokens_status ON user_tokens(status);

-- =====================================================
-- 7. CREATE SIMPLE PLAYOFF BRACKET TABLES
-- =====================================================

-- Simple playoff brackets table
CREATE TABLE IF NOT EXISTS playoff_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  bracket_name VARCHAR(100) NOT NULL,
  bracket_type VARCHAR(20) DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple playoff series table
CREATE TABLE IF NOT EXISTS playoff_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES playoff_brackets(id) ON DELETE CASCADE,
  series_name VARCHAR(100) NOT NULL,
  round_number INTEGER NOT NULL,
  series_number INTEGER NOT NULL,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_wins INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  games_to_win INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  winner_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple playoff games table
CREATE TABLE IF NOT EXISTS playoff_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES playoff_series(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  game_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  match_id UUID REFERENCES matches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(series_id, game_number)
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_playoff_brackets_season_id ON playoff_brackets(season_id);
CREATE INDEX IF NOT EXISTS idx_playoff_series_bracket_id ON playoff_series(bracket_id);
CREATE INDEX IF NOT EXISTS idx_playoff_games_series_id ON playoff_games(series_id);

-- =====================================================
-- 8. CREATE SIMPLE VIEWS
-- =====================================================

-- Create a simple view for active waivers with time remaining
CREATE OR REPLACE VIEW active_waivers_view AS
SELECT 
    w.id,
    w.player_id,
    w.waiving_team_id,
    w.waived_at,
    w.claim_deadline,
    w.status,
    u.gamer_tag_id as player_name,
    t.name as waiving_team_name,
    EXTRACT(EPOCH FROM (w.claim_deadline - NOW())) as seconds_remaining,
    CASE 
        WHEN w.claim_deadline > NOW() THEN 'active'
        ELSE 'expired'
    END as time_status
FROM waivers w
LEFT JOIN players p ON p.id = w.player_id
LEFT JOIN users u ON u.id = p.user_id
LEFT JOIN teams t ON t.id = w.waiving_team_id
WHERE w.status = 'active';

-- =====================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_games ENABLE ROW LEVEL SECURITY;

-- Basic policies for user tokens
CREATE POLICY "Users can view their own tokens" ON user_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tokens" ON user_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Basic policies for playoff tables
CREATE POLICY "Users can view playoff brackets" ON playoff_brackets
    FOR SELECT USING (true);

CREATE POLICY "Users can view playoff series" ON playoff_series
    FOR SELECT USING (true);

CREATE POLICY "Users can view playoff games" ON playoff_games
    FOR SELECT USING (true);

-- =====================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Add comments to new columns
COMMENT ON COLUMN seasons.is_playoff IS 'Indicates if this is a playoff season';
COMMENT ON COLUMN seasons.playoff_start_date IS 'Start date for playoff season';
COMMENT ON COLUMN seasons.playoff_end_date IS 'End date for playoff season';
COMMENT ON COLUMN matches.featured IS 'Indicates if this match should be featured on the homepage';
COMMENT ON COLUMN matches.three_stars IS 'JSON array containing the three stars of the game';
COMMENT ON COLUMN matches.team_stats IS 'JSON object containing comprehensive team statistics';
COMMENT ON COLUMN player_bidding.hide_winning_team IS 'If true, the winning team is not shown publicly';
COMMENT ON COLUMN player_bidding.show_time_remaining IS 'If true, shows time remaining on the bid';
COMMENT ON COLUMN player_bidding.show_bid_count IS 'If true, shows the number of bids placed';
COMMENT ON COLUMN teams.playoff_wins IS 'Number of playoff wins for the team';
COMMENT ON COLUMN teams.playoff_losses IS 'Number of playoff losses for the team';
COMMENT ON COLUMN teams.playoff_otl IS 'Number of playoff overtime losses for the team';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All updates have been applied successfully
-- New features are now available for the hockey league application
-- =====================================================
