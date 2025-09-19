-- Complete system settings setup
-- Run this in Supabase SQL Editor

-- 1. Fix current_season setting (ensure it's an integer, not UUID)
SELECT 'Current season setting:' as info, key, value FROM public.system_settings WHERE key = 'current_season';

UPDATE public.system_settings 
SET value = '1' 
WHERE key = 'current_season' 
AND value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Add salary cap setting if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES ('salary_cap', '65000000', 'Salary cap amount in dollars (default: $65,000,000)')
ON CONFLICT (key) DO NOTHING;

-- 3. Ensure current_season setting exists
INSERT INTO public.system_settings (key, value, description)
VALUES ('current_season', '1', 'Current active season ID')
ON CONFLICT (key) DO NOTHING;

-- 4. Verify all settings
SELECT 'All system settings:' as info, key, value, description 
FROM public.system_settings 
ORDER BY key;

-- 5. Test the settings
SELECT 
    'Current season:' as setting,
    (SELECT value FROM public.system_settings WHERE key = 'current_season') as value,
    'integer' as expected_type
UNION ALL
SELECT 
    'Salary cap:' as setting,
    (SELECT value FROM public.system_settings WHERE key = 'salary_cap') as value,
    'integer' as expected_type;
