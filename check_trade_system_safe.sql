-- Midnight Studios INTl - All rights reserved
-- SAFE, READ-ONLY trade system diagnostic queries
-- This file only READS data and does NOT modify anything

-- ==============================================
-- 1. CHECK IF TRADES TABLE EXISTS
-- ==============================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades') 
    THEN '✅ Trades table exists'
    ELSE '❌ Trades table does NOT exist'
  END as table_status;

-- ==============================================
-- 2. CHECK TRADES TABLE STRUCTURE
-- ==============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'team1_id', 'team2_id', 'team1_players', 'team2_players', 'status', 'created_at', 'updated_at')
    THEN '✅ Required column'
    ELSE '⚠️ Optional column'
  END as column_status
FROM information_schema.columns 
WHERE table_name = 'trades' 
ORDER BY ordinal_position;

-- ==============================================
-- 3. CHECK FOR MISSING REQUIRED COLUMNS
-- ==============================================

WITH required_columns AS (
  SELECT unnest(ARRAY['id', 'team1_id', 'team2_id', 'team1_players', 'team2_players', 'status', 'created_at', 'updated_at']) as col_name
),
existing_columns AS (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'trades'
)
SELECT 
  rc.col_name,
  CASE 
    WHEN ec.column_name IS NOT NULL THEN '✅ Present'
    ELSE '❌ MISSING'
  END as status
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.col_name = ec.column_name
ORDER BY rc.col_name;

-- ==============================================
-- 4. CHECK RLS STATUS
-- ==============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS enabled'
    ELSE '⚠️ RLS disabled'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'trades';

-- ==============================================
-- 5. CHECK EXISTING POLICIES
-- ==============================================

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ Policy exists'
    ELSE '❌ No policies found'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'trades'
ORDER BY policyname;

-- ==============================================
-- 6. CHECK EXISTING TRADES DATA
-- ==============================================

SELECT 
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_trades,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_trades,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_trades,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_trades
FROM trades;

-- ==============================================
-- 7. CHECK RECENT TRADES
-- ==============================================

SELECT 
  id,
  team1_id,
  team2_id,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN status IS NULL THEN '⚠️ No status set'
    WHEN status NOT IN ('pending', 'accepted', 'rejected', 'completed') THEN '⚠️ Invalid status'
    ELSE '✅ Valid status'
  END as status_validation
FROM trades 
ORDER BY created_at DESC 
LIMIT 10;

-- ==============================================
-- 8. CHECK FOR POTENTIAL ISSUES
-- ==============================================

-- Check for trades with missing team references
SELECT 
  'Trades with missing team1_id' as issue_type,
  COUNT(*) as count
FROM trades 
WHERE team1_id IS NULL

UNION ALL

SELECT 
  'Trades with missing team2_id' as issue_type,
  COUNT(*) as count
FROM trades 
WHERE team2_id IS NULL

UNION ALL

SELECT 
  'Trades with empty player arrays' as issue_type,
  COUNT(*) as count
FROM trades 
WHERE team1_players = '[]'::jsonb AND team2_players = '[]'::jsonb

UNION ALL

SELECT 
  'Trades with NULL status' as issue_type,
  COUNT(*) as count
FROM trades 
WHERE status IS NULL;

-- ==============================================
-- 9. SUMMARY REPORT
-- ==============================================

SELECT 
  'TRADE SYSTEM DIAGNOSTIC SUMMARY' as report_title,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades') 
    THEN 'Table exists'
    ELSE 'Table missing'
  END as table_status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'trades') as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'trades') as policy_count,
  (SELECT COUNT(*) FROM trades) as total_trades,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'trades' AND rowsecurity = true)
    THEN 'RLS enabled'
    ELSE 'RLS disabled'
  END as rls_status;
