-- NON-DESTRUCTIVE Fix for sequence permissions
-- This only GRANTS permissions without dropping or altering existing setup

-- Grant sequence permissions (safe to run multiple times)
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;

-- Grant table permissions (safe to run multiple times)  
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;

-- Success message
SELECT '✅ Sequence permissions granted successfully' as result;
