-- Fix current_season setting to use integer instead of UUID
-- Run this in Supabase SQL Editor

-- 1. Check current value
SELECT 'Current season setting:' as info, key, value FROM public.system_settings WHERE key = 'current_season';

-- 2. Update to use integer 1 if it's currently a UUID
UPDATE public.system_settings 
SET value = '1' 
WHERE key = 'current_season' 
AND value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. If no current_season setting exists, create it
INSERT INTO public.system_settings (key, value, description)
VALUES ('current_season', '1', 'Current active season ID')
ON CONFLICT (key) DO NOTHING;

-- 4. Verify the fix
SELECT 'Updated season setting:' as info, key, value FROM public.system_settings WHERE key = 'current_season';
