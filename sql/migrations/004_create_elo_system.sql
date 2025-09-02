-- Create ELO System Database Schema
-- This system is completely separate from the main league stats

-- ELO Players table
CREATE TABLE IF NOT EXISTS elo_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_id VARCHAR(255) NOT NULL UNIQUE,
    discord_username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL, -- C, LW, RW, D, G
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    loss_streak INTEGER DEFAULT 0,
    highest_rating INTEGER DEFAULT 1200,
    lowest_rating INTEGER DEFAULT 1200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_match_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- ELO Matches table
CREATE TABLE IF NOT EXISTS elo_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lobby_id UUID,
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    winner_team INTEGER CHECK (winner_team IN (1, 2)),
    match_duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ELO Match Players table (for individual player performance in matches)
CREATE TABLE IF NOT EXISTS elo_match_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES elo_matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES elo_players(id) ON DELETE CASCADE,
    team_number INTEGER CHECK (team_number IN (1, 2)),
    position VARCHAR(50) NOT NULL,
    rating_before INTEGER NOT NULL,
    rating_after INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0, -- for goalies
    points_earned INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ELO Lobbies table
CREATE TABLE IF NOT EXISTS elo_lobbies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'forming_teams', 'in_progress', 'completed', 'cancelled')),
    max_players INTEGER DEFAULT 12,
    current_players INTEGER DEFAULT 0,
    captain1_id UUID REFERENCES elo_players(id),
    captain2_id UUID REFERENCES elo_players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ELO Lobby Players table (players in a lobby)
CREATE TABLE IF NOT EXISTS elo_lobby_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id UUID REFERENCES elo_lobbies(id) ON DELETE CASCADE,
    player_id UUID REFERENCES elo_players(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position VARCHAR(50) NOT NULL,
    is_captain BOOLEAN DEFAULT false,
    team_number INTEGER CHECK (team_number IN (1, 2)),
    UNIQUE(lobby_id, player_id)
);

-- ELO Settings table (for configurable values)
CREATE TABLE IF NOT EXISTS elo_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default ELO settings
INSERT INTO elo_settings (setting_key, setting_value, description) VALUES
    ('points_per_win', '3', 'Points awarded for winning a match'),
    ('points_per_loss', '0', 'Points awarded for losing a match'),
    ('points_per_draw', '1', 'Points awarded for drawing a match'),
    ('k_factor', '32', 'K-factor for ELO rating calculations'),
    ('min_players_for_match', '12', 'Minimum players required to start a match'),
    ('max_players_per_team', '6', 'Maximum players per team'),
    ('lobby_timeout_minutes', '15', 'Minutes before lobby times out if not full')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_elo_players_discord_id ON elo_players(discord_id);
CREATE INDEX IF NOT EXISTS idx_elo_players_rating ON elo_players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_elo_matches_date ON elo_matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_elo_match_players_match_id ON elo_match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_elo_match_players_player_id ON elo_match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_elo_lobbies_status ON elo_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_elo_lobby_players_lobby_id ON elo_lobby_players(lobby_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_elo_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_elo_players_updated_at
    BEFORE UPDATE ON elo_players
    FOR EACH ROW
    EXECUTE FUNCTION update_elo_updated_at_column();

CREATE TRIGGER update_elo_settings_updated_at
    BEFORE UPDATE ON elo_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_elo_updated_at_column();
