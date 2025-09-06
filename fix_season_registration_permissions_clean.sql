-- Fix season registration page permission and query issues
-- Run this in Supabase SQL Editor

-- 1. Check current system_settings data and permissions
SELECT 'Checking system_settings data:' as info;
SELECT key, value FROM system_settings WHERE key = 'current_season';

-- 2. Check if current_season value is properly formatted
SELECT 'Checking current_season format:' as info;
SELECT 
  key, 
  value, 
  pg_typeof(value) as value_type,
  value::text as value_text
FROM system_settings 
WHERE key = 'current_season';

-- 3. Fix current_season value if it's not properly formatted
DO $$ 
BEGIN
    -- Check if current_season exists and is properly formatted
    IF EXISTS (SELECT 1 FROM system_settings WHERE key = 'current_season') THEN
        -- Update to ensure it's a proper JSONB value
        UPDATE system_settings 
        SET value = '1'::jsonb 
        WHERE key = 'current_season';
        RAISE NOTICE 'Updated current_season to proper JSONB format';
    ELSE
        -- Insert if it doesn't exist
        INSERT INTO system_settings (key, value)
        VALUES ('current_season', '1'::jsonb);
        RAISE NOTICE 'Created current_season setting';
    END IF;
END $$;

-- 4. Check seasons table and ensure we have an active season
SELECT 'Checking active seasons:' as info;
SELECT id, name, season_number, is_active FROM seasons WHERE is_active = true;

-- 5. Ensure we have at least one active season
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM seasons WHERE is_active = true) THEN
        -- Activate the first season if none are active
        UPDATE seasons 
        SET is_active = true 
        WHERE id = (SELECT id FROM seasons ORDER BY created_at LIMIT 1);
        RAISE NOTICE 'Activated first season (no active season found)';
    ELSE
        RAISE NOTICE 'Active season already exists';
    END IF;
END $$;

-- 6. Check season_registrations table structure and permissions
SELECT 'Checking season_registrations table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'season_registrations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check if season_registrations table has RLS enabled
SELECT 'Checking RLS on season_registrations:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'season_registrations' 
AND schemaname = 'public';

-- 8. Check RLS policies on season_registrations
SELECT 'Checking RLS policies on season_registrations:' as info;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'season_registrations' 
AND schemaname = 'public';

-- 9. Create basic RLS policies for season_registrations if none exist
DO $$ 
BEGIN
    -- Check if any policies exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'season_registrations' AND schemaname = 'public') THEN
        -- Enable RLS
        ALTER TABLE season_registrations ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policies
        CREATE POLICY "Users can view their own registrations" ON season_registrations
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own registrations" ON season_registrations
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own registrations" ON season_registrations
            FOR UPDATE USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created RLS policies for season_registrations';
    ELSE
        RAISE NOTICE 'RLS policies already exist for season_registrations';
    END IF;
END $$;

-- 10. Check users table ban_expires_at column
SELECT 'Checking ban_expires_at column:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'ban_expires_at'
AND table_schema = 'public';

-- 11. Add ban_expires_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'ban_expires_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN ban_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added ban_expires_at column to users table';
    ELSE
        RAISE NOTICE 'ban_expires_at column already exists';
    END IF;
END $$;

-- 12. Final verification
SELECT 'Final verification:' as info;
SELECT 'Current season setting:' as setting, value FROM system_settings WHERE key = 'current_season';
SELECT 'Active seasons:' as setting, COUNT(*) as count FROM seasons WHERE is_active = true;
SELECT 'Season registrations table exists:' as setting, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'season_registrations' AND table_schema = 'public') 
            THEN 'YES' ELSE 'NO' END as exists;
SELECT 'Users table columns:' as setting, COUNT(*) as count FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';
