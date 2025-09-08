-- Simple system settings table creation with minimal locking
-- First drop any existing table to ensure clean state
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Create the table with all necessary constraints
CREATE TABLE public.system_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT system_settings_pkey PRIMARY KEY (id),
    CONSTRAINT system_settings_key_key UNIQUE (key)
) TABLESPACE pg_default;

-- Create index
CREATE INDEX system_settings_key_idx ON public.system_settings USING btree (key);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Add default values
INSERT INTO public.system_settings (key, value) VALUES 
    ('salary_cap', '65000000'::jsonb),
    ('current_season', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add read policy (simplest possible)
CREATE POLICY "Allow read access to all users" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Add write policy for service role only
CREATE POLICY "Allow write access to service role" 
ON public.system_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
