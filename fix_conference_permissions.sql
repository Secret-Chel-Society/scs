-- Fix conference permissions and RLS policies
-- Run this in Supabase SQL Editor

-- 1. Grant permissions on conferences table
GRANT ALL ON public.conferences TO authenticated;
GRANT ALL ON public.conferences TO service_role;

-- 2. Enable RLS on conferences table
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.conferences;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.conferences;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conferences;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.conferences;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.conferences;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.conferences;

-- 4. Create simple, permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON public.conferences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for service role" ON public.conferences
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Also ensure teams table has proper permissions
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;

-- 6. Test the query that the app uses
SELECT 
    t.id,
    t.name as team_name,
    t.conference_id,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
LIMIT 5;

-- 7. Verify permissions
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename IN ('conferences', 'teams')
AND schemaname = 'public';
