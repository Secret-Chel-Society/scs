-- Drop the existing constraint if it exists
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add a new constraint that allows all the necessary roles
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['Player'::text, 'GM'::text, 'AGM'::text, 'Owner'::text, 'Admin'::text]));

-- Create a function to check if a user has a manager role
CREATE OR REPLACE FUNCTION is_user_manager(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  is_manager boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_param 
    AND role IN ('GM', 'AGM', 'Owner', 'Admin')
  ) INTO is_manager;
  
  RETURN is_manager;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
