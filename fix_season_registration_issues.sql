-- Fix season registration page issues
-- Run this in Supabase SQL Editor

-- 1. Check if system_settings table exists and has current_season
SELECT 'Checking system_settings table:' as info;
SELECT * FROM system_settings WHERE key = 'current_season';

-- 2. Add current_season setting if it doesn't exist
INSERT INTO system_settings (key, value)
VALUES ('current_season', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Check if seasons table has any data
SELECT 'Checking seasons table:' as info;
SELECT id, name, season_number, is_active FROM seasons ORDER BY id;

-- 4. If no seasons exist, create a default season
INSERT INTO seasons (name, season_number, is_active)
VALUES ('Season 1', 1, true)
ON CONFLICT DO NOTHING;

-- 5. Check if users table has ban_expires_at column
SELECT 'Checking users table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
AND column_name IN ('is_banned', 'ban_reason', 'ban_expires_at');

-- 6. Add ban_expires_at column if it doesn't exist
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

-- 7. Verify the fixes
SELECT 'Final verification:' as info;
SELECT 'Current season setting:' as setting, value FROM system_settings WHERE key = 'current_season';
SELECT 'Active seasons:' as setting, COUNT(*) as count FROM seasons WHERE is_active = true;
SELECT 'Users table columns:' as setting, COUNT(*) as count FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';
