-- Fix the specific 406 error with system_settings
-- Run this in Supabase SQL Editor

-- 1. Check what's actually in system_settings table
SELECT 'All system_settings entries:' as info;
SELECT key, value, pg_typeof(value) as value_type FROM system_settings ORDER BY key;

-- 2. Check specifically for current_season entries
SELECT 'Current season entries:' as info;
SELECT key, value, pg_typeof(value) as value_type, value::text as value_text 
FROM system_settings 
WHERE key = 'current_season';

-- 3. Count how many current_season entries exist
SELECT 'Count of current_season entries:' as info;
SELECT COUNT(*) as count FROM system_settings WHERE key = 'current_season';

-- 4. Clean up any duplicate current_season entries
DO $$ 
DECLARE
    current_season_count INTEGER;
BEGIN
    -- Count current_season entries
    SELECT COUNT(*) INTO current_season_count FROM system_settings WHERE key = 'current_season';
    
    IF current_season_count > 1 THEN
        -- Delete all current_season entries
        DELETE FROM system_settings WHERE key = 'current_season';
        RAISE NOTICE 'Deleted % duplicate current_season entries', current_season_count;
        
        -- Insert a single clean entry
        INSERT INTO system_settings (key, value) VALUES ('current_season', '1'::jsonb);
        RAISE NOTICE 'Created single clean current_season entry';
        
    ELSIF current_season_count = 0 THEN
        -- No entries exist, create one
        INSERT INTO system_settings (key, value) VALUES ('current_season', '1'::jsonb);
        RAISE NOTICE 'Created current_season entry (none existed)';
        
    ELSE
        -- One entry exists, check if it's properly formatted
        IF EXISTS (SELECT 1 FROM system_settings WHERE key = 'current_season' AND pg_typeof(value)::text != 'jsonb') THEN
            -- Update to proper JSONB format
            UPDATE system_settings SET value = '1'::jsonb WHERE key = 'current_season';
            RAISE NOTICE 'Updated current_season to proper JSONB format';
        ELSE
            RAISE NOTICE 'Current_season entry is already properly formatted';
        END IF;
    END IF;
END $$;

-- 5. Verify the fix
SELECT 'Verification - current_season after fix:' as info;
SELECT key, value, pg_typeof(value) as value_type, value::text as value_text 
FROM system_settings 
WHERE key = 'current_season';

-- 6. Test the exact query that's failing in the app
SELECT 'Testing the app query:' as info;
SELECT value FROM system_settings WHERE key = 'current_season';

-- 7. Test with .single() equivalent (should return exactly one row)
SELECT 'Testing single row query:' as info;
SELECT value FROM system_settings WHERE key = 'current_season' LIMIT 1;

-- 8. Check if there are any other system_settings that might be causing issues
SELECT 'All system_settings after cleanup:' as info;
SELECT key, value, pg_typeof(value) as value_type FROM system_settings ORDER BY key;
