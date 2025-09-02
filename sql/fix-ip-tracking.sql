-- NON-DESTRUCTIVE IP tracking setup
-- Safe to run multiple times

-- Add IP tracking columns to users table (safe - only adds if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create ip_logs table (safe - only creates if not exists)
CREATE TABLE IF NOT EXISTS ip_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT
);

-- Create indexes for better performance (safe - only creates if not exists)
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_created_at ON ip_logs(created_at);

-- Create function to log IP addresses (safe - replaces if exists)
CREATE OR REPLACE FUNCTION log_ip_address(
  p_user_id UUID,
  p_ip_address VARCHAR(45),
  p_action VARCHAR(50),
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Insert into ip_logs
  INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
  VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
  RETURNING id INTO v_log_id;
  
  -- Update the users table based on the action
  IF p_action = 'register' THEN
    UPDATE users SET registration_ip = p_ip_address WHERE id = p_user_id;
  ELSIF p_action = 'login' THEN
    UPDATE users SET last_login_ip = p_ip_address, last_login_at = NOW() WHERE id = p_user_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for IP tracking
GRANT SELECT ON ip_logs TO authenticated;
GRANT ALL ON ip_logs TO service_role;

-- Note: No sequence permissions needed for UUID primary keys using uuid_generate_v4()

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR(45), VARCHAR(50), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR(45), VARCHAR(50), TEXT) TO service_role;

-- Success message
SELECT '✅ IP tracking setup completed successfully' as result;
