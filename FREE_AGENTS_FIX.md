# Fix: Free Agents Not Showing in Bidding Section

## Root Causes

1. **Tab trigger mismatch** - Code looked for "free-agents" tab but actual tab is "bids"
2. **Bidding status API failing** - Same sequence permission error as before
3. **API permission issues** - `/api/free-agents` might have access issues

## Quick Fixes Applied

### 1. Fixed Tab Trigger ✅
Changed the useEffect to trigger on "bids" tab instead of "free-agents":
```typescript
useEffect(() => {
  if (activeTab === "bids" && teamData?.id) {
    console.log("Switching to bids tab, loading free agents")
    loadFreeAgents()
  }
}, [activeTab, teamData?.id])
```

### 2. Need to Enable Bidding ⚠️
The bidding system might be disabled. Run the sequence permission fix first:

**In Supabase SQL Editor:**
```sql
-- Fix sequence permissions (run this first)
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE system_settings_id_seq TO service_role;
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
```

### 3. Enable Bidding in Admin Settings
1. Go to `/admin/settings`
2. Click "Bidding" tab  
3. Enable bidding toggle
4. This should now work without sequence errors

## Debugging Steps

If free agents still don't show:

### Check Browser Console
1. Go to `/management?tab=bids`
2. Open browser dev tools → Console
3. Look for errors from:
   - `loadFreeAgents()` function
   - `/api/free-agents` request
   - `/api/bidding/status` request

### Check API Response
Test the free agents API directly:
```bash
curl http://localhost:3000/api/free-agents
```

Should return JSON with `freeAgents` array.

### Verify Bidding Status
```bash
curl http://localhost:3000/api/bidding/status
```

Should return `{"enabled": true}`.

## What Makes a Player a Free Agent

According to `/api/free-agents/route.ts`:
1. Player has **approved** season registration for active season
2. Player has `team_id: null` in players table (no team assigned)
3. Player has valid user account with gamer_tag

## Manual Override for Testing

If bidding is disabled but you want to test, temporarily modify the management panel:

```typescript
// In management page, change this line:
const canBid = isBiddingEnabled && /* other conditions */

// To this for testing:
const canBid = true && /* other conditions */
```

## Expected Behavior After Fix

1. Go to `/management?tab=bids`
2. See "Free Agents" section with available players
3. Each player shows:
   - Gamer tag
   - Position(s)
   - Console
   - Current bid (if any)
   - "Bid" button (if bidding enabled)

If still having issues, check the browser console for specific error messages!
