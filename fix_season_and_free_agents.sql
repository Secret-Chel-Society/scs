-- Comprehensive Fix for Season Mismatch and Free Agents Issue
-- This script addresses both the season mismatch and free agents data problems

-- 1. First, let's see the current state
SELECT 'Current State Check' as step;

-- Check active seasons
SELECT 
    'Active Seasons' as check_type,
    id,
    name,
    is_active,
    start_date,
    end_date
FROM seasons 
WHERE is_active = TRUE
ORDER BY created_at DESC;

-- Check season registrations
SELECT 
    'Season Registrations Summary' as check_type,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_registrations,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_registrations
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
WHERE s.is_active = TRUE;

-- 2. Fix the season mismatch
SELECT 'Fixing Season Mismatch' as step;

-- Set only SCSHL Season 1 as active
UPDATE seasons 
SET is_active = FALSE, 
    updated_at = NOW()
WHERE id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE seasons 
SET is_active = TRUE, 
    updated_at = NOW()
WHERE id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- Update system settings
UPDATE system_settings 
SET value = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE key = 'current_season_id';

-- 3. Fix season registrations
SELECT 'Fixing Season Registrations' as step;

-- Update season registrations to use the correct season
UPDATE season_registrations 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 4. Fix team assignments
SELECT 'Fixing Team Assignments' as step;

UPDATE team_assignments 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 5. Fix other tables
SELECT 'Fixing Other Tables' as step;

UPDATE matches 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE player_bidding 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE trades 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE waivers 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

UPDATE daily_recaps 
SET season_id = 'fc808734-ff25-4f4b-9644-855ea0ea4b93',
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != 'fc808734-ff25-4f4b-9644-855ea0ea4b93';

-- 6. Verify the fixes
SELECT 'Verification' as step;

-- Check active seasons
SELECT 
    'Active Seasons After Fix' as check_type,
    id,
    name,
    is_active,
    start_date,
    end_date
FROM seasons 
WHERE is_active = TRUE
ORDER BY created_at DESC;

-- Check season registrations
SELECT 
    'Season Registrations After Fix' as check_type,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_registrations,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_registrations
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
WHERE s.is_active = TRUE;

-- Check free agents (players without teams who have approved registrations)
SELECT 
    'Free Agents Check' as check_type,
    COUNT(*) as free_agents_count
FROM players p
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved';

-- Detailed free agents breakdown
SELECT 
    'Detailed Free Agents' as check_type,
    p.id as player_id,
    p.salary,
    u.gamer_tag_id,
    u.primary_position,
    u.secondary_position,
    u.console,
    sr.status as registration_status,
    s.name as season_name,
    s.is_active as season_active
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN season_registrations sr ON p.user_id = sr.user_id
LEFT JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL
ORDER BY p.salary DESC
LIMIT 10;

-- Check system settings
SELECT 
    'System Settings' as check_type,
    key,
    value,
    description
FROM system_settings 
WHERE key LIKE '%season%';
