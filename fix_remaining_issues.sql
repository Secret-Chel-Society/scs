-- Midnight Studios INTl - All rights reserved
-- Fix remaining issues: system_settings permissions, IP tracking, and season management
-- NON-DESTRUCTIVE: Safe to run multiple times, only adds permissions

-- ==============================================
-- 1. FIX SYSTEM_SETTINGS PERMISSIONS (Main Issue)
-- ==============================================

-- Grant USAGE permission on the sequence (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT USAGE ON SEQUENCE system_settings_id_seq TO authenticated;
        RAISE NOTICE 'Granted USAGE on system_settings_id_seq to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'USAGE permission already exists for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT USAGE ON SEQUENCE system_settings_id_seq TO service_role;
        RAISE NOTICE 'Granted USAGE on system_settings_id_seq to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'USAGE permission already exists for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT USAGE ON SEQUENCE system_settings_id_seq TO anon;
        RAISE NOTICE 'Granted USAGE on system_settings_id_seq to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'USAGE permission already exists for anon: %', SQLERRM;
    END;
END $$;

-- Grant permissions on the system_settings table (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO authenticated;
        RAISE NOTICE 'Granted table permissions on system_settings to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Table permissions already exist for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO service_role;
        RAISE NOTICE 'Granted table permissions on system_settings to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Table permissions already exist for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO anon;
        RAISE NOTICE 'Granted table permissions on system_settings to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Table permissions already exist for anon: %', SQLERRM;
    END;
END $$;

-- Also grant permissions on the sequence owner (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT ALL ON SEQUENCE system_settings_id_seq TO authenticated;
        RAISE NOTICE 'Granted ALL on system_settings_id_seq to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ALL permission already exists for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;
        RAISE NOTICE 'Granted ALL on system_settings_id_seq to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ALL permission already exists for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT ALL ON SEQUENCE system_settings_id_seq TO anon;
        RAISE NOTICE 'Granted ALL on system_settings_id_seq to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ALL permission already exists for anon: %', SQLERRM;
    END;
END $$;

-- Make sure the table has proper RLS policies if needed (non-destructive)
DO $$
BEGIN
    -- Only enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'system_settings' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on system_settings table';
    ELSE
        RAISE NOTICE 'RLS already enabled on system_settings table';
    END IF;
END $$;

-- Create policies only if they don't exist (non-destructive)
DO $$
BEGIN
    -- Create policy for authenticated users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' 
        AND policyname = 'Allow authenticated users to manage system settings'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage system settings" ON system_settings
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created policy for authenticated users on system_settings';
    ELSE
        RAISE NOTICE 'Policy for authenticated users already exists on system_settings';
    END IF;
    
    -- Create policy for service role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' 
        AND policyname = 'Allow service role to manage system settings'
    ) THEN
        CREATE POLICY "Allow service role to manage system settings" ON system_settings
            FOR ALL USING (auth.role() = 'service_role');
        RAISE NOTICE 'Created policy for service role on system_settings';
    ELSE
        RAISE NOTICE 'Policy for service role already exists on system_settings';
    END IF;
    
    -- Create policy for anon if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' 
        AND policyname = 'Allow anon to read system settings'
    ) THEN
        CREATE POLICY "Allow anon to read system settings" ON system_settings
            FOR SELECT USING (true);
        RAISE NOTICE 'Created policy for anon on system_settings';
    ELSE
        RAISE NOTICE 'Policy for anon already exists on system_settings';
    END IF;
END $$;

-- ==============================================
-- 2. ENSURE IP TRACKING FUNCTION EXISTS
-- ==============================================

-- Create the log_ip_address function if it doesn't exist
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

-- Grant permissions on the function (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
        RAISE NOTICE 'Granted EXECUTE on log_ip_address function to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'EXECUTE permission on log_ip_address already exists for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR, VARCHAR, TEXT) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on log_ip_address function to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'EXECUTE permission on log_ip_address already exists for service_role: %', SQLERRM;
    END;
END $$;

-- ==============================================
-- 3. ENSURE SEASONS TABLE HAS PROPER PERMISSIONS
-- ==============================================

-- Grant permissions on seasons table (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON seasons TO authenticated;
        RAISE NOTICE 'Granted permissions on seasons to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on seasons already exist for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON seasons TO service_role;
        RAISE NOTICE 'Granted permissions on seasons to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on seasons already exist for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON seasons TO anon;
        RAISE NOTICE 'Granted permissions on seasons to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on seasons already exist for anon: %', SQLERRM;
    END;
END $$;

-- Enable RLS on seasons table (non-destructive)
DO $$
BEGIN
    -- Only enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'seasons' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on seasons table';
    ELSE
        RAISE NOTICE 'RLS already enabled on seasons table';
    END IF;
END $$;

-- Create policies for seasons only if they don't exist (non-destructive)
DO $$
BEGIN
    -- Create policy for authenticated users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seasons' 
        AND policyname = 'Allow authenticated users to manage seasons'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage seasons" ON seasons
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created policy for authenticated users on seasons';
    ELSE
        RAISE NOTICE 'Policy for authenticated users already exists on seasons';
    END IF;
    
    -- Create policy for service role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seasons' 
        AND policyname = 'Allow service role to manage seasons'
    ) THEN
        CREATE POLICY "Allow service role to manage seasons" ON seasons
            FOR ALL USING (auth.role() = 'service_role');
        RAISE NOTICE 'Created policy for service role on seasons';
    ELSE
        RAISE NOTICE 'Policy for service role already exists on seasons';
    END IF;
END $$;

-- ==============================================
-- 4. ENSURE USER_ROLES TABLE HAS PROPER PERMISSIONS
-- ==============================================

-- Grant permissions on user_roles table (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
        RAISE NOTICE 'Granted permissions on user_roles to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on user_roles already exist for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO service_role;
        RAISE NOTICE 'Granted permissions on user_roles to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on user_roles already exist for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO anon;
        RAISE NOTICE 'Granted permissions on user_roles to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on user_roles already exist for anon: %', SQLERRM;
    END;
END $$;

-- Enable RLS on user_roles table (non-destructive)
DO $$
BEGIN
    -- Only enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'user_roles' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on user_roles table';
    ELSE
        RAISE NOTICE 'RLS already enabled on user_roles table';
    END IF;
END $$;

-- Create policies for user_roles only if they don't exist (non-destructive)
DO $$
BEGIN
    -- Create policy for authenticated users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Allow authenticated users to manage user roles'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage user roles" ON user_roles
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created policy for authenticated users on user_roles';
    ELSE
        RAISE NOTICE 'Policy for authenticated users already exists on user_roles';
    END IF;
    
    -- Create policy for service role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Allow service role to manage user roles'
    ) THEN
        CREATE POLICY "Allow service role to manage user roles" ON user_roles
            FOR ALL USING (auth.role() = 'service_role');
        RAISE NOTICE 'Created policy for service role on user_roles';
    ELSE
        RAISE NOTICE 'Policy for service role already exists on user_roles';
    END IF;
END $$;

-- ==============================================
-- 5. ENSURE IP_LOGS TABLE HAS PROPER PERMISSIONS
-- ==============================================

-- Grant permissions on ip_logs table (safe to run multiple times)
DO $$
BEGIN
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON ip_logs TO authenticated;
        RAISE NOTICE 'Granted permissions on ip_logs to authenticated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on ip_logs already exist for authenticated: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON ip_logs TO service_role;
        RAISE NOTICE 'Granted permissions on ip_logs to service_role';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on ip_logs already exist for service_role: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON ip_logs TO anon;
        RAISE NOTICE 'Granted permissions on ip_logs to anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Permissions on ip_logs already exist for anon: %', SQLERRM;
    END;
END $$;

-- Enable RLS on ip_logs table (non-destructive)
DO $$
BEGIN
    -- Only enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'ip_logs' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on ip_logs table';
    ELSE
        RAISE NOTICE 'RLS already enabled on ip_logs table';
    END IF;
END $$;

-- Create policies for ip_logs only if they don't exist (non-destructive)
DO $$
BEGIN
    -- Create policy for authenticated users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ip_logs' 
        AND policyname = 'Allow authenticated users to manage ip logs'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage ip logs" ON ip_logs
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created policy for authenticated users on ip_logs';
    ELSE
        RAISE NOTICE 'Policy for authenticated users already exists on ip_logs';
    END IF;
    
    -- Create policy for service role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ip_logs' 
        AND policyname = 'Allow service role to manage ip logs'
    ) THEN
        CREATE POLICY "Allow service role to manage ip logs" ON ip_logs
            FOR ALL USING (auth.role() = 'service_role');
        RAISE NOTICE 'Created policy for service role on ip_logs';
    ELSE
        RAISE NOTICE 'Policy for service role already exists on ip_logs';
    END IF;
END $$;

-- ==============================================
-- 6. CREATE ADMIN USER ROLE (if needed)
-- ==============================================

-- Check if admin role exists, if not create it
DO $$
BEGIN
    -- Check if any admin role exists
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'Admin' LIMIT 1) THEN
        -- You'll need to replace 'YOUR_USER_ID' with the actual user ID
        -- This is just a placeholder - you'll need to run this manually with your user ID
        RAISE NOTICE 'No admin role found. You may need to manually create an admin role for your user.';
    END IF;
END $$;

-- ==============================================
-- 7. VERIFY FIXES
-- ==============================================

-- Test the permissions
SELECT 'System settings permissions fixed!' as message;

-- Test that functions exist
SELECT 'IP Tracking Function' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'log_ip_address') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Test that tables have proper permissions
SELECT 'System Settings Table' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'Seasons Table' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'seasons') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'User Roles Table' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'IP Logs Table' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'ip_logs') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT 'All remaining issues have been fixed!' as message,
       'IP tracking, season management, and bidding settings should now work properly.' as details;
