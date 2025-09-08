-- =====================================================
-- DATABASE SYNC TEST
-- Check if the fixes have been applied
-- =====================================================

-- 1. Check if gamer_tag field exists in users table
SELECT 
    'GAMER_TAG FIELD CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'gamer_tag'
        ) 
        THEN '✅ gamer_tag field EXISTS' 
        ELSE '❌ gamer_tag field MISSING' 
    END as result;

-- 2. Check if gamer_tag_id field exists in users table
SELECT 
    'GAMER_TAG_ID FIELD CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'gamer_tag_id'
        ) 
        THEN '✅ gamer_tag_id field EXISTS' 
        ELSE '❌ gamer_tag_id field MISSING' 
    END as result;

-- 3. Check if missing tables exist
SELECT 
    'MISSING TABLES CHECK' as test,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM (VALUES 
    ('injury_reserves'),
    ('lineups'), 
    ('tokens'),
    ('discord_users'),
    ('player_bidding')
) AS t(table_name);

-- 4. Check if player_bidding has user_id column
SELECT 
    'PLAYER_BIDDING USER_ID CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'player_bidding' AND column_name = 'user_id'
        ) 
        THEN '✅ user_id column EXISTS' 
        ELSE '❌ user_id column MISSING' 
    END as result;

-- 5. Check player status conflicts
SELECT 
    'PLAYER STATUS CONFLICTS' as test,
    'Players with team but FA status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NOT NULL AND status = 'free_agent'

UNION ALL

SELECT 
    'PLAYER STATUS CONFLICTS' as test,
    'Players without team but active status' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE team_id IS NULL AND status = 'active'

UNION ALL

SELECT 
    'PLAYER STATUS CONFLICTS' as test,
    'Manually removed but still on team' as conflict_type,
    COUNT(*) as count
FROM players 
WHERE manually_removed = true AND team_id IS NOT NULL;

-- 6. Test a sample query that should work
SELECT 
    'SAMPLE QUERY TEST' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users LIMIT 1
        ) 
        THEN '✅ Users table accessible' 
        ELSE '❌ Users table not accessible' 
    END as result;

-- 7. Check if we can query both gamer_tag fields (if they exist)
DO $$ 
BEGIN
    -- Test gamer_tag field
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gamer_tag'
    ) THEN
        RAISE NOTICE '✅ gamer_tag field is accessible';
    ELSE
        RAISE NOTICE '❌ gamer_tag field is NOT accessible';
    END IF;
    
    -- Test gamer_tag_id field  
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gamer_tag_id'
    ) THEN
        RAISE NOTICE '✅ gamer_tag_id field is accessible';
    ELSE
        RAISE NOTICE '❌ gamer_tag_id field is NOT accessible';
    END IF;
END $$;
