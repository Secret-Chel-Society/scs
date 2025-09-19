-- Midnight Studios INTl - All rights reserved
-- Test seasons functionality

-- Test 1: Check if seasons table exists and has data
SELECT 'Seasons Table Check' as test_name;
SELECT 
    COUNT(*) as total_seasons,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_seasons
FROM seasons;

-- Test 2: Check permissions on seasons table
SELECT 'Seasons Permissions Check' as test_name;
SELECT 
    has_table_privilege('authenticated', 'seasons', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'seasons', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'seasons', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'seasons', 'DELETE') as can_delete;

-- Test 3: Check RLS status
SELECT 'Seasons RLS Status' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seasons'
AND schemaname = 'public';

-- Test 4: Check RLS policies
SELECT 'Seasons RLS Policies' as test_name;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'seasons'
ORDER BY policyname;

-- Test 5: Try to create a test season
DO $$
DECLARE
    test_season_id UUID;
BEGIN
    -- Try to insert a test season
    INSERT INTO seasons (name, start_date, end_date, is_active)
    VALUES ('Test Season', NOW(), NOW() + interval '1 year', false)
    RETURNING id INTO test_season_id;
    
    RAISE NOTICE 'Test season created successfully with ID: %', test_season_id;
    
    -- Try to update it
    UPDATE seasons 
    SET is_active = true 
    WHERE id = test_season_id;
    
    RAISE NOTICE 'Test season updated successfully';
    
    -- Clean up
    DELETE FROM seasons WHERE id = test_season_id;
    
    RAISE NOTICE 'Test season cleaned up successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Seasons functionality test failed: %', SQLERRM;
END $$;

-- Test 6: Check system_settings permissions
SELECT 'System Settings Permissions Check' as test_name;
SELECT 
    has_table_privilege('authenticated', 'system_settings', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'system_settings', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'system_settings', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'system_settings', 'DELETE') as can_delete;

-- Test 7: Try to update system_settings
DO $$
BEGIN
    -- Try to update system_settings
    UPDATE system_settings 
    SET value = 'test_value' 
    WHERE key = 'test_key';
    
    RAISE NOTICE 'System settings update test successful';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'System settings update test failed: %', SQLERRM;
END $$;
