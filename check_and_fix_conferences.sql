-- Check and fix conferences table issues
-- Run this in Supabase SQL Editor

-- 1. Check if conferences table has data
SELECT 'Conferences count:' as info, COUNT(*) as count FROM public.conferences;

-- 2. Show existing conferences
SELECT 'Existing conferences:' as info, id, name, description, color FROM public.conferences ORDER BY name;

-- 3. Check if there are any teams with conference_id
SELECT 'Teams with conference_id:' as info, COUNT(*) as count FROM public.teams WHERE conference_id IS NOT NULL;

-- 4. Insert default conferences if none exist
INSERT INTO public.conferences (name, description, color, created_at, updated_at)
VALUES
    ('Eastern Conference', 'Eastern Conference teams', '#3b82f6', NOW(), NOW()),
    ('Western Conference', 'Western Conference teams', '#ef4444', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 5. Grant proper permissions
GRANT ALL ON public.conferences TO authenticated;
GRANT ALL ON public.conferences TO service_role;

-- 6. Enable RLS if not already enabled
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies if they don't exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.conferences;
    DROP POLICY IF EXISTS "Allow all operations for service role" ON public.conferences;
    
    -- Create new policies
    CREATE POLICY "Allow all operations for authenticated users" ON public.conferences
        FOR ALL USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all operations for service role" ON public.conferences
        FOR ALL USING (auth.role() = 'service_role');
EXCEPTION
    WHEN OTHERS THEN
        -- If policies already exist or other error, continue
        NULL;
END $$;

-- 8. Verify the setup
SELECT 'Final verification:' as info, COUNT(*) as conference_count FROM public.conferences;

-- 9. Test the join query that the app uses
SELECT 
    t.id,
    t.name as team_name,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
LIMIT 5;
