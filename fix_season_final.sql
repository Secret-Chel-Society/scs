-- Final fix for season registration - simple and direct
-- Run this in Supabase SQL Editor

-- 1. Just set current_season to the season_number instead of UUID
UPDATE system_settings 
SET value = '1'::jsonb 
WHERE key = 'current_season';

-- 2. Verify it worked
SELECT 'Current season setting:' as info, value FROM system_settings WHERE key = 'current_season';

-- 3. Check what season has season_number = 1
SELECT 'Season with number 1:' as info, id, name, season_number, is_active FROM seasons WHERE season_number = 1;

-- 4. Make sure that season is active
UPDATE seasons SET is_active = true WHERE season_number = 1;

-- 5. Final verification
SELECT 'Final check:' as info;
SELECT 'Current season setting:' as setting, value FROM system_settings WHERE key = 'current_season';
SELECT 'Active seasons:' as setting, COUNT(*) as count FROM seasons WHERE is_active = true;
