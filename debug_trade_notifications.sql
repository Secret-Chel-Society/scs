-- Midnight Studios INTl - All rights reserved
-- Debug trade notification routing issues

-- ==============================================
-- 1. CHECK RECENT TRADE NOTIFICATIONS
-- ==============================================

SELECT 
  id,
  user_id,
  title,
  message,
  created_at,
  read,
  CASE 
    WHEN title LIKE 'Trade Proposal from %' THEN 'INCOMING'
    WHEN title LIKE 'Trade Proposal to %' THEN 'OUTGOING'
    ELSE 'OTHER'
  END as notification_type
FROM notifications 
WHERE title LIKE '%Trade Proposal%'
ORDER BY created_at DESC 
LIMIT 10;

-- ==============================================
-- 2. CHECK TEAM MANAGERS
-- ==============================================

SELECT 
  t.name as team_name,
  t.id as team_id,
  p.user_id,
  p.role,
  u.gamer_tag_id
FROM teams t
LEFT JOIN players p ON t.id = p.team_id
LEFT JOIN users u ON p.user_id = u.id
WHERE p.role IN ('GM', 'AGM', 'Owner')
ORDER BY t.name, p.role;

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
  created_at
FROM notifications 
WHERE title LIKE '%Trade Proposal%'
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================
-- 4. CHECK TRADES TABLE
-- ==============================================

SELECT 
  id,
  team1_id,
  team2_id,
  status,
  created_at,
  updated_at
FROM trades 
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================
-- 5. CHECK FOR POTENTIAL ROUTING ISSUES
-- ==============================================

-- Check if there are notifications sent to wrong users
SELECT 
  n.user_id,
  n.title,
  u.gamer_tag_id,
  p.role,
  t.name as team_name
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN players p ON n.user_id = p.user_id
LEFT JOIN teams t ON p.team_id = t.id
WHERE n.title LIKE '%Trade Proposal%'
ORDER BY n.created_at DESC 
LIMIT 10;
