-- Fix Season Mismatch - Critical Tables Only
-- This script focuses on the most important tables first

-- 1. Set only SCSHL Season 1 as active
UPDATE seasons 
SET is_active = FALSE, 
    updated_at = NOW()
WHERE id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE seasons 
SET is_active = TRUE, 
    updated_at = NOW()
WHERE id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 2. Update system settings
UPDATE system_settings 
SET value = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE key = 'current_season_id';

-- 3. Update player registrations (most critical for user access)
UPDATE season_registrations 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 4. Update team assignments
UPDATE team_assignments 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 5. Update matches
UPDATE matches 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 6. Update player bidding
UPDATE player_bidding 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Verify the changes
SELECT 
    'seasons' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_records
FROM seasons
UNION ALL
SELECT 
    'season_registrations' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93' THEN 1 ELSE 0 END) as correct_season_records
FROM season_registrations
UNION ALL
SELECT 
    'team_assignments' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93' THEN 1 ELSE 0 END) as correct_season_records
FROM team_assignments
UNION ALL
SELECT 
    'matches' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93' THEN 1 ELSE 0 END) as correct_season_records
FROM matches
UNION ALL
SELECT 
    'player_bidding' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93' THEN 1 ELSE 0 END) as correct_season_records
FROM player_bidding;
