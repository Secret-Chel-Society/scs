-- Complete system settings setup (fixed for existing table structure)
-- Run this in Supabase SQL Editor

-- 1. Check current table structure
SELECT 'System settings table structure:' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'system_settings' AND table_schema = 'public';

-- 2. Fix current_season setting (ensure it's an integer, not UUID)
SELECT 'Current season setting:' as info, key, value FROM public.system_settings WHERE key = 'current_season';

UPDATE public.system_settings 
SET value = '1'::jsonb 
WHERE key = 'current_season' 
AND value::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Add salary cap setting if it doesn't exist (without description column)
INSERT INTO public.system_settings (key, value)
VALUES ('salary_cap', '30000000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Ensure current_season setting exists (without description column)
INSERT INTO public.system_settings (key, value)
VALUES ('current_season', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Verify all settings
SELECT 'All system settings:' as info, key, value 
FROM public.system_settings 
ORDER BY key;

-- 6. Test the settings
SELECT 
    'Current season:' as setting,
    (SELECT value::text FROM public.system_settings WHERE key = 'current_season') as value,
    'integer' as expected_type
UNION ALL
SELECT 
    'Salary cap:' as setting,
    (SELECT value::text FROM public.system_settings WHERE key = 'salary_cap') as value,
    'integer' as expected_type;
