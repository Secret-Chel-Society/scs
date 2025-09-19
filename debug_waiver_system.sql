-- Debug waiver system issues
-- Run this in your Supabase SQL Editor to see what's wrong

-- 1. Check if tables exist and have data
SELECT 'waivers' as table_name, COUNT(*) as record_count FROM waivers
UNION ALL
SELECT 'waiver_claims' as table_name, COUNT(*) as record_count FROM waiver_claims  
UNION ALL
SELECT 'waiver_priority' as table_name, COUNT(*) as record_count FROM waiver_priority
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'players' as table_name, COUNT(*) as record_count FROM players;

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('waivers', 'waiver_claims', 'waiver_priority')
ORDER BY tablename, policyname;

-- 3. Check table permissions
SELECT 
    t.table_name,
    t.privilege_type,
    t.grantee
FROM information_schema.table_privileges t
WHERE t.table_name IN ('waivers', 'waiver_claims', 'waiver_priority')
AND t.grantee = 'authenticated'
ORDER BY t.table_name, t.privilege_type;

-- 4. Check if waiver_priority has entries for all teams
SELECT 
    t.id as team_id,
    t.name as team_name,
    wp.priority,
    wp.id as priority_id
FROM teams t
LEFT JOIN waiver_priority wp ON t.id = wp.team_id
ORDER BY t.name;

-- 5. Test a simple waiver insert (this will show the exact error)
DO $$
DECLARE
    test_player_id UUID;
    test_team_id UUID;
    test_waiver_id UUID;
BEGIN
    -- Get a real player and team
    SELECT id INTO test_player_id FROM players LIMIT 1;
    SELECT id INTO test_team_id FROM teams LIMIT 1;
    
    IF test_player_id IS NULL THEN
        RAISE NOTICE 'No players found in database';
        RETURN;
    END IF;
    
    IF test_team_id IS NULL THEN
        RAISE NOTICE 'No teams found in database';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with player_id: %, team_id: %', test_player_id, test_team_id;
    
    -- Try to insert a waiver
    INSERT INTO waivers (player_id, waiving_team_id, claim_deadline, status)
    VALUES (test_player_id, test_team_id, NOW() + INTERVAL '8 hours', 'active')
    RETURNING id INTO test_waiver_id;
    
    RAISE NOTICE 'Waiver created successfully with ID: %', test_waiver_id;
    
    -- Clean up
    DELETE FROM waivers WHERE id = test_waiver_id;
    RAISE NOTICE 'Test waiver cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating waiver: %', SQLERRM;
    RAISE NOTICE 'Error code: %', SQLSTATE;
END
$$;
