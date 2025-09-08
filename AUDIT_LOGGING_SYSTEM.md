# Audit Logging System

## Overview
The audit logging system provides a comprehensive way to track and monitor user actions within the application. It records important system events, user activities, and security-related actions for compliance, debugging, and monitoring purposes.

## Database Schema

### `audit_logs` Table
```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_audit_logs_user_id` - For quick lookups by user
- `idx_audit_logs_action` - For filtering by action type
- `idx_audit_logs_created_at` - For time-based queries

## Security

### Row Level Security (RLS)
1. **Admin Access**: Users with 'admin' or 'superadmin' roles can view all audit logs
2. **User Access**: Users can only view their own audit logs

## Usage

### Logging an Action
```typescript
import { createClient } from '@supabase/supabase-js';

const logAction = async ({
  action,
  userId,
  details,
  ipAddress,
  userAgent
}: {
  action: string;
  userId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role for RLS bypass
  );

  await supabase.from('audit_logs').insert({
    action,
    user_id: userId,
    details,
    ip_address: ipAddress,
    user_agent: userAgent
  });
};
```

### Example Usage
```typescript
// Log a user login
await logAction({
  action: 'user_login',
  userId: 'user-uuid-here',
  ipAddress: '192.168.1.1',
  userAgent: req.headers['user-agent']
});

// Log a sensitive action
await logAction({
  action: 'user_password_change',
  userId: 'user-uuid-here',
  details: { changed_at: new Date().toISOString() }
});
```

## Common Actions to Audit

### User Management
- `user_login` - User logs in
- `user_logout` - User logs out
- `user_password_change` - Password changed
- `user_email_update` - Email address updated

### Bidding System
- `bid_placed` - New bid placed
- `bid_updated` - Bid amount updated
- `bid_withdrawn` - Bid withdrawn
- `bid_won` - Bid won by user
- `bid_expired` - Bid expired

### Team Management
- `team_join` - User joined a team
- `team_leave` - User left a team
- `team_role_change` - User's role in team changed

## Querying Audit Logs

### Get All Logs (Admin Only)
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

### Get Logs for a Specific User
```sql
SELECT * FROM audit_logs 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Search by Action Type
```sql
SELECT * FROM audit_logs 
WHERE action = 'user_login'
ORDER BY created_at DESC;
```

## Maintenance

### Cleanup Old Logs
To prevent the audit log table from growing too large, consider implementing a scheduled cleanup:

```sql
-- Delete logs older than 1 year
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Migration History
- **2024-09-08**: Initial implementation of audit logging system
