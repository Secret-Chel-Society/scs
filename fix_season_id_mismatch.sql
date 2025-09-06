-- Fix the season ID mismatch issue
-- The current_season setting has value '1' but seasons table uses UUIDs
-- Run this in Supabase SQL Editor

-- 1. Check current system_settings value
SELECT 'Current system_settings value:' as info;
SELECT key, value, pg_typeof(value) as value_type FROM system_settings WHERE key = 'current_season';

-- 2. Check what seasons exist and their IDs
SELECT 'Available seasons:' as info;
SELECT id, name, season_number, is_active FROM seasons ORDER BY created_at;

-- 3. Get the first active season's UUID
SELECT 'First active season UUID:' as info;
SELECT id as active_season_uuid FROM seasons WHERE is_active = true ORDER BY created_at LIMIT 1;

-- 4. Update current_season to use the actual UUID instead of '1'
DO $$ 
DECLARE
    active_season_uuid UUID;
BEGIN
    -- Get the first active season's UUID
    SELECT id INTO active_season_uuid FROM seasons WHERE is_active = true ORDER BY created_at LIMIT 1;
    
    IF active_season_uuid IS NOT NULL THEN
        -- Update current_season to use the actual UUID
        UPDATE system_settings 
        SET value = to_jsonb(active_season_uuid::text)
        WHERE key = 'current_season';
        RAISE NOTICE 'Updated current_season to use UUID: %', active_season_uuid;
    ELSE
        RAISE NOTICE 'No active season found to set as current_season';
    END IF;
END $$;

-- 5. Verify the fix
SELECT 'Verification - current_season after UUID fix:' as info;
SELECT key, value, pg_typeof(value) as value_type, value::text as value_text 
FROM system_settings 
WHERE key = 'current_season';

-- 6. Test the exact query that should work now
SELECT 'Testing season lookup by UUID:' as info;
SELECT s.id, s.name, s.season_number 
FROM seasons s
WHERE s.id = (SELECT value::text::uuid FROM system_settings WHERE key = 'current_season');

-- 7. Alternative approach - use season_number instead of UUID
SELECT 'Alternative: Using season_number approach:' as info;
SELECT 'If UUID approach fails, we can use season_number instead' as note;

-- 8. Check if we should use season_number instead
DO $$ 
DECLARE
    current_season_number INTEGER;
    season_count INTEGER;
BEGIN
    -- Get the season_number from the first active season
    SELECT season_number INTO current_season_number FROM seasons WHERE is_active = true ORDER BY created_at LIMIT 1;
    
    -- Count how many seasons have this season_number
    SELECT COUNT(*) INTO season_count FROM seasons WHERE season_number = current_season_number;
    
    IF season_count = 1 THEN
        -- Only one season with this number, safe to use season_number
        UPDATE system_settings 
        SET value = to_jsonb(current_season_number)
        WHERE key = 'current_season';
        RAISE NOTICE 'Updated current_season to use season_number: % (unique)', current_season_number;
    ELSE
        RAISE NOTICE 'Season number % is not unique (% seasons), keeping UUID approach', current_season_number, season_count;
    END IF;
END $$;

-- 9. Final verification
SELECT 'Final verification:' as info;
SELECT key, value, pg_typeof(value) as value_type, value::text as value_text 
FROM system_settings 
WHERE key = 'current_season';
