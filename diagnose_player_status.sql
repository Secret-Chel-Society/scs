-- =====================================================
-- PLAYER STATUS DIAGNOSTIC SCRIPT
-- This will help identify why you're showing as FA but on a team
-- =====================================================

-- Check your player record and status
SELECT 
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status as player_status,
    p.role as player_role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    p.created_at as player_created,
    p.updated_at as player_updated,
    u.gamer_tag_id,
    u.email,
    t.name as team_name,
    t.id as team_id_check
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE u.email = 'your-email@example.com'  -- Replace with your actual email
   OR u.gamer_tag_id = 'your-gamer-tag'   -- Replace with your actual gamer tag
ORDER BY p.updated_at DESC;

-- Check your user roles
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    u.gamer_tag_id,
    u.email
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'your-email@example.com'  -- Replace with your actual email
   OR u.gamer_tag_id = 'your-gamer-tag'   -- Replace with your actual gamer tag
ORDER BY ur.created_at DESC;

-- Check for any recent team assignment changes
SELECT 
    p.id,
    p.user_id,
    p.team_id,
    p.status,
    p.role,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    u.gamer_tag_id,
    t.name as team_name
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.manually_removed = true
   OR p.status = 'free_agent'
   OR p.team_id IS NULL
ORDER BY p.updated_at DESC
LIMIT 10;

-- Check the logic that determines free agent status
-- This shows the exact conditions that make someone a free agent
SELECT 
    'Players with team_id but status = free_agent' as issue_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'Players with no team_id but status = active' as issue_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'active'

UNION ALL

SELECT 
    'Players manually removed but still on team' as issue_type,
    COUNT(*) as count
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- Check recent player status changes (if you have audit logs)
-- This would show what changed your status recently
SELECT 
    p.id,
    p.user_id,
    p.team_id,
    p.status,
    p.manually_removed,
    p.manually_removed_at,
    p.manually_removed_by,
    u.gamer_tag_id,
    t.name as team_name,
    p.updated_at
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.updated_at > NOW() - INTERVAL '7 days'  -- Last 7 days
ORDER BY p.updated_at DESC;
