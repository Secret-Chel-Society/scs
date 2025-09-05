-- Fix system_settings table permissions
-- Run this SQL in your Supabase SQL editor

-- 1. Create the system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- 3. Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.system_settings_id_seq TO authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for admin users
-- Policy to allow admins to read all settings
CREATE POLICY "Admins can read system settings" ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'Admin'
        )
    );

-- Policy to allow admins to insert settings
CREATE POLICY "Admins can insert system settings" ON public.system_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'Admin'
        )
    );

-- Policy to allow admins to update settings
CREATE POLICY "Admins can update system settings" ON public.system_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'Admin'
        )
    );

-- Policy to allow admins to delete settings
CREATE POLICY "Admins can delete system settings" ON public.system_settings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'Admin'
        )
    );

-- 6. Insert default settings if they don't exist
INSERT INTO public.system_settings (key, value, updated_at)
VALUES 
    ('bidding_enabled', 'false', NOW()),
    ('bidding_duration', '14400', NOW()),
    ('bidding_increment', '250000', NOW()),
    ('min_salary', '750000', NOW()),
    ('max_salary', '15000000', NOW())
ON CONFLICT (key) DO NOTHING;

-- 7. Grant permissions to service role (for API calls)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.system_settings_id_seq TO service_role;
