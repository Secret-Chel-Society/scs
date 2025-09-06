-- Simple check for conference issues
-- Run this in Supabase SQL Editor

-- 1. Check if conferences table has any data
SELECT 'Conferences in table:' as check_type, COUNT(*) as count FROM public.conferences;

-- 2. Show all conferences
SELECT 'All conferences:' as check_type, id, name, description, color FROM public.conferences;

-- 3. Check teams with conference assignments
SELECT 'Teams with conference_id:' as check_type, COUNT(*) as count FROM public.teams WHERE conference_id IS NOT NULL;

-- 4. Show teams and their conference assignments
SELECT 
    'Team conference assignments:' as check_type,
    t.name as team_name,
    t.conference_id,
    c.name as conference_name
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
ORDER BY t.name
LIMIT 10;

-- 5. If no conferences exist, add them
INSERT INTO public.conferences (name, description, color)
VALUES
    ('Eastern Conference', 'Eastern Conference teams', '#3b82f6'),
    ('Western Conference', 'Western Conference teams', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- 6. Final count
SELECT 'Final conference count:' as check_type, COUNT(*) as count FROM public.conferences;
