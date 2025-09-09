-- Midnight Studios INTl - All rights reserved
-- Add admin roles for all admin users
-- NON-DESTRUCTIVE: Safe to run multiple times, only adds missing roles

-- List of admin emails (add more as needed)
DO $$
DECLARE
    admin_emails TEXT[] := ARRAY[
        'zacha@midnightstudios.com',
        'admin@secretchelsociety.com',
        'zacha@secretchelsociety.com'
    ];
    email_to_check TEXT;
    user_id_to_update UUID;
    users_processed INTEGER := 0;
    users_skipped INTEGER := 0;
BEGIN
    -- Loop through all admin emails
    FOREACH email_to_check IN ARRAY admin_emails
    LOOP
        -- Find the user ID by email
        SELECT id INTO user_id_to_update 
        FROM users 
        WHERE email = email_to_check
        LIMIT 1;
        
        -- If user found, add admin role
        IF user_id_to_update IS NOT NULL THEN
            -- Try to insert admin role with duplicate key handling
            BEGIN
                INSERT INTO user_roles (user_id, role, created_at, updated_at)
                VALUES (user_id_to_update, 'Admin', NOW(), NOW());
                
                RAISE NOTICE 'Admin role added for user: % (%)', email_to_check, user_id_to_update;
                users_processed := users_processed + 1;
            EXCEPTION WHEN unique_violation THEN
                RAISE NOTICE 'Admin role already exists for user: % (%)', email_to_check, user_id_to_update;
                users_skipped := users_skipped + 1;
            END;
        ELSE
            RAISE NOTICE 'User not found: %', email_to_check;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Admin role setup complete. Processed: %, Skipped: %', users_processed, users_skipped;
END $$;

-- Also add admin roles for any users who might be admins in other ways
-- Check for users who might be admins but don't have the role yet
DO $$
DECLARE
    potential_admin_user RECORD;
    users_found INTEGER := 0;
BEGIN
    -- Look for users who might be admins (you can customize this logic)
    FOR potential_admin_user IN 
        SELECT DISTINCT u.id, u.email
        FROM users u
        WHERE u.email LIKE '%admin%' 
           OR u.email LIKE '%zacha%'
           OR u.email LIKE '%owner%'
           OR u.email LIKE '%manager%'
        AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = u.id 
            AND ur.role = 'Admin'
        )
    LOOP
        -- Add admin role with duplicate key handling
        BEGIN
            INSERT INTO user_roles (user_id, role, created_at, updated_at)
            VALUES (potential_admin_user.id, 'Admin', NOW(), NOW());
            
            RAISE NOTICE 'Admin role added for potential admin: % (%)', potential_admin_user.email, potential_admin_user.id;
            users_found := users_found + 1;
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'Admin role already exists for potential admin: % (%)', potential_admin_user.email, potential_admin_user.id;
        END;
    END LOOP;
    
    IF users_found = 0 THEN
        RAISE NOTICE 'No additional potential admins found.';
    ELSE
        RAISE NOTICE 'Found and processed % additional potential admins.', users_found;
    END IF;
END $$;

-- Verify all admin roles
SELECT 
    u.email,
    ur.role,
    ur.created_at,
    u.created_at as user_created_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'Admin'
ORDER BY ur.created_at DESC;

-- Show summary
SELECT 
    COUNT(*) as total_admin_users,
    'Admin roles have been set up for all admin users' as message
FROM user_roles 
WHERE role = 'Admin';
