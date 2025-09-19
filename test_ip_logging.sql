-- Midnight Studios INTl - All rights reserved
-- Test IP logging functionality

-- Test the log_ip_address function directly
DO $$
DECLARE
    test_user_id UUID;
    log_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        SELECT log_ip_address(
            test_user_id,
            '192.168.1.100',
            'test',
            'Test User Agent'
        ) INTO log_id;
        
        RAISE NOTICE 'IP logging test successful. Log ID: %', log_id;
        
        -- Check if the log was created
        IF EXISTS(SELECT 1 FROM ip_logs WHERE id = log_id) THEN
            RAISE NOTICE 'IP log entry created successfully';
        ELSE
            RAISE NOTICE 'IP log entry was NOT created';
        END IF;
        
        -- Check if user was updated
        IF EXISTS(SELECT 1 FROM users WHERE id = test_user_id AND last_login_ip = '192.168.1.100') THEN
            RAISE NOTICE 'User IP data updated successfully';
        ELSE
            RAISE NOTICE 'User IP data was NOT updated';
        END IF;
        
    ELSE
        RAISE NOTICE 'No users found to test with';
    END IF;
END $$;

-- Check current IP data
SELECT 'Current IP Data Summary' as test_name;
SELECT 
    COUNT(*) as total_users,
    COUNT(registration_ip) as users_with_registration_ip,
    COUNT(last_login_ip) as users_with_login_ip,
    COUNT(last_login_at) as users_with_login_time
FROM users;

-- Show recent IP logs
SELECT 'Recent IP Logs' as test_name;
SELECT 
    il.ip_address,
    il.action,
    il.created_at,
    u.email,
    u.gamer_tag_id
FROM ip_logs il
JOIN users u ON il.user_id = u.id
ORDER BY il.created_at DESC
LIMIT 10;
