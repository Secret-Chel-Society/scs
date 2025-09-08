-- Check all manager roles in the players table
SELECT id, user_id, role, team_id 
FROM players 
WHERE role IN ('GM', 'AGM', 'Owner') 
   OR role ILIKE '%GM%' 
   OR role ILIKE '%AGM%' 
   OR role ILIKE '%Owner%'
ORDER BY role;
