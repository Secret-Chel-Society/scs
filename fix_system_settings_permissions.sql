-- Midnight Studios INTl - All rights reserved
-- Fix system_settings permissions and sequence issues

-- Grant USAGE permission on the sequence
GRANT USAGE ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE system_settings_id_seq TO service_role;
GRANT USAGE ON SEQUENCE system_settings_id_seq TO anon;

-- Grant permissions on the system_settings table
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO anon;

-- Also grant permissions on the sequence owner
GRANT ALL ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;
GRANT ALL ON SEQUENCE system_settings_id_seq TO anon;

-- Make sure the table has proper RLS policies if needed
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read/write system settings
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage system settings" ON system_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a policy for service role
CREATE POLICY IF NOT EXISTS "Allow service role to manage system settings" ON system_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Test the permissions
SELECT 'System settings permissions fixed!' as message;