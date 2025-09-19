-- Fix Free Agents Issue Safely
-- This script fixes the free agents issue without modifying seasons

-- 1. Check current state
SELECT 
    'Current State Check' as step,
    'Active Seasons' as check_type,
    COUNT(*) as count
FROM seasons 
WHERE is_active = TRUE;

-- 2. Check season registrations
SELECT 
    'Season Registrations Check' as step,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_registrations
FROM season_registrations sr
JOIN seasons s ON sr.season_id = s.id
WHERE s.is_active = TRUE;

-- 3. Check free agents (players without teams who have approved registrations)
SELECT 
    'Free Agents Check' as step,
    COUNT(*) as free_agents_count
FROM players p
JOIN season_registrations sr ON p.user_id = sr.user_id
JOIN seasons s ON sr.season_id = s.id
WHERE p.team_id IS NULL 
  AND s.is_active = TRUE 
  AND sr.status = 'Approved';

-- 4. If there are no free agents, check if there are players without teams at all
SELECT 
    'Players Without Teams Check' as step,
    COUNT(*) as players_without_teams
FROM players 
WHERE team_id IS NULL;

-- 5. If there are no approved registrations, check if there are any registrations at all
SELECT 
    'All Season Registrations Check' as step,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected
FROM season_registrations;

-- 6. Check if there are any players at all
SELECT 
    'All Players Check' as step,
    COUNT(*) as total_players,
    COUNT(CASE WHEN team_id IS NULL THEN 1 END) as players_without_teams,
    COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as players_with_teams
FROM players;

-- 7. If we need to create some test data, we can do it here
-- But first, let's see what we have

-- 8. Check the exact query that the free agents API uses
SELECT 
    'Free Agents API Query Test' as step,
    p.id as player_id,
    p.salary,
    u.gamer_tag_id,
    u.primary_position,
    u.secondary_position,
    u.console,
    u.avatar_url,
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
