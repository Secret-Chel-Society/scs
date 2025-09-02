-- Create player records for users with approved registrations who are missing them
-- This is a common cause of free agents not showing up

WITH active_season AS (
  SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
)
INSERT INTO players (user_id, team_id, salary, role, status)
SELECT DISTINCT 
  sr.user_id,
  NULL as team_id,  -- free agents have no team
  750000 as salary, -- default salary
  'Player' as role,
  'free_agent' as status
FROM season_registrations sr, active_season
JOIN users u ON sr.user_id = u.id
LEFT JOIN players p ON sr.user_id = p.user_id
WHERE sr.season_id = active_season.season_id 
  AND sr.status = 'Approved'
  AND p.id IS NULL  -- only insert if player record doesn't exist
  AND u.is_active = true;

-- Show how many records were created
SELECT 'PLAYER RECORDS CREATED' as result, 
       COUNT(*) as records_created
FROM (
  WITH active_season AS (
    SELECT id as season_id FROM seasons WHERE is_active = true LIMIT 1
  )
  SELECT sr.user_id
  FROM season_registrations sr, active_season
  JOIN users u ON sr.user_id = u.id
  JOIN players p ON sr.user_id = p.user_id  -- now they should exist
  WHERE sr.season_id = active_season.season_id 
    AND sr.status = 'Approved'
    AND p.team_id IS NULL
    AND u.is_active = true
) created_records;
