-- Midnight Studios INTl - All rights reserved
-- Test trade flow to verify everything is working

-- ==============================================
-- 1. CHECK RECENT TRADE NOTIFICATIONS
-- ==============================================

SELECT 
  id,
  user_id,
  title,
  CASE 
    WHEN title LIKE 'Trade Proposal from %' THEN 'INCOMING'
    WHEN title LIKE 'Trade Proposal to %' THEN 'OUTGOING'
    ELSE 'OTHER'
  END as notification_type,
  created_at,
  read
FROM notifications 
WHERE title LIKE '%Trade Proposal%'
ORDER BY created_at DESC 
LIMIT 10;

-- ==============================================
-- 2. CHECK WHICH USERS ARE RECEIVING NOTIFICATIONS
-- ==============================================

SELECT 
  n.user_id,
  n.title,
  u.gamer_tag_id,
  p.role,
  t.name as team_name,
  CASE 
    WHEN n.title LIKE 'Trade Proposal from %' THEN 'Should be INCOMING for this user'
    WHEN n.title LIKE 'Trade Proposal to %' THEN 'Should be OUTGOING for this user'
  END as expected_flow
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN players p ON n.user_id = p.user_id
LEFT JOIN teams t ON p.team_id = t.id
WHERE n.title LIKE '%Trade Proposal%'
ORDER BY n.created_at DESC 
LIMIT 10;

-- ==============================================
-- 3. CHECK FOR NOTIFICATIONS WITH TRADE DATA
-- ==============================================

SELECT 
  id,
  user_id,
  title,
  CASE 
    WHEN message LIKE '%TRADE_DATA:%' THEN 'HAS_TRADE_DATA'
    ELSE 'NO_TRADE_DATA'
  END as has_trade_data,
  LENGTH(message) as message_length,
  created_at
FROM notifications 
WHERE title LIKE '%Trade Proposal%'
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================
-- 4. CHECK TRADES TABLE FOR RECENT ENTRIES
-- ==============================================

SELECT 
  id,
  team1_id,
  team2_id,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN status IS NULL THEN 'NULL_STATUS'
    WHEN status = 'pending' THEN 'PENDING'
    WHEN status = 'accepted' THEN 'ACCEPTED'
    WHEN status = 'rejected' THEN 'REJECTED'
    WHEN status = 'completed' THEN 'COMPLETED'
    ELSE 'UNKNOWN_STATUS'
  END as status_type
FROM trades 
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================
-- 5. CHECK TEAM MANAGERS FOR BOTH TEAMS
-- ==============================================

SELECT 
  t.name as team_name,
  t.id as team_id,
  u.gamer_tag_id,
  p.role,
  p.user_id
FROM teams t
LEFT JOIN players p ON t.id = p.team_id
LEFT JOIN users u ON p.user_id = u.id
WHERE t.name IN ('Ottawa Firestorm', 'Seattle Wraith')
AND p.role IN ('GM', 'AGM', 'Owner')
ORDER BY t.name, p.role;

-- ==============================================
-- 6. SIMULATE TRADE NOTIFICATION QUERY
-- ==============================================

-- This simulates what the management page does to fetch trade proposals
-- For a specific user (replace with actual user_id)

-- Example for DarkWolf9235 (Seattle Wraith owner)
SELECT 
  'INCOMING_TRADES' as query_type,
  id,
  user_id,
  title,
  message,
  created_at
FROM notifications 
WHERE user_id = 'bbfc98f1-b9ea-496f-b66f-2230be52b79b' -- DarkWolf9235
AND title LIKE 'Trade Proposal from %'
AND message NOT LIKE '%STATUS:%'
ORDER BY created_at DESC

UNION ALL

SELECT 
  'OUTGOING_TRADES' as query_type,
  id,
  user_id,
  title,
  message,
  created_at
FROM notifications 
WHERE user_id = 'bbfc98f1-b9ea-496f-b66f-2230be52b79b' -- DarkWolf9235
AND title LIKE 'Trade Proposal to %'
AND message NOT LIKE '%STATUS:%'
ORDER BY created_at DESC;
