-- Debug conference issues
-- Run this to check the current state of conferences and teams

-- 1. Check if conferences table exists and has data
SELECT 'Conferences Table Check' as check_type;
SELECT * FROM public.conferences ORDER BY name;

-- 2. Check teams table structure
SELECT 'Teams Table Structure' as check_type;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check teams with conference assignments
SELECT 'Teams with Conference Data' as check_type;
SELECT 
    t.id,
    t.name,
    t.conference_id,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
ORDER BY t.name;

-- 4. Check teams without conference assignments
SELECT 'Teams without Conference Assignment' as check_type;
SELECT 
    t.id,
    t.name,
    t.conference_id
FROM public.teams t
WHERE t.conference_id IS NULL
ORDER BY t.name;

-- 5. Check if there are any teams at all
SELECT 'Total Teams Count' as check_type;
SELECT COUNT(*) as total_teams FROM public.teams;

-- 6. Check if there are any conferences at all
SELECT 'Total Conferences Count' as check_type;
SELECT COUNT(*) as total_conferences FROM public.conferences;
