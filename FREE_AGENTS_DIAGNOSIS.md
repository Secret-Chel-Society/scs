# Free Agents Not Showing - Diagnosis Guide

## Step 1: Run Diagnostic Query

**In Supabase SQL Editor**, run `sql/debug-free-agents.sql` to see what's wrong.

This will check:
- ✅ Is there an active season?
- ✅ Are there approved season registrations?
- ✅ Do users have player records?
- ✅ Are player records missing team assignments?

## Common Issues & Fixes

### Issue 1: No Active Season
**Symptom**: Query shows no active seasons
**Fix**: Set a season as active:
```sql
UPDATE seasons SET is_active = true WHERE id = 'your-season-id';
```

### Issue 2: No Approved Registrations  
**Symptom**: All registrations are 'Pending' or 'Rejected'
**Fix**: Approve some registrations:
```sql
UPDATE season_registrations 
SET status = 'Approved' 
WHERE status = 'Pending' 
  AND season_id = (SELECT id FROM seasons WHERE is_active = true);
```

### Issue 3: Missing Player Records ⚠️ **Most Common**
**Symptom**: Users have approved registrations but no player records
**Fix**: Run `sql/fix-missing-player-records.sql`

This creates player records for users who:
- Have approved season registrations  
- Don't have player records yet
- Are active users

### Issue 4: All Players Have Teams
**Symptom**: All player records have team_id assigned
**Fix**: Create some free agents:
```sql
-- Make some players free agents for testing
UPDATE players 
SET team_id = NULL, status = 'free_agent'
WHERE user_id IN (
  SELECT user_id FROM season_registrations 
  WHERE status = 'Approved' 
  LIMIT 3
);
```

## Expected Free Agent Criteria

A user shows up as a free agent when:
1. ✅ Has approved registration for active season
2. ✅ Has player record with `team_id = NULL`
3. ✅ User account is `is_active = true` 
4. ✅ Player status is 'free_agent' or 'active'

## Test the Fix

After running fixes:
1. Go to `/management?tab=bids`
2. Should see free agents in the "Available Free Agents" section
3. Check browser console for any API errors

## Create Test Data (If Needed)

If you have no data at all:
```sql
-- 1. Create active season
INSERT INTO seasons (name, is_active, start_date, end_date) 
VALUES ('Season 1', true, now(), now() + interval '6 months');

-- 2. Create test users (adjust as needed)
INSERT INTO users (email, gamer_tag_id, primary_position, console)
VALUES 
  ('test1@example.com', 'TestPlayer1', 'Center', 'Xbox'),
  ('test2@example.com', 'TestPlayer2', 'Left Wing', 'PS5');

-- 3. Create approved registrations
INSERT INTO season_registrations (user_id, season_id, primary_position, gamer_tag, console, status)
SELECT u.id, s.id, u.primary_position, u.gamer_tag_id, u.console, 'Approved'
FROM users u, seasons s 
WHERE s.is_active = true AND u.gamer_tag_id LIKE 'TestPlayer%';

-- 4. Create free agent player records  
INSERT INTO players (user_id, team_id, salary, role, status)
SELECT u.id, NULL, 750000, 'Player', 'free_agent'
FROM users u 
WHERE u.gamer_tag_id LIKE 'TestPlayer%';
```

## Verify API Response

Test the API directly:
```bash
curl http://localhost:3000/api/free-agents
```

Should return:
```json
{
  "freeAgents": [
    {
      "id": "player-uuid",
      "salary": 750000,
      "users": {
        "gamer_tag_id": "PlayerName",
        "primary_position": "Center",
        "console": "Xbox"
      }
    }
  ]
}
```
