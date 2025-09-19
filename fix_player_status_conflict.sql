-- =====================================================
-- FIX PLAYER STATUS CONFLICT
-- This fixes the issue where you're showing as FA but on a team
-- =====================================================

BEGIN;

-- Step 1: Identify the conflict
-- Players who have a team_id but status = 'free_agent'
SELECT 
    'CONFLICT FOUND: Players with team but FA status' as issue,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent';

-- Step 2: Fix the status conflict
-- Update players who have a team_id to have 'active' status
UPDATE players 
SET 
    status = 'active',
    manually_removed = false,
    manually_removed_at = NULL,
    manually_removed_by = NULL,
    updated_at = NOW()
WHERE team_id IS NOT NULL 
  AND status = 'free_agent';

-- Step 3: Fix the reverse conflict
-- Update players who have no team_id to have 'free_agent' status
UPDATE players 
SET 
    status = 'free_agent',
    updated_at = NOW()
WHERE team_id IS NULL 
  AND status = 'active';

-- Step 4: Fix manually removed players who still have team assignments
-- This handles the case where someone was manually removed but still shows on a team
UPDATE players 
SET 
    team_id = NULL,
    status = 'free_agent',
    updated_at = NOW()
WHERE manually_removed = true 
  AND team_id IS NOT NULL;

-- Step 5: Verify the fixes
SELECT 
    'After fix: Players with team and active status' as status_check,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'active'

UNION ALL

SELECT 
    'After fix: Players without team and free_agent status' as status_check,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'After fix: Remaining conflicts' as status_check,
    COUNT(*) as count
FROM players 
WHERE (team_id IS NOT NULL AND status = 'free_agent') 
   OR (team_id IS NULL AND status = 'active');

-- Step 6: Show your specific record after the fix
-- Replace 'your-email@example.com' with your actual email
SELECT 
    'YOUR RECORD AFTER FIX:' as info,
    p.id as player_id,
    p.user_id,
    p.team_id,
    p.status as player_status,
    p.role as player_role,
    p.manually_removed,
    u.gamer_tag_id,
    u.email,
    t.name as team_name
FROM players p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE u.email = 'your-email@example.com'  -- Replace with your actual email
   OR u.gamer_tag_id = 'your-gamer-tag';  -- Replace with your actual gamer tag

COMMIT;

-- =====================================================
-- EXPLANATION OF THE ISSUE
-- =====================================================

/*
THE PROBLEM:
You're experiencing a data inconsistency where:
1. You have a team_id (meaning you're assigned to a team)
2. But your status is 'free_agent' (meaning you should be a free agent)
3. This creates a conflict in the system

HOW THIS HAPPENS:
1. Player gets assigned to a team (team_id gets set)
2. Later, some process sets status to 'free_agent' without clearing team_id
3. Or someone manually removes you but doesn't clear the team assignment
4. Or there's a bug in the status update logic

THE FIX:
1. If you have a team_id, your status should be 'active'
2. If you don't have a team_id, your status should be 'free_agent'
3. If you're manually removed, you should have no team_id and status 'free_agent'

AFTER THE FIX:
- You'll show as 'active' status (because you have a team)
- You'll appear on your team's roster
- You won't appear in the free agent list
- Your roles (Owner/Admin/Player) will work correctly
*/
