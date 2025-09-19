-- Midnight Studios INTl - All rights reserved
-- Targeted fix for existing trades table schema issues

-- ==============================================
-- 1. FIX STATUS COLUMN CONSTRAINT
-- ==============================================

-- Add proper status constraint if it doesn't exist
DO $$
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'trades_status_check' 
    AND table_name = 'trades'
  ) THEN
    -- Add the constraint
    ALTER TABLE public.trades 
    ADD CONSTRAINT trades_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
  END IF;
END $$;

-- ==============================================
-- 2. ENSURE PROPER COLUMN DEFAULTS
-- ==============================================

-- Fix team1_players and team2_players defaults
DO $$
BEGIN
  -- Set default for team1_players if it's NULL
  UPDATE public.trades 
  SET team1_players = '[]'::jsonb 
  WHERE team1_players IS NULL;
  
  -- Set default for team2_players if it's NULL
  UPDATE public.trades 
  SET team2_players = '[]'::jsonb 
  WHERE team2_players IS NULL;
  
  -- Set default for status if it's NULL
  UPDATE public.trades 
  SET status = 'pending' 
  WHERE status IS NULL;
END $$;

-- ==============================================
-- 3. SET UP RLS POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to do)
DROP POLICY IF EXISTS "Trades are viewable by everyone" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can insert trades" ON public.trades;
DROP POLICY IF EXISTS "Only admins can update trades" ON public.trades;
DROP POLICY IF EXISTS "Only admins can delete trades" ON public.trades;

-- Create new policies
CREATE POLICY "Trades are viewable by everyone" 
ON public.trades FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert trades" 
ON public.trades FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Only admins can update trades" 
ON public.trades FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT auth.uid() 
    FROM public.players 
    WHERE role = 'Admin'
  )
);

CREATE POLICY "Only admins can delete trades" 
ON public.trades FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT auth.uid() 
    FROM public.players 
    WHERE role = 'Admin'
  )
);

-- ==============================================
-- 4. CREATE TRADE PROCESSING FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION process_trade(
  p_trade_id UUID,
  p_accept BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade RECORD;
  v_player_id UUID;
  v_team1_id UUID;
  v_team2_id UUID;
  v_result JSONB;
BEGIN
  -- Get trade details
  SELECT * INTO v_trade FROM trades WHERE id = p_trade_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade not found');
  END IF;
  
  -- Update trade status
  UPDATE trades 
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END,
      updated_at = now()
  WHERE id = p_trade_id;
  
  -- If trade is accepted, process player transfers
  IF p_accept THEN
    v_team1_id := v_trade.team1_id;
    v_team2_id := v_trade.team2_id;
    
    -- Move team1 players to team2
    FOR v_player_id IN SELECT jsonb_array_elements_text(v_trade.team1_players->'id')
    LOOP
      UPDATE players SET team_id = v_team2_id WHERE id = v_player_id::UUID;
    END LOOP;
    
    -- Move team2 players to team1
    FOR v_player_id IN SELECT jsonb_array_elements_text(v_trade.team2_players->'id')
    LOOP
      UPDATE players SET team_id = v_team1_id WHERE id = v_player_id::UUID;
    END LOOP;
    
    -- Update trade status to completed
    UPDATE trades SET status = 'completed', updated_at = now() WHERE id = p_trade_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'trade_id', p_trade_id, 'status', v_trade.status);
END;
$$;

-- ==============================================
-- 5. VERIFY FIXES
-- ==============================================

-- Check if everything is working
DO $$
BEGIN
  -- Check if status constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'trades_status_check' 
    AND table_name = 'trades'
  ) THEN
    RAISE NOTICE '✅ Status constraint added successfully';
  ELSE
    RAISE NOTICE '❌ Status constraint failed to add';
  END IF;
  
  -- Check if RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'trades' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS enabled successfully';
  ELSE
    RAISE NOTICE '❌ RLS failed to enable';
  END IF;
  
  -- Check if policies exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trades' AND policyname = 'Trades are viewable by everyone'
  ) THEN
    RAISE NOTICE '✅ RLS policies created successfully';
  ELSE
    RAISE NOTICE '❌ RLS policies failed to create';
  END IF;
  
  RAISE NOTICE '🎉 Trade system fixes completed!';
END $$;
