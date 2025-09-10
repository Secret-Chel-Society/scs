-- Midnight Studios INTl - All rights reserved
-- Fix team assignment issues causing trade routing problems

-- ==============================================
-- 1. CHECK CURRENT TEAM ASSIGNMENTS
-- ==============================================

SELECT 
  u.gamer_tag_id,
  u.id as user_id,
  p.team_id,
  t.name as current_team_name,
  p.role
FROM users u
LEFT JOIN players p ON u.id = p.user_id
LEFT JOIN teams t ON p.team_id = t.id
WHERE u.gamer_tag_id IN ('Rage_Baiter1', 'DarkWolf9235')
ORDER BY u.gamer_tag_id;

-- ==============================================
-- 2. FIND CORRECT TEAM ASSIGNMENTS
-- ==============================================

-- Check which teams these users should be on based on trade notifications
SELECT 
  'Rage_Baiter1' as gamer_tag,
  'Ottawa Firestorm' as should_be_on_team,
  t.id as team_id
FROM teams t
WHERE t.name = 'Ottawa Firestorm'

UNION ALL

SELECT 
  'DarkWolf9235' as gamer_tag,
  'Seattle Wraith' as should_be_on_team,
  t.id as team_id
FROM teams t
WHERE t.name = 'Seattle Wraith';

-- ==============================================
-- 3. FIX TEAM ASSIGNMENTS (SAFE VERSION)
-- ==============================================

-- First, let's see what needs to be fixed
DO $$
DECLARE
  rage_user_id UUID;
  darkwolf_user_id UUID;
  ottawa_team_id UUID;
  seattle_team_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO rage_user_id FROM users WHERE gamer_tag_id = 'Rage_Baiter1';
  SELECT id INTO darkwolf_user_id FROM users WHERE gamer_tag_id = 'DarkWolf9235';
  
  -- Get team IDs
  SELECT id INTO ottawa_team_id FROM teams WHERE name = 'Ottawa Firestorm';
  SELECT id INTO seattle_team_id FROM teams WHERE name = 'Seattle Wraith';
  
  -- Check current assignments
  RAISE NOTICE 'Current assignments:';
  RAISE NOTICE 'Rage_Baiter1 (user_id: %) should be on Ottawa Firestorm (team_id: %)', rage_user_id, ottawa_team_id;
  RAISE NOTICE 'DarkWolf9235 (user_id: %) should be on Seattle Wraith (team_id: %)', darkwolf_user_id, seattle_team_id;
  
  -- Fix Rage_Baiter1 assignment if needed
  IF rage_user_id IS NOT NULL AND ottawa_team_id IS NOT NULL THEN
    UPDATE players 
    SET team_id = ottawa_team_id, updated_at = now()
    WHERE user_id = rage_user_id;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Fixed Rage_Baiter1 team assignment to Ottawa Firestorm';
    ELSE
      RAISE NOTICE '⚠️ Rage_Baiter1 not found in players table';
    END IF;
  END IF;
  
  -- Fix DarkWolf9235 assignment if needed
  IF darkwolf_user_id IS NOT NULL AND seattle_team_id IS NOT NULL THEN
    UPDATE players 
    SET team_id = seattle_team_id, updated_at = now()
    WHERE user_id = darkwolf_user_id;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Fixed DarkWolf9235 team assignment to Seattle Wraith';
    ELSE
      RAISE NOTICE '⚠️ DarkWolf9235 not found in players table';
    END IF;
  END IF;
END $$;

-- ==============================================
-- 4. VERIFY FIXES
-- ==============================================

SELECT 
  u.gamer_tag_id,
  u.id as user_id,
  p.team_id,
  t.name as current_team_name,
  p.role,
  CASE 
    WHEN u.gamer_tag_id = 'Rage_Baiter1' AND t.name = 'Ottawa Firestorm' THEN '✅ CORRECT'
    WHEN u.gamer_tag_id = 'DarkWolf9235' AND t.name = 'Seattle Wraith' THEN '✅ CORRECT'
    ELSE '❌ INCORRECT'
  END as status
FROM users u
LEFT JOIN players p ON u.id = p.user_id
LEFT JOIN teams t ON p.team_id = t.id
WHERE u.gamer_tag_id IN ('Rage_Baiter1', 'DarkWolf9235')
ORDER BY u.gamer_tag_id;

-- ==============================================
-- 5. CHECK FOR OTHER TEAM ASSIGNMENT ISSUES
-- ==============================================

-- Look for other potential team assignment issues
SELECT 
  u.gamer_tag_id,
  t.name as team_name,
  p.role,
  COUNT(*) as count
FROM users u
JOIN players p ON u.id = p.user_id
JOIN teams t ON p.team_id = t.id
WHERE p.role IN ('GM', 'AGM', 'Owner')
GROUP BY u.gamer_tag_id, t.name, p.role
HAVING COUNT(*) > 1
ORDER BY count DESC;
