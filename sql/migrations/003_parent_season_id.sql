-- Migration: Add parent_season_id for playoff seasons
-- This allows playoff seasons to be linked to their parent regular season
-- for proper registration and stats tracking

-- Add parent_season_id column to seasons table
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS parent_season_id UUID REFERENCES seasons(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_seasons_parent_season_id ON seasons(parent_season_id);

-- Add is_playoff column to distinguish playoff seasons
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS is_playoff BOOLEAN DEFAULT false;

-- Add playoff_start_date and playoff_end_date for playoff seasons
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS playoff_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS playoff_end_date TIMESTAMP WITH TIME ZONE;

-- Create a function to automatically link playoff registrations to parent season
CREATE OR REPLACE FUNCTION link_playoff_registrations()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a playoff season and has a parent season
    IF NEW.is_playoff = true AND NEW.parent_season_id IS NOT NULL THEN
        -- Copy registrations from parent season to playoff season
        INSERT INTO season_registrations (
            user_id, 
            season_id, 
            gamer_tag, 
            primary_position, 
            secondary_position, 
            console,
            registration_date,
            status
        )
        SELECT 
            sr.user_id,
            NEW.id, -- playoff season id
            sr.gamer_tag,
            sr.primary_position,
            sr.secondary_position,
            sr.console,
            NOW(),
            'active'
        FROM season_registrations sr
        WHERE sr.season_id = NEW.parent_season_id
        AND sr.status = 'active'
        ON CONFLICT (user_id, season_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link registrations when playoff season is created
DROP TRIGGER IF EXISTS trigger_link_playoff_registrations ON seasons;
CREATE TRIGGER trigger_link_playoff_registrations
    AFTER INSERT ON seasons
    FOR EACH ROW
    EXECUTE FUNCTION link_playoff_registrations();

-- Create a function to get combined season stats (regular + playoff)
CREATE OR REPLACE FUNCTION get_combined_season_stats(season_id UUID)
RETURNS TABLE (
    user_id UUID,
    season_id UUID,
    games_played INTEGER,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    plus_minus INTEGER,
    pim INTEGER,
    shots INTEGER,
    hits INTEGER,
    blocks INTEGER,
    takeaways INTEGER,
    giveaways INTEGER,
    faceoffs_won INTEGER,
    faceoffs_taken INTEGER,
    faceoffs_lost INTEGER,
    pass_attempted INTEGER,
    pass_completed INTEGER,
    interceptions INTEGER,
    saves INTEGER,
    goals_against INTEGER,
    glshots INTEGER,
    save_pct NUMERIC,
    total_shots_faced INTEGER,
    wins INTEGER,
    losses INTEGER,
    otl INTEGER,
    shooting_pct NUMERIC,
    ppg INTEGER,
    shg INTEGER,
    gwg INTEGER,
    pass_pct NUMERIC,
    faceoff_pct NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.user_id,
        ps.season_id,
        COALESCE(ps.games_played, 0) + COALESCE(playoff_ps.games_played, 0) as games_played,
        COALESCE(ps.goals, 0) + COALESCE(playoff_ps.goals, 0) as goals,
        COALESCE(ps.assists, 0) + COALESCE(playoff_ps.assists, 0) as assists,
        COALESCE(ps.points, 0) + COALESCE(playoff_ps.points, 0) as points,
        COALESCE(ps.plus_minus, 0) + COALESCE(playoff_ps.plus_minus, 0) as plus_minus,
        COALESCE(ps.pim, 0) + COALESCE(playoff_ps.pim, 0) as pim,
        COALESCE(ps.shots, 0) + COALESCE(playoff_ps.shots, 0) as shots,
        COALESCE(ps.hits, 0) + COALESCE(playoff_ps.hits, 0) as hits,
        COALESCE(ps.blocks, 0) + COALESCE(playoff_ps.blocks, 0) as blocks,
        COALESCE(ps.takeaways, 0) + COALESCE(playoff_ps.takeaways, 0) as takeaways,
        COALESCE(ps.giveaways, 0) + COALESCE(playoff_ps.giveaways, 0) as giveaways,
        COALESCE(ps.faceoffs_won, 0) + COALESCE(playoff_ps.faceoffs_won, 0) as faceoffs_won,
        COALESCE(ps.faceoffs_taken, 0) + COALESCE(playoff_ps.faceoffs_taken, 0) as faceoffs_taken,
        COALESCE(ps.faceoffs_lost, 0) + COALESCE(playoff_ps.faceoffs_lost, 0) as faceoffs_lost,
        COALESCE(ps.pass_attempted, 0) + COALESCE(playoff_ps.pass_attempted, 0) as pass_attempted,
        COALESCE(ps.pass_completed, 0) + COALESCE(playoff_ps.pass_completed, 0) as pass_completed,
        COALESCE(ps.interceptions, 0) + COALESCE(playoff_ps.interceptions, 0) as interceptions,
        COALESCE(ps.saves, 0) + COALESCE(playoff_ps.saves, 0) as saves,
        COALESCE(ps.goals_against, 0) + COALESCE(playoff_ps.goals_against, 0) as goals_against,
        COALESCE(ps.glshots, 0) + COALESCE(playoff_ps.glshots, 0) as glshots,
        CASE 
            WHEN (COALESCE(ps.glshots, 0) + COALESCE(playoff_ps.glshots, 0)) > 0 
            THEN ROUND(
                (COALESCE(ps.saves, 0) + COALESCE(playoff_ps.saves, 0))::NUMERIC / 
                (COALESCE(ps.glshots, 0) + COALESCE(playoff_ps.glshots, 0))::NUMERIC, 
                3
            )
            ELSE 0 
        END as save_pct,
        COALESCE(ps.glshots, 0) + COALESCE(playoff_ps.glshots, 0) as total_shots_faced,
        COALESCE(ps.wins, 0) + COALESCE(playoff_ps.wins, 0) as wins,
        COALESCE(ps.losses, 0) + COALESCE(playoff_ps.losses, 0) as losses,
        COALESCE(ps.otl, 0) + COALESCE(playoff_ps.otl, 0) as otl,
        CASE 
            WHEN (COALESCE(ps.shots, 0) + COALESCE(playoff_ps.shots, 0)) > 0 
            THEN ROUND(
                (COALESCE(ps.goals, 0) + COALESCE(playoff_ps.goals, 0))::NUMERIC / 
                (COALESCE(ps.shots, 0) + COALESCE(playoff_ps.shots, 0))::NUMERIC * 100, 
                1
            )
            ELSE 0 
        END as shooting_pct,
        COALESCE(ps.ppg, 0) + COALESCE(playoff_ps.ppg, 0) as ppg,
        COALESCE(ps.shg, 0) + COALESCE(playoff_ps.shg, 0) as shg,
        COALESCE(ps.gwg, 0) + COALESCE(playoff_ps.gwg, 0) as gwg,
        CASE 
            WHEN (COALESCE(ps.pass_attempted, 0) + COALESCE(playoff_ps.pass_attempted, 0)) > 0 
            THEN ROUND(
                (COALESCE(ps.pass_completed, 0) + COALESCE(playoff_ps.pass_completed, 0))::NUMERIC / 
                (COALESCE(ps.pass_attempted, 0) + COALESCE(playoff_ps.pass_attempted, 0))::NUMERIC * 100, 
                1
            )
            ELSE 0 
        END as pass_pct,
        CASE 
            WHEN (COALESCE(ps.faceoffs_taken, 0) + COALESCE(playoff_ps.faceoffs_taken, 0)) > 0 
            THEN ROUND(
                (COALESCE(ps.faceoffs_won, 0) + COALESCE(playoff_ps.faceoffs_won, 0))::NUMERIC / 
                (COALESCE(ps.faceoffs_taken, 0) + COALESCE(playoff_ps.faceoffs_taken, 0))::NUMERIC * 100, 
                1
            )
            ELSE 0 
        END as faceoff_pct
    FROM player_statistics ps
    LEFT JOIN seasons playoff_season ON playoff_season.parent_season_id = ps.season_id AND playoff_season.is_playoff = true
    LEFT JOIN player_statistics playoff_ps ON playoff_ps.user_id = ps.user_id AND playoff_ps.season_id = playoff_season.id
    WHERE ps.season_id = season_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy access to combined season stats
CREATE OR REPLACE VIEW combined_season_stats AS
SELECT 
    s.id as season_id,
    s.name as season_name,
    s.number as season_number,
    s.is_playoff,
    s.parent_season_id,
    ps.user_id,
    u.gamer_tag_id,
    u.email,
    COALESCE(ps.games_played, 0) + COALESCE(playoff_ps.games_played, 0) as total_games_played,
    COALESCE(ps.goals, 0) + COALESCE(playoff_ps.goals, 0) as total_goals,
    COALESCE(ps.assists, 0) + COALESCE(playoff_ps.assists, 0) as total_assists,
    COALESCE(ps.points, 0) + COALESCE(playoff_ps.points, 0) as total_points,
    COALESCE(ps.plus_minus, 0) + COALESCE(playoff_ps.plus_minus, 0) as total_plus_minus,
    COALESCE(ps.wins, 0) + COALESCE(playoff_ps.wins, 0) as total_wins,
    COALESCE(ps.losses, 0) + COALESCE(playoff_ps.losses, 0) as total_losses,
    COALESCE(ps.otl, 0) + COALESCE(playoff_ps.otl, 0) as total_otl
FROM seasons s
LEFT JOIN player_statistics ps ON ps.season_id = s.id
LEFT JOIN seasons playoff_season ON playoff_season.parent_season_id = s.id AND playoff_season.is_playoff = true
LEFT JOIN player_statistics playoff_ps ON playoff_ps.user_id = ps.user_id AND playoff_ps.season_id = playoff_season.id
LEFT JOIN users u ON u.id = ps.user_id
WHERE s.is_playoff = false; -- Only show regular seasons in the view

-- Add RLS policies for the new columns
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view seasons
CREATE POLICY "Users can view seasons" ON seasons
    FOR SELECT USING (true);

-- Policy to allow admins to manage seasons
CREATE POLICY "Admins can manage seasons" ON seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('Admin', 'SuperAdmin')
        )
    );

-- Create a function to automatically create playoff season from regular season
CREATE OR REPLACE FUNCTION create_playoff_season(parent_season_id UUID, playoff_name TEXT)
RETURNS UUID AS $$
DECLARE
    playoff_season_id UUID;
    parent_season RECORD;
BEGIN
    -- Get parent season details
    SELECT * INTO parent_season FROM seasons WHERE id = parent_season_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent season not found';
    END IF;
    
    -- Create playoff season
    INSERT INTO seasons (
        name,
        number,
        parent_season_id,
        is_playoff,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        playoff_name,
        parent_season.number,
        parent_season_id,
        true,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO playoff_season_id;
    
    -- Link registrations from parent season
    INSERT INTO season_registrations (
        user_id, 
        season_id, 
        gamer_tag, 
        primary_position, 
        secondary_position, 
        console,
        registration_date,
        status
    )
    SELECT 
        sr.user_id,
        playoff_season_id,
        sr.gamer_tag,
        sr.primary_position,
        sr.secondary_position,
        sr.console,
        NOW(),
        'active'
    FROM season_registrations sr
    WHERE sr.season_id = parent_season_id
    AND sr.status = 'active'
    ON CONFLICT (user_id, season_id) DO NOTHING;
    
    RETURN playoff_season_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN seasons.parent_season_id IS 'Reference to parent season for playoff seasons';
COMMENT ON COLUMN seasons.is_playoff IS 'Indicates if this is a playoff season';
COMMENT ON COLUMN seasons.playoff_start_date IS 'Start date for playoff season';
COMMENT ON COLUMN seasons.playoff_end_date IS 'End date for playoff season';
COMMENT ON FUNCTION get_combined_season_stats(UUID) IS 'Returns combined stats from regular season and playoffs';
COMMENT ON FUNCTION create_playoff_season(UUID, TEXT) IS 'Creates a playoff season linked to a parent regular season';
