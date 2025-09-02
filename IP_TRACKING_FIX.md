# Fix IP Tracking Issues (NON-DESTRUCTIVE)

## Problem
IP tracking in admin settings not working due to missing database tables, columns, or permission issues.

## ✅ SAFE Quick Fix Options

### Option 1: Run SQL Directly (Recommended)
Execute this **non-destructive** SQL in your Supabase SQL editor:

```sql
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

-- Create function to log IP addresses
CREATE OR REPLACE FUNCTION log_ip_address(
  p_user_id UUID,
  p_ip_address VARCHAR(45),
  p_action VARCHAR(50),
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
  VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
  RETURNING id INTO v_log_id;
  
  IF p_action = 'register' THEN
    UPDATE users SET registration_ip = p_ip_address WHERE id = p_user_id;
  ELSIF p_action = 'login' THEN
    UPDATE users SET last_login_ip = p_ip_address, last_login_at = NOW() WHERE id = p_user_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON ip_logs TO authenticated;
GRANT ALL ON ip_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ip_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE ip_logs_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION log_ip_address(UUID, VARCHAR(45), VARCHAR(50), TEXT) TO authenticated;
```

### Option 2: Run Migration File
Navigate to your Supabase dashboard → SQL Editor → Run the file:
`sql/fix-ip-tracking.sql`

### Option 3: API Fix (if server running)
```bash
curl -X POST http://localhost:3000/api/admin/fix-ip-tracking
```

## What This Fixes

✅ **Creates missing tables**: `ip_logs` table for tracking IP history  
✅ **Adds missing columns**: `registration_ip`, `last_login_ip`, `last_login_at` to users table  
✅ **Creates indexes**: For better query performance  
✅ **Sets up function**: `log_ip_address()` for easy IP logging  
✅ **Grants permissions**: Proper access for authenticated users and service role  
✅ **Fixes sequences**: Grants sequence permissions to prevent permission errors  

## Why This is Safe

- Uses `IF NOT EXISTS` - won't break existing tables
- Uses `ADD COLUMN IF NOT EXISTS` - won't duplicate columns  
- Only **grants** permissions, doesn't revoke anything
- Creates indexes only if they don't exist
- Safe to run multiple times

## Testing

After running the fix:

1. Go to `/admin/settings`
2. Click "IP Tracking" tab
3. Should load without errors and show IP tracking data
4. Migration status should show as "complete"

The IP tracking functionality should now work properly!
