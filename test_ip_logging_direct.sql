-- Midnight Studios INTl - All rights reserved
-- Direct test of IP logging functionality

-- Test 1: Check if we can insert into ip_logs directly
DO $$
DECLARE
    test_user_id UUID;
    log_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user ID: %', test_user_id;
        
        -- Try direct insert into ip_logs
        BEGIN
            INSERT INTO ip_logs (user_id, ip_address, action, user_agent, created_at)
            VALUES (test_user_id, '192.168.1.200', 'test_direct', 'Direct Test User Agent', NOW())
            RETURNING id INTO log_id;
            
            RAISE NOTICE 'Direct insert successful. Log ID: %', log_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Direct insert failed: %', SQLERRM;
        END;
        
        -- Try updating users table directly
        BEGIN
            UPDATE users 
            SET last_login_ip = '192.168.1.200', last_login_at = NOW()
            WHERE id = test_user_id;
            
            RAISE NOTICE 'User update successful';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'User update failed: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'No users found to test with';
    END IF;
END $$;

-- Test 2: Check current permissions
SELECT 'Permission Check' as test_name;
SELECT 
    has_table_privilege('authenticated', 'ip_logs', 'INSERT') as can_insert_ip_logs,
    has_table_privilege('authenticated', 'users', 'UPDATE') as can_update_users,
    has_table_privilege('service_role', 'ip_logs', 'INSERT') as service_can_insert_ip_logs,
    has_table_privilege('service_role', 'users', 'UPDATE') as service_can_update_users;

-- Test 3: Check RLS status
SELECT 'RLS Status Check' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('ip_logs', 'users')
AND schemaname = 'public';

-- Test 4: Check if function works
DO $$
DECLARE
    test_user_id UUID;
    log_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        BEGIN
            SELECT log_ip_address(
                test_user_id,
                '192.168.1.300',
                'test_function',
                'Function Test User Agent'
            ) INTO log_id;
            
            RAISE NOTICE 'Function test successful. Log ID: %', log_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Function test failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- Test 5: Show current data
SELECT 'Current IP Data' as test_name;
SELECT 
    COUNT(*) as total_ip_logs,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM ip_logs;

-- Show sample users with IP data
SELECT 'Sample User IP Data' as test_name;
SELECT 
    email,
    gamer_tag_id,
    registration_ip,
    last_login_ip,
    last_login_at
FROM users 
WHERE registration_ip IS NOT NULL OR last_login_ip IS NOT NULL
LIMIT 5;
