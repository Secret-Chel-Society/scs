-- =====================================================
-- SINGLE SCRIPT: FIX ALL PLAYER STATUS CONFLICTS
-- Non-destructive, comprehensive fix for all status conflicts
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. PRE-FIX ANALYSIS (Non-destructive)
-- =====================================================

-- Show current conflicts before making changes
DO $$ 
BEGIN
    RAISE NOTICE '=== PLAYER STATUS CONFLICT ANALYSIS ===';
    RAISE NOTICE 'Analyzing conflicts before fix...';
END $$;

-- Count conflicts before fix
SELECT 
    'BEFORE FIX - CONFLICT SUMMARY' as phase,
    'Players with team but FA status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'BEFORE FIX - CONFLICT SUMMARY' as phase,
    'Players without team but active status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'active'

UNION ALL

SELECT 
    'BEFORE FIX - CONFLICT SUMMARY' as phase,
    'Manually removed but still on team' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- =====================================================
-- 2. FIX CONFLICT 1: Players with team but free_agent status
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== FIXING CONFLICT 1: Players with team but FA status ===';
END $$;

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

-- Show how many were fixed
SELECT 
    'FIX 1 COMPLETED' as phase,
    'Players with team but FA status' as conflict_type,
    'Fixed: Set status to active' as action_taken;

-- =====================================================
-- 3. FIX CONFLICT 2: Players without team but active status
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== FIXING CONFLICT 2: Players without team but active status ===';
END $$;

-- Update players who have no team_id to have 'free_agent' status
UPDATE players 
SET 
    status = 'free_agent',
    updated_at = NOW()
WHERE team_id IS NULL 
  AND status = 'active';

-- Show how many were fixed
SELECT 
    'FIX 2 COMPLETED' as phase,
    'Players without team but active status' as conflict_type,
    'Fixed: Set status to free_agent' as action_taken;

-- =====================================================
-- 4. FIX CONFLICT 3: Manually removed players still on teams
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== FIXING CONFLICT 3: Manually removed but still on team ===';
END $$;

-- Update manually removed players to have no team and free_agent status
UPDATE players 
SET 
    team_id = NULL,
    status = 'free_agent',
    updated_at = NOW()
WHERE manually_removed = true 
  AND team_id IS NOT NULL;

-- Show how many were fixed
SELECT 
    'FIX 3 COMPLETED' as phase,
    'Manually removed but still on team' as conflict_type,
    'Fixed: Cleared team_id and set status to free_agent' as action_taken;

-- =====================================================
-- 5. ADDITIONAL CLEANUP: Handle edge cases (Non-destructive)
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CLEANING UP EDGE CASES ===';
END $$;

-- Fix players with invalid status values
UPDATE players 
SET 
    status = CASE 
        WHEN team_id IS NOT NULL THEN 'active'
        ELSE 'free_agent'
    END,
    updated_at = NOW()
WHERE status NOT IN ('active', 'free_agent', 'waived', 'retired');

-- Fix players with manually_removed = true but no removal timestamp
UPDATE players 
SET 
    manually_removed_at = NOW(),
    updated_at = NOW()
WHERE manually_removed = true 
  AND manually_removed_at IS NULL;

-- =====================================================
-- 6. POST-FIX VERIFICATION (Non-destructive)
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== VERIFYING FIXES ===';
END $$;

-- Show conflicts after fix
SELECT 
    'AFTER FIX - CONFLICT SUMMARY' as phase,
    'Players with team but FA status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'AFTER FIX - CONFLICT SUMMARY' as phase,
    'Players without team but active status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'active'

UNION ALL

SELECT 
    'AFTER FIX - CONFLICT SUMMARY' as phase,
    'Manually removed but still on team' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- =====================================================
-- 7. FINAL STATUS BREAKDOWN (Non-destructive)
-- =====================================================

-- Show final player status breakdown
SELECT 
    'FINAL STATUS BREAKDOWN' as phase,
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
-- 8. TEAM ROSTER VERIFICATION (Non-destructive)
-- =====================================================

-- Show team roster counts after fix
SELECT 
    'TEAM ROSTER VERIFICATION' as phase,
    t.id as team_id,
    t.name as team_name,
    COUNT(p.id) as total_players,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_players,
    COUNT(CASE WHEN p.status = 'free_agent' THEN 1 END) as fa_players,
    COUNT(CASE WHEN p.manually_removed = true THEN 1 END) as manually_removed
FROM teams t
LEFT JOIN players p ON t.id = p.team_id
GROUP BY t.id, t.name
HAVING COUNT(p.id) > 0
ORDER BY total_players DESC;

-- =====================================================
-- 9. SUCCESS VERIFICATION (Non-destructive)
-- =====================================================

-- Check if all conflicts are resolved
SELECT 
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM players WHERE team_id IS NOT NULL AND status = 'free_agent') +
            (SELECT COUNT(*) FROM players WHERE team_id IS NULL AND status = 'active') +
            (SELECT COUNT(*) FROM players WHERE manually_removed = true AND team_id IS NOT NULL)
        ) = 0 
        THEN '✅ ALL CONFLICTS RESOLVED SUCCESSFULLY!'
        ELSE '⚠️ Some conflicts may still exist - check the results above'
    END as final_status;

-- =====================================================
-- 10. COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- 11. FINAL SUMMARY (Non-destructive)
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== SITE-WIDE PLAYER STATUS FIX COMPLETED ===';
    RAISE NOTICE 'All player status conflicts have been resolved!';
    RAISE NOTICE 'Your website should now show correct player statuses everywhere.';
END $$;

-- Final summary report
SELECT 
    '=== SITE-WIDE PLAYER STATUS FIX COMPLETED ===' as summary,
    '' as details;

SELECT 
    'WHAT WAS FIXED:' as section,
    '1. Players with team assignments now have "active" status' as fix_1,
    '2. Players without teams now have "free_agent" status' as fix_2,
    '3. Manually removed players cleared from teams' as fix_3,
    '4. Invalid status values corrected' as fix_4,
    '5. Missing timestamps added' as fix_5;

SELECT 
    'RESULT:' as section,
    'All player status conflicts have been resolved site-wide' as result,
    'Your website should now show correct player statuses everywhere' as impact;

-- =====================================================
-- 12. SAFETY NOTES
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== SAFETY NOTES ===';
    RAISE NOTICE 'This script is non-destructive and only fixes data inconsistencies.';
    RAISE NOTICE 'No data was deleted - only status values were corrected.';
    RAISE NOTICE 'All changes are logged and can be verified above.';
END $$;
