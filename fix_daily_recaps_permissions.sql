-- Midnight Studios INTl - All rights reserved
-- Fix daily_recaps sequence permissions

-- Grant usage on the sequence to the authenticated role
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO authenticated;

-- Grant usage on the sequence to the service_role
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO service_role;

-- Grant usage on the sequence to anon role (if needed)
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO anon;

-- Also ensure the table permissions are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO service_role;
GRANT SELECT ON TABLE daily_recaps TO anon;

-- Make sure the sequence is owned by the correct role
-- (This might need to be adjusted based on your setup)
-- ALTER SEQUENCE daily_recaps_id_seq OWNER TO postgres;

-- Check current permissions (for debugging)
-- SELECT 
--   schemaname,
--   sequencename,
--   sequenceowner,
--   has_sequences_privilege('authenticated', schemaname||'.'||sequencename, 'USAGE') as authenticated_usage,
--   has_sequences_privilege('service_role', schemaname||'.'||sequencename, 'USAGE') as service_role_usage
-- FROM pg_sequences 
-- WHERE sequencename = 'daily_recaps_id_seq';
