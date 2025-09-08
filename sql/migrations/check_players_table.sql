-- Check players table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players';

-- Check sample data with roles
SELECT id, user_id, role, team_id
FROM players
WHERE role IS NOT NULL
ORDER BY role
LIMIT 20;
