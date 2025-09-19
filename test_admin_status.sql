-- Midnight Studios INTl - All rights reserved
-- Test script to check admin status and permissions

-- 1. Check if user_roles table exists and has data
SELECT 'User Roles Table Check' as test_name;
SELECT 
    COUNT(*) as total_roles,
    COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_roles
FROM user_roles;

-- 2. Check specific admin users
SELECT 'Admin Users Check' as test_name;
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
    'zacha@midnightstudios.com',
    'admin@secretchelsociety.com', 
    'zacha@secretchelsociety.com'
)
ORDER BY u.email;

-- 3. Check system_settings permissions
SELECT 'System Settings Check' as test_name;
SELECT 
    key,
    value,
    updated_at
FROM system_settings 
WHERE key IN ('bidding_enabled', 'current_season')
ORDER BY key;

-- 4. Check if log_ip_address function exists
SELECT 'IP Tracking Function Check' as test_name;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'log_ip_address') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as function_status;

-- 5. Check table permissions
SELECT 'Table Permissions Check' as test_name;
SELECT 
    schemaname,
    tablename,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE tablename IN ('system_settings', 'user_roles', 'seasons', 'ip_logs')
AND schemaname = 'public';

-- 6. Check RLS policies
SELECT 'RLS Policies Check' as test_name;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('system_settings', 'user_roles', 'seasons', 'ip_logs')
ORDER BY tablename, policyname;
