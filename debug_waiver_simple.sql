-- Simple waiver system check - 100% SAFE
-- Just counts records and checks basic info

-- 1. Count records in each table
SELECT 'waivers' as table_name, COUNT(*) as record_count FROM waivers;
SELECT 'waiver_claims' as table_name, COUNT(*) as record_count FROM waiver_claims;
SELECT 'waiver_priority' as table_name, COUNT(*) as record_count FROM waiver_priority;
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams;
SELECT 'players' as table_name, COUNT(*) as record_count FROM players;

-- 2. Check if waiver_priority has data for teams
SELECT 
    COUNT(*) as teams_with_priority
FROM teams t
INNER JOIN waiver_priority wp ON t.id = wp.team_id;

-- 3. Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('waivers', 'waiver_claims', 'waiver_priority');
