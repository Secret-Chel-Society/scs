-- Test Free Agents Data Flow
-- This script tests the exact same query that the free agents API uses

-- 1. Get the active season (same as API)
SELECT 
    'Step 1: Active Season' as step,
    id,
    name,
    is_active
FROM seasons 
WHERE is_active = TRUE
LIMIT 1;

-- 2. Get approved season registrations for the active season (same as API)
SELECT 
    'Step 2: Approved Registrations' as step,
    COUNT(*) as count,
    sr.user_id,
    sr.primary_position,
    sr.secondary_position,
    sr.gamer_tag,
    sr.console
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
WHERE s.is_active = TRUE
  AND sr.status = 'Approved'
GROUP BY sr.user_id, sr.primary_position, sr.secondary_position, sr.gamer_tag, sr.console
LIMIT 10;

-- 3. Get players without teams who have approved registrations (same as API)
SELECT 
    'Step 3: Players Without Teams' as step,
    COUNT(*) as count,
    p.id,
    p.salary,
    p.user_id
FROM players p
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved'
GROUP BY p.id, p.salary, p.user_id
LIMIT 10;

-- 4. Get user data for the free agent players (same as API)
SELECT 
    'Step 4: User Data for Free Agents' as step,
    COUNT(*) as count,
    u.id,
    u.gamer_tag_id,
    u.primary_position,
    u.secondary_position,
    u.console,
    u.avatar_url
FROM users u
JOIN players p ON u.id = p.user_id
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved'
GROUP BY u.id, u.gamer_tag_id, u.primary_position, u.secondary_position, u.console, u.avatar_url
LIMIT 10;

-- 5. Final combined query (same as API)
SELECT 
    'Step 5: Final Combined Query' as step,
    p.id as player_id,
    p.salary,
    u.id as user_id,
    u.gamer_tag_id,
    u.primary_position,
    u.secondary_position,
    u.console,
    u.avatar_url,
    sr.gamer_tag as registration_gamer_tag,
    sr.primary_position as registration_primary_position,
    sr.secondary_position as registration_secondary_position,
    sr.console as registration_console
FROM players p
JOIN users u ON p.user_id = u.id
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved'
ORDER BY p.salary DESC
LIMIT 10;

-- 6. Check if there are any players at all
SELECT 
    'Step 6: All Players Check' as step,
    COUNT(*) as total_players,
    COUNT(CASE WHEN team_id IS NULL THEN 1 END) as players_without_teams,
    COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as players_with_teams
FROM players;

-- 7. Check if there are any season registrations at all
SELECT 
    'Step 7: All Season Registrations Check' as step,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected
FROM season_registrations;
