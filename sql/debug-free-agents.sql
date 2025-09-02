-- Debug script to check free agent data
-- Run this to see what's preventing free agents from showing up

-- Step 1: Check if there's an active season
SELECT 'ACTIVE SEASONS' as check_type, id, name, is_active, start_date, end_date 
FROM seasons 
WHERE is_active = true;

-- Step 2: Get active season ID for next queries
WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)

-- Step 3: Check season registrations for active season
SELECT 'SEASON REGISTRATIONS' as check_type, 
       COUNT(*) as total_registrations,
       COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_registrations,
       COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_registrations,
       COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_registrations
FROM season_registrations sr, active_season 
WHERE sr.season_id = active_season.season_id;

-- Step 4: Check players table - how many have teams vs no teams
SELECT 'PLAYERS TEAM STATUS' as check_type,
       COUNT(*) as total_players,
       COUNT(CASE WHEN team_id IS NULL THEN 1 END) as players_without_teams,
       COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as players_with_teams
FROM players;

-- Step 5: Check users with approved registrations who should be free agents
WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)
SELECT 'POTENTIAL FREE AGENTS' as check_type,
       COUNT(DISTINCT sr.user_id) as users_with_approved_registrations,
       COUNT(DISTINCT p.user_id) as users_with_player_records,
       COUNT(DISTINCT CASE WHEN p.team_id IS NULL THEN p.user_id END) as free_agent_players
FROM season_registrations sr, active_season
LEFT JOIN players p ON sr.user_id = p.user_id
WHERE sr.season_id = active_season.season_id 
  AND sr.status = 'Approved';

-- Step 6: Show actual free agents that should appear
WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)
SELECT 'FREE AGENT DETAILS' as check_type,
       u.gamer_tag_id,
       u.primary_position,
       u.secondary_position,
       u.console,
       sr.status as registration_status,
       p.id as player_id,
       p.team_id,
       p.salary
FROM season_registrations sr, active_season
JOIN users u ON sr.user_id = u.id
LEFT JOIN players p ON sr.user_id = p.user_id
WHERE sr.season_id = active_season.season_id 
  AND sr.status = 'Approved'
  AND (p.team_id IS NULL OR p.team_id IS NOT NULL)
ORDER BY u.gamer_tag_id
LIMIT 10;

-- Step 7: Check for missing player records
WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)
SELECT 'USERS WITHOUT PLAYER RECORDS' as check_type,
       COUNT(*) as users_missing_player_records
FROM season_registrations sr, active_season
JOIN users u ON sr.user_id = u.id
LEFT JOIN players p ON sr.user_id = p.user_id
WHERE sr.season_id = active_season.season_id 
  AND sr.status = 'Approved'
  AND p.id IS NULL;

-- Step 8: Show users missing player records
WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)
SELECT 'MISSING PLAYER RECORDS DETAILS' as check_type,
       u.gamer_tag_id,
       u.email,
       u.primary_position,
       u.console,
       sr.created_at as registration_date
FROM season_registrations sr, active_season
JOIN users u ON sr.user_id = u.id
LEFT JOIN players p ON sr.user_id = p.user_id
WHERE sr.season_id = active_season.season_id 
  AND sr.status = 'Approved'
  AND p.id IS NULL
LIMIT 5;
