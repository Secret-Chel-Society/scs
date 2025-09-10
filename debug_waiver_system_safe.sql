-- Debug waiver system issues - 100% SAFE (read-only)
-- Run this in your Supabase SQL Editor to see what's wrong

-- 1. Check if tables exist and have data
SELECT 'waivers' as table_name, COUNT(*) as record_count FROM waivers
UNION ALL
SELECT 'waiver_claims' as table_name, COUNT(*) as record_count FROM waiver_claims  
UNION ALL
SELECT 'waiver_priority' as table_name, COUNT(*) as record_count FROM waiver_priority
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'players' as table_name, COUNT(*) as record_count FROM players;

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('waivers', 'waiver_claims', 'waiver_priority')
ORDER BY tablename, policyname;

-- 3. Check table permissions
SELECT 
    t.table_name,
    t.privilege_type,
    t.grantee
FROM information_schema.table_privileges t
WHERE t.table_name IN ('waivers', 'waiver_claims', 'waiver_priority')
AND t.grantee = 'authenticated'
ORDER BY t.table_name, t.privilege_type;

-- 4. Check if waiver_priority has entries for all teams
SELECT 
    t.id as team_id,
    t.name as team_name,
    wp.priority,
    wp.id as priority_id
FROM teams t
LEFT JOIN waiver_priority wp ON t.id = wp.team_id
ORDER BY t.name;

-- 5. Check table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('waivers', 'waiver_claims', 'waiver_priority')
ORDER BY table_name, ordinal_position;

-- 6. Check foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('waivers', 'waiver_claims', 'waiver_priority')
ORDER BY tc.table_name, kcu.column_name;
