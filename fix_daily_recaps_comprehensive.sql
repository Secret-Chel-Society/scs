-- Midnight Studios INTl - All rights reserved
-- Comprehensive fix for daily_recaps table and sequence permissions

-- First, let's check if the table exists and its current structure
-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS daily_recaps (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  recap_data JSONB NOT NULL CHECK (recap_data ? 'team_recaps'::text AND jsonb_typeof(recap_data -> 'team_recaps'::text) = 'array'::text),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_daily_recaps_date ON daily_recaps(date);

-- Fix sequence permissions
-- Grant usage on the sequence to all necessary roles
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO service_role;
GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO service_role;
GRANT SELECT ON TABLE daily_recaps TO anon;

-- Ensure the sequence is owned by the correct role
-- This might need to be adjusted based on your database setup
-- ALTER SEQUENCE daily_recaps_id_seq OWNER TO postgres;

-- Alternative approach: If the sequence permissions are still problematic,
-- we can recreate the table with a different approach
-- DROP TABLE IF EXISTS daily_recaps CASCADE;
-- CREATE TABLE daily_recaps (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   date DATE NOT NULL UNIQUE,
--   recap_data JSONB NOT NULL CHECK (recap_data ? 'team_recaps'::text AND jsonb_typeof(recap_data -> 'team_recaps'::text) = 'array'::text),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Create a function to check permissions (for debugging)
CREATE OR REPLACE FUNCTION check_daily_recaps_permissions()
RETURNS TABLE (
  role_name TEXT,
  has_table_select BOOLEAN,
  has_table_insert BOOLEAN,
  has_sequence_usage BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'authenticated'::TEXT,
    has_table_privilege('authenticated', 'daily_recaps', 'SELECT'),
    has_table_privilege('authenticated', 'daily_recaps', 'INSERT'),
    has_sequence_privilege('authenticated', 'daily_recaps_id_seq', 'USAGE')
  UNION ALL
  SELECT 
    'service_role'::TEXT,
    has_table_privilege('service_role', 'daily_recaps', 'SELECT'),
    has_table_privilege('service_role', 'daily_recaps', 'INSERT'),
    has_sequence_privilege('service_role', 'daily_recaps_id_seq', 'USAGE')
  UNION ALL
  SELECT 
    'anon'::TEXT,
    has_table_privilege('anon', 'daily_recaps', 'SELECT'),
    has_table_privilege('anon', 'daily_recaps', 'INSERT'),
    has_sequence_privilege('anon', 'daily_recaps_id_seq', 'USAGE');
END;
$$ LANGUAGE plpgsql;

-- Run the permission check
SELECT * FROM check_daily_recaps_permissions();
