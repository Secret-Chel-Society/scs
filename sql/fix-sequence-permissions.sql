-- NON-DESTRUCTIVE sequence permissions fix
-- Safe to run multiple times, only grants permissions

-- Grant sequence permissions for system_settings_id_seq
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;

-- Grant table permissions for system_settings
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
