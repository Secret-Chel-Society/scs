-- Fix Season Mismatch Site Wide
-- Set SCSHL Season 1 as the active season and fix all references

-- First, let's see the current state of seasons
SELECT 
    id,
    name,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at,
    season_number,
    is_playoffs,
    description
FROM seasons 
ORDER BY created_at DESC;

-- Update all seasons to set only SCSHL Season 1 as active
UPDATE seasons 
SET is_active = FALSE, 
    updated_at = NOW()
WHERE id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Set SCSHL Season 1 as the active season
UPDATE seasons 
SET is_active = TRUE, 
    updated_at = NOW()
WHERE id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any system settings that reference seasons
UPDATE system_settings 
SET value = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE key = 'current_season_id';

-- Update any team assignments that might be using wrong season
UPDATE team_assignments 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any player registrations to use the correct season
UPDATE season_registrations 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any matches to use the correct season
UPDATE matches 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any player bidding to use the correct season
UPDATE player_bidding 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any trades to use the correct season
UPDATE trades 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any waivers to use the correct season
UPDATE waivers 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update any daily recaps to use the correct season
UPDATE daily_recaps 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Verify the changes
SELECT 
    id,
    name,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at,
    season_number,
    is_playoffs,
    description
FROM seasons 
ORDER BY is_active DESC, created_at DESC;

-- Check system settings
SELECT key, value, description 
FROM system_settings 
WHERE key LIKE '%season%';

-- Check for any remaining references to other seasons
SELECT 'team_assignments' as table_name, COUNT(*) as count
FROM team_assignments 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'season_registrations' as table_name, COUNT(*) as count
FROM season_registrations 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'matches' as table_name, COUNT(*) as count
FROM matches 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'player_bidding' as table_name, COUNT(*) as count
FROM player_bidding 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'trades' as table_name, COUNT(*) as count
FROM trades 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'waivers' as table_name, COUNT(*) as count
FROM waivers 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93'
UNION ALL
SELECT 'daily_recaps' as table_name, COUNT(*) as count
FROM daily_recaps 
WHERE season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';
