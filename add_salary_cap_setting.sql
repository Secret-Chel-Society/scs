-- Add salary cap setting to system_settings table
-- Run this in Supabase SQL Editor

-- 1. Check if salary_cap setting already exists
SELECT 'Current salary cap setting:' as info, key, value, description 
FROM public.system_settings 
WHERE key = 'salary_cap';

-- 2. Insert salary cap setting if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES ('salary_cap', '65000000', 'Salary cap amount in dollars (default: $65,000,000)')
ON CONFLICT (key) DO NOTHING;

-- 3. Verify the setting was added
SELECT 'Updated salary cap setting:' as info, key, value, description 
FROM public.system_settings 
WHERE key = 'salary_cap';

-- 4. Show all system settings for reference
SELECT 'All system settings:' as info, key, value, description 
FROM public.system_settings 
ORDER BY key;
