-- Safe fix for conference permissions (non-destructive)
-- Run this in Supabase SQL Editor

-- 1. Grant permissions on conferences table (safe)
GRANT ALL ON public.conferences TO authenticated;
GRANT ALL ON public.conferences TO service_role;

-- 2. Enable RLS on conferences table (safe)
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- 3. Create policies only if they don't exist (safe)
DO $$
BEGIN
    -- Only create if policy doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conferences' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON public.conferences
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conferences' 
        AND policyname = 'Enable all operations for service role'
    ) THEN
        CREATE POLICY "Enable all operations for service role" ON public.conferences
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 4. Ensure teams table has proper permissions (safe)
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;

-- 5. Test the query that the app uses (safe - read only)
SELECT 
    t.id,
    t.name as team_name,
    t.conference_id,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
LIMIT 5;

-- 6. Show current policies (safe - read only)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('conferences', 'teams')
AND schemaname = 'public';
