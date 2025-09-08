-- =====================================================
-- SITE-WIDE PLAYER STATUS AUDIT
-- Comprehensive check for all player status conflicts
-- =====================================================

-- =====================================================
-- 1. OVERVIEW OF ALL STATUS CONFLICTS
-- =====================================================

SELECT 
    '=== SITE-WIDE PLAYER STATUS AUDIT ===' as audit_section,
    '' as details;

-- Count all players by status
SELECT 
    'PLAYER STATUS BREAKDOWN' as category,
    status,
    COUNT(*) as count,
    CASE 
        WHEN status = 'active' THEN 'Players on teams'
        WHEN status = 'free_agent' THEN 'Players without teams'
        WHEN status = 'waived' THEN 'Players on waivers'
        WHEN status = 'retired' THEN 'Retired players'
        ELSE 'Other status'
    END as description
FROM players 
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 2. IDENTIFY ALL CONFLICTS
-- =====================================================

SELECT 
    '=== CONFLICT ANALYSIS ===' as audit_section,
    '' as details;

-- Conflict 1: Players with team but free_agent status
SELECT 
    'CONFLICT 1: Players with team but FA status' as conflict_type,
    COUNT(*) as affected_players,
    'These players are assigned to teams but marked as free agents' as description
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent';

-- Conflict 2: Players without team but active status  
SELECT 
    'CONFLICT 2: Players without team but active status' as conflict_type,
    COUNT(*) as affected_players,
    'These players are marked as active but have no team assignment' as description
FROM players 
WHERE team_id IS NULL AND status = 'active';

-- Conflict 3: Manually removed players still on teams
SELECT 
    'CONFLICT 3: Manually removed but still on team' as conflict_type,
    COUNT(*) as affected_players,
    'These players were manually removed but still have team assignments' as description
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- =====================================================
-- 3. DETAILED CONFLICT REPORTS
-- =====================================================

-- Show all players with team but free_agent status
SELECT 
    'DETAILED CONFLICT 1: Players with team but FA status' as report_type,
    '' as separator;

SELECT 
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status,
    p.role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    p.updated_at,
    u.gamer_tag_id,
    u.email,
    t.name as team_name,
    'NEEDS FIX: Set status to active' as recommended_action
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.team_id IS NOT NULL AND p.status = 'free_agent'
ORDER BY p.updated_at DESC;

-- Show all players without team but active status
SELECT 
    'DETAILED CONFLICT 2: Players without team but active status' as report_type,
    '' as separator;

SELECT 
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status,
    p.role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    p.updated_at,
    u.gamer_tag_id,
    u.email,
    'NEEDS FIX: Set status to free_agent' as recommended_action
FROM players p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.team_id IS NULL AND p.status = 'active'
ORDER BY p.updated_at DESC;

-- Show manually removed players still on teams
SELECT 
    'DETAILED CONFLICT 3: Manually removed but still on team' as report_type,
    '' as separator;

SELECT 
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status,
    p.role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    p.updated_at,
    u.gamer_tag_id,
    u.email,
    t.name as team_name,
    'NEEDS FIX: Clear team_id and set status to free_agent' as recommended_action
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.manually_removed = true AND p.team_id IS NOT NULL
ORDER BY p.updated_at DESC;

-- =====================================================
-- 4. TEAM-BY-TEAM ANALYSIS
-- =====================================================

SELECT 
    '=== TEAM-BY-TEAM ANALYSIS ===' as audit_section,
    '' as details;

-- Show team roster counts and conflicts
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(p.id) as total_players,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_players,
    COUNT(CASE WHEN p.status = 'free_agent' THEN 1 END) as fa_players,
    COUNT(CASE WHEN p.manually_removed = true THEN 1 END) as manually_removed,
    COUNT(CASE WHEN p.team_id IS NOT NULL AND p.status = 'free_agent' THEN 1 END) as conflicts
FROM teams t
LEFT JOIN players p ON t.id = p.team_id
GROUP BY t.id, t.name
HAVING COUNT(p.id) > 0
ORDER BY conflicts DESC, total_players DESC;

-- =====================================================
-- 5. ROLE ANALYSIS
-- =====================================================

SELECT 
    '=== ROLE ANALYSIS ===' as audit_section,
    '' as details;

-- Show conflicts by role
SELECT 
    p.role,
    COUNT(*) as total_players,
    COUNT(CASE WHEN p.team_id IS NOT NULL AND p.status = 'free_agent' THEN 1 END) as team_but_fa,
    COUNT(CASE WHEN p.team_id IS NULL AND p.status = 'active' THEN 1 END) as no_team_but_active,
    COUNT(CASE WHEN p.manually_removed = true AND p.team_id IS NOT NULL THEN 1 END) as removed_but_on_team
FROM players p
GROUP BY p.role
ORDER BY total_players DESC;

-- =====================================================
-- 6. RECENT CHANGES ANALYSIS
-- =====================================================

SELECT 
    '=== RECENT CHANGES ANALYSIS ===' as audit_section,
    '' as details;

-- Show players with recent status changes
SELECT 
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status,
    p.role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    p.updated_at,
    u.gamer_tag_id,
    u.email,
    t.name as team_name,
    CASE 
        WHEN p.team_id IS NOT NULL AND p.status = 'free_agent' THEN 'CONFLICT: Has team but FA status'
        WHEN p.team_id IS NULL AND p.status = 'active' THEN 'CONFLICT: No team but active status'
        WHEN p.manually_removed = true AND p.team_id IS NOT NULL THEN 'CONFLICT: Removed but still on team'
        ELSE 'OK'
    END as status_check
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.updated_at > NOW() - INTERVAL '30 days'
ORDER BY p.updated_at DESC;

-- =====================================================
-- 7. SUMMARY AND RECOMMENDATIONS
-- =====================================================

SELECT 
    '=== SUMMARY AND RECOMMENDATIONS ===' as audit_section,
    '' as details;

-- Final summary
SELECT 
    'TOTAL CONFLICTS FOUND' as summary_type,
    (
        (SELECT COUNT(*) FROM players WHERE team_id IS NOT NULL AND status = 'free_agent') +
        (SELECT COUNT(*) FROM players WHERE team_id IS NULL AND status = 'active') +
        (SELECT COUNT(*) FROM players WHERE manually_removed = true AND team_id IS NOT NULL)
    ) as total_conflicts,
    'Players need status corrections' as description;

-- Recommendations
SELECT 
    'RECOMMENDATIONS' as section,
    '1. Run fix_player_status_conflict.sql to resolve all conflicts' as step_1,
    '2. Monitor player status changes to prevent future conflicts' as step_2,
    '3. Review admin actions that modify player status' as step_3,
    '4. Add validation to prevent status/team_id mismatches' as step_4;
