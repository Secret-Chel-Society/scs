-- Create the function with a single EXECUTE statement
DO $do$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'check_manager_role' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Create a function to check if a user has manager role (GM, AGM, or Owner)
        CREATE OR REPLACE FUNCTION public.check_manager_role(user_id_param UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            is_manager BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1 
                FROM players 
                WHERE user_id = user_id_param 
                AND LOWER(role) IN ('gm', 'agm', 'owner')
            ) INTO is_manager;
            
            RETURN is_manager;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Grant execute permission to authenticated users
        GRANT EXECUTE ON FUNCTION public.check_manager_role(UUID) TO authenticated;
        
        RAISE NOTICE 'Created function check_manager_role and granted execute permissions';
    ELSE
        RAISE NOTICE 'Function check_manager_role already exists, skipping creation';
    END IF;
END $do$;
