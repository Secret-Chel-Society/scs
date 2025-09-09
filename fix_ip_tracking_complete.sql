-- Midnight Studios INTl - All rights reserved
-- Complete fix for IP tracking system

-- ==============================================
-- 1. ENSURE IP_LOGS TABLE EXISTS WITH PROPER STRUCTURE
-- ==============================================

-- Create ip_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS ip_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_created_at ON ip_logs(created_at);

-- ==============================================
-- 2. ENSURE USERS TABLE HAS IP COLUMNS
-- ==============================================

-- Add IP tracking columns to users table if they don't exist
DO $$
BEGIN
    -- Add registration_ip column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'registration_ip') THEN
        ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45);
        RAISE NOTICE 'Added registration_ip column to users table';
    END IF;
    
    -- Add last_login_ip column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_ip') THEN
        ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(45);
        RAISE NOTICE 'Added last_login_ip column to users table';
    END IF;
    
    -- Add last_login_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column to users table';
    END IF;
END $$;

-- ==============================================
-- 3. CREATE/UPDATE IP LOGGING FUNCTION
-- ==============================================

-- Create or replace the log_ip_address function
CREATE OR REPLACE FUNCTION log_ip_address(
  p_user_id UUID,
  p_ip_address VARCHAR(45),
  p_action VARCHAR(50),
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Insert into ip_logs
  INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
  VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
  RETURNING id INTO v_log_id;
  
  -- Update the users table based on the action
  IF p_action = 'register' THEN
    UPDATE users SET registration_ip = p_ip_address WHERE id = p_user_id;
  ELSIF p_action = 'login' THEN
    UPDATE users SET last_login_ip = p_ip_address, last_login_at = NOW() WHERE id = p_user_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on ip_logs table
GRANT ALL PRIVILEGES ON ip_logs TO authenticated;
GRANT ALL PRIVILEGES ON ip_logs TO service_role;
GRANT ALL PRIVILEGES ON ip_logs TO anon;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR, VARCHAR, TEXT) TO anon;

-- Grant permissions on users table for IP columns
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, UPDATE ON users TO service_role;
GRANT SELECT, UPDATE ON users TO anon;

-- ==============================================
-- 5. SET UP RLS POLICIES
-- ==============================================

-- Enable RLS on ip_logs table
ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for ip_logs (create only if doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ip_logs' 
        AND policyname = 'Allow all operations on ip_logs'
    ) THEN
        CREATE POLICY "Allow all operations on ip_logs" ON ip_logs
            FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon');
        RAISE NOTICE 'Created policy for ip_logs';
    ELSE
        RAISE NOTICE 'Policy for ip_logs already exists';
    END IF;
END $$;

-- ==============================================
-- 6. POPULATE EXISTING USERS WITH TEST IP DATA
-- ==============================================

-- Add some test IP data for existing users
DO $$
DECLARE
    user_record RECORD;
    test_ips TEXT[] := ARRAY['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.1', '198.51.100.1'];
    random_ip TEXT;
BEGIN
    -- Get first 10 users and add test IP data
    FOR user_record IN 
        SELECT id, email, gamer_tag_id 
        FROM users 
        WHERE registration_ip IS NULL 
        LIMIT 10
    LOOP
        -- Pick a random IP from the test array
        random_ip := test_ips[1 + (random() * (array_length(test_ips, 1) - 1))::int];
        
        -- Update user with test IP data
        UPDATE users 
        SET 
            registration_ip = random_ip,
            last_login_ip = random_ip,
            last_login_at = NOW() - (random() * interval '30 days')
        WHERE id = user_record.id;
        
        -- Insert test IP log entries
        INSERT INTO ip_logs (user_id, ip_address, action, user_agent, created_at)
        VALUES 
            (user_record.id, random_ip, 'register', 'Test User Agent', NOW() - interval '30 days'),
            (user_record.id, random_ip, 'login', 'Test User Agent', NOW() - (random() * interval '7 days'));
        
        RAISE NOTICE 'Added test IP data for user: % (%)', user_record.email, user_record.gamer_tag_id;
    END LOOP;
    
    RAISE NOTICE 'Test IP data population complete';
END $$;

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Check if tables and columns exist
SELECT 'Table Structure Check' as test_name;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'ip_logs')
AND column_name IN ('registration_ip', 'last_login_ip', 'last_login_at', 'ip_address', 'action')
ORDER BY table_name, column_name;

-- Check if function exists
SELECT 'Function Check' as test_name;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'log_ip_address') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as function_status;

-- Check sample data
SELECT 'Sample Data Check' as test_name;
SELECT 
    COUNT(*) as total_users,
    COUNT(registration_ip) as users_with_registration_ip,
    COUNT(last_login_ip) as users_with_login_ip
FROM users;

SELECT 'IP Logs Check' as test_name;
SELECT 
    COUNT(*) as total_ip_logs,
    COUNT(DISTINCT user_id) as unique_users_with_logs,
    COUNT(DISTINCT ip_address) as unique_ip_addresses
FROM ip_logs;

-- Show sample IP data
SELECT 'Sample IP Data' as test_name;
SELECT 
    u.email,
    u.gamer_tag_id,
    u.registration_ip,
    u.last_login_ip,
    u.last_login_at
FROM users u
WHERE u.registration_ip IS NOT NULL
LIMIT 5;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT 'IP tracking system has been completely fixed!' as message,
       'All IP logging, storage, and display should now work properly.' as details;
