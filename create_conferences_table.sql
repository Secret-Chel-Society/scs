-- Create conferences table if it doesn't exist
-- Run this in Supabase SQL Editor

-- 1. Create conferences table
CREATE TABLE IF NOT EXISTS public.conferences (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT conferences_pkey PRIMARY KEY (id)
);

-- 2. Create updated_at trigger for conferences
CREATE OR REPLACE FUNCTION update_conferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conferences_updated_at_trigger
    BEFORE UPDATE ON public.conferences
    FOR EACH ROW
    EXECUTE FUNCTION update_conferences_updated_at();

-- 3. Insert default conferences if they don't exist
INSERT INTO public.conferences (name, description, color, created_at, updated_at)
VALUES
    ('Eastern Conference', 'Eastern Conference teams', '#3b82f6', NOW(), NOW()),
    ('Western Conference', 'Western Conference teams', '#ef4444', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 4. Grant permissions
GRANT ALL ON public.conferences TO authenticated;
GRANT ALL ON public.conferences TO service_role;

-- 5. Enable RLS
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.conferences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for service role" ON public.conferences
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Verify the setup
SELECT 
    id,
    name,
    description,
    color,
    created_at
FROM public.conferences
ORDER BY name;
