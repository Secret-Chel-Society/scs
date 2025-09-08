-- First, update the check_manager_role function to be more flexible with role names
CREATE OR REPLACE FUNCTION check_manager_role(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  role text,
  team_id uuid,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM players
  WHERE 
    user_id = user_id_param
    AND (
      -- Exact matches
      role = 'GM' 
      OR role = 'AGM' 
      OR role = 'Owner'
      OR role = 'owner'
      -- Case-insensitive partial matches
      OR lower(role) LIKE '%gm%'
      OR lower(role) LIKE '%agm%'
      OR lower(role) LIKE '%owner%'
      -- Any role containing 'manager' (just in case)
      OR lower(role) LIKE '%manager%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to help debug role assignments
CREATE OR REPLACE VIEW manager_roles_debug AS
SELECT 
  p.id,
  p.user_id,
  u.email,
  p.role,
  p.team_id,
  t.name as team_name,
  CASE 
    WHEN p.role IN ('GM', 'AGM', 'Owner', 'owner') THEN 'exact_match'
    WHEN lower(p.role) LIKE '%gm%' THEN 'contains_gm'
    WHEN lower(p.role) LIKE '%agm%' THEN 'contains_agm'
    WHEN lower(p.role) LIKE '%owner%' THEN 'contains_owner'
    WHEN lower(p.role) LIKE '%manager%' THEN 'contains_manager'
    ELSE 'other'
  END as match_type
FROM 
  players p
  JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN teams t ON p.team_id = t.id
WHERE 
  p.role IS NOT NULL
  AND (
    p.role IN ('GM', 'AGM', 'Owner', 'owner')
    OR lower(p.role) LIKE '%gm%'
    OR lower(p.role) LIKE '%agm%'
    OR lower(p.role) LIKE '%owner%'
    OR lower(p.role) LIKE '%manager%'
  )
ORDER BY 
  p.role, u.email;
