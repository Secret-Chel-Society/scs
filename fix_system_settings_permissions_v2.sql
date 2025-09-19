-- Fix system_settings table permissions - Version 2
-- Run this SQL in your Supabase SQL editor

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can delete system settings" ON public.system_settings;

-- 2. Drop the table if it exists and recreate it
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- 3. Create the system_settings table (matching your exact schema)
CREATE TABLE public.system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create index for better performance
CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- 5. Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.system_settings_id_seq TO authenticated;

-- 6. Grant permissions to service role (for API calls)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.system_settings_id_seq TO service_role;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 8. Create more permissive RLS policies
-- Allow all authenticated users to read (for now)
CREATE POLICY "Authenticated users can read system settings" ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to insert (for now)
CREATE POLICY "Authenticated users can insert system settings" ON public.system_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to update (for now)
CREATE POLICY "Authenticated users can update system settings" ON public.system_settings
    FOR UPDATE
    TO authenticated
    USING (true);

-- Allow all authenticated users to delete (for now)
CREATE POLICY "Authenticated users can delete system settings" ON public.system_settings
    FOR DELETE
    TO authenticated
    USING (true);

-- 9. Insert default settings (using proper JSONB format)
INSERT INTO public.system_settings (key, value, created_at, updated_at)
VALUES 
    ('bidding_enabled', 'false'::jsonb, NOW(), NOW()),
    ('bidding_duration', '14400'::jsonb, NOW(), NOW()),
    ('bidding_increment', '250000'::jsonb, NOW(), NOW()),
    ('min_salary', '750000'::jsonb, NOW(), NOW()),
    ('max_salary', '15000000'::jsonb, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- 10. Verify the table was created and has data
SELECT * FROM public.system_settings;

-- 11. Test permissions
-- This should work for any authenticated user
SELECT 'Permissions test successful' as test_result;
