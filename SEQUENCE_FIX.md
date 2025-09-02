# Fix System Settings Sequence Permission Error (NON-DESTRUCTIVE)

## Problem
Getting `permission denied for sequence system_settings_id_seq` when admins try to activate bidding.

## ✅ SAFE Quick Fix

### Run This SQL (Safe - Only Grants Permissions)
Execute this **non-destructive** SQL in your Supabase SQL editor:

```sql
-- NON-DESTRUCTIVE sequence permissions fix
-- Safe to run multiple times, only grants permissions

-- Grant sequence permissions for system_settings_id_seq
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;

-- Grant table permissions for system_settings  
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
```

**Why This is Safe:**
- Only **grants** permissions, doesn't drop or alter anything
- Safe to run multiple times
- Doesn't change existing RLS policies
- Doesn't modify table structure

### Option 2: Run Migration File
Navigate to your Supabase dashboard → SQL Editor → Run the file:
`sql/migrations/fix-sequence-permissions.sql`

### Option 3: Start Dev Server and Run API Fix
1. Start your development server: `npm run dev`
2. Run the fix: `curl -X POST http://localhost:3000/api/admin/fix-sequence-permissions`

## What This Fixes
- Allows authenticated users to access sequence for system_settings inserts/updates
- Grants service role full permissions for admin operations
- Creates proper RLS policies for system_settings table
- Enables admins to modify bidding settings without permission errors

## Verification
After running the fix:
1. Go to `/admin/settings`
2. Click on "Bidding" tab
3. Try to toggle bidding on/off - should work without errors

The sequence permission error should be completely resolved!
