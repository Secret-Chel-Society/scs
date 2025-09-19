-- Midnight Studios INTl - All rights reserved
-- Test waivers functionality

-- Test 1: Check if waivers table exists
SELECT 'Waivers Table Check' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if waiver_claims table exists
SELECT 'Waiver Claims Table Check' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waiver_claims' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 3: Check if waiver_priority table exists
SELECT 'Waiver Priority Table Check' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waiver_priority' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 4: Check RLS status for waivers tables
SELECT 'Waivers RLS Status' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('waivers', 'waiver_claims', 'waiver_priority')
AND schemaname = 'public';

-- Test 5: Check RLS policies for waivers
SELECT 'Waivers RLS Policies' as test_name;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('waivers', 'waiver_claims', 'waiver_priority')
ORDER BY tablename, policyname;

-- Test 6: Check permissions on waivers tables
SELECT 'Waivers Permissions Check' as test_name;
SELECT 
    has_table_privilege('authenticated', 'waivers', 'SELECT') as waivers_select,
    has_table_privilege('authenticated', 'waivers', 'INSERT') as waivers_insert,
    has_table_privilege('authenticated', 'waivers', 'UPDATE') as waivers_update,
    has_table_privilege('authenticated', 'waivers', 'DELETE') as waivers_delete,
    has_table_privilege('authenticated', 'waiver_claims', 'SELECT') as claims_select,
    has_table_privilege('authenticated', 'waiver_claims', 'INSERT') as claims_insert,
    has_table_privilege('authenticated', 'waiver_priority', 'SELECT') as priority_select;

-- Test 7: Try to create a test waiver
DO $$
DECLARE
    test_waiver_id UUID;
    test_player_id UUID;
    test_team_id UUID;
BEGIN
    -- Get a test player and team
    SELECT id INTO test_player_id FROM players LIMIT 1;
    SELECT id INTO test_team_id FROM teams LIMIT 1;
    
    IF test_player_id IS NOT NULL AND test_team_id IS NOT NULL THEN
        -- Try to insert a test waiver
        INSERT INTO waivers (player_id, waiving_team_id, status, claim_deadline, waived_at)
        VALUES (test_player_id, test_team_id, 'test', NOW() + interval '8 hours', NOW())
        RETURNING id INTO test_waiver_id;
        
        RAISE NOTICE 'Test waiver created successfully with ID: %', test_waiver_id;
        
        -- Clean up
        DELETE FROM waivers WHERE id = test_waiver_id;
        
        RAISE NOTICE 'Test waiver cleaned up successfully';
    ELSE
        RAISE NOTICE 'No test data available for waiver test';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Waivers functionality test failed: %', SQLERRM;
END $$;

-- Test 8: Check if notifications table exists (needed for waiver notifications)
SELECT 'Notifications Table Check' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
