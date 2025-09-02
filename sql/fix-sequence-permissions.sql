-- Fix sequence permissions for system_settings
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;

-- Also ensure table permissions are correct  
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
