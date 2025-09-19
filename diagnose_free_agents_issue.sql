-- Diagnose Free Agents Issue
-- Check why free agents page shows zero players

-- 1. Check active seasons
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

-- 2. Check season registrations for active season
SELECT 
    'Season Registrations' as check_type,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_registrations,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_registrations
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
WHERE s.is_active = TRUE;

-- 3. Check players without teams
SELECT 
    'Players Without Teams' as check_type,
    COUNT(*) as total_players_without_teams
FROM players 
WHERE team_id IS NULL;

-- 4. Check players without teams who have approved registrations
SELECT 
    'Free Agents with Approved Registrations' as check_type,
    COUNT(*) as count
FROM players p
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved';

-- 5. Check user data for free agents
SELECT 
    'User Data for Free Agents' as check_type,
    COUNT(*) as count
FROM users u
JOIN players p ON u.id = p.user_id
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved';

-- 6. Detailed breakdown of the free agents query
SELECT 
    'Detailed Free Agents Breakdown' as check_type,
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

-- 7. Check if there are any players with teams (to verify data exists)
SELECT 
    'Players with Teams' as check_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL;

-- 8. Check all season registrations regardless of status
SELECT 
    'All Season Registrations' as check_type,
    sr.status,
    COUNT(*) as count,
    s.name as season_name,
    s.is_active as season_active
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
GROUP BY sr.status, s.name, s.is_active
ORDER BY s.is_active DESC, sr.status;
