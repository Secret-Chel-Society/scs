-- Midnight Studios INTl - All rights reserved
-- SAFE, NON-DESTRUCTIVE trade system database fixes

-- ==============================================
-- 1. SAFELY ENSURE TRADES TABLE HAS PROPER STRUCTURE
-- ==============================================

-- Create trades table ONLY if it doesn't exist (non-destructive)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team1_id UUID NOT NULL REFERENCES public.teams(id),
  team2_id UUID NOT NULL REFERENCES public.teams(id),
  team1_players JSONB NOT NULL DEFAULT '[]'::jsonb,
  team2_players JSONB NOT NULL DEFAULT '[]'::jsonb,
  trade_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- SAFELY add status column if it doesn't exist (non-destructive)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'status') THEN
    ALTER TABLE public.trades ADD COLUMN status TEXT DEFAULT 'pending';
    -- Add constraint separately to avoid conflicts
    ALTER TABLE public.trades ADD CONSTRAINT trades_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
  END IF;
END $$;

-- SAFELY add updated_at column if it doesn't exist (non-destructive)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'updated_at') THEN
    ALTER TABLE public.trades ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    -- Make it NOT NULL after adding default values
    ALTER TABLE public.trades ALTER COLUMN updated_at SET NOT NULL;
  END IF;
END $$;

-- ==============================================
-- 2. SAFELY SET UP RLS POLICIES (NON-DESTRUCTIVE)
-- ==============================================

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'trades' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- SAFELY create policies only if they don't exist (non-destructive)
DO $$
BEGIN
  -- Create read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trades' AND policyname = 'Trades are viewable by everyone'
  ) THEN
    CREATE POLICY "Trades are viewable by everyone" 
    ON public.trades FOR SELECT 
    USING (true);
  END IF;

  -- Create insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trades' AND policyname = 'Authenticated users can insert trades'
  ) THEN
    CREATE POLICY "Authenticated users can insert trades" 
    ON public.trades FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  END IF;

  -- Create update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trades' AND policyname = 'Only admins can update trades'
  ) THEN
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
  END IF;

  -- Create delete policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trades' AND policyname = 'Only admins can delete trades'
  ) THEN
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
  END IF;
END $$;

-- ==============================================
-- 3. CREATE TRADE PROCESSING FUNCTION
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
-- 4. CREATE TRADE NOTIFICATION FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION create_trade_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, link, read)
  VALUES (p_user_id, p_title, p_message, p_link, false)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- ==============================================
-- 5. VERIFY TRADES TABLE STRUCTURE
-- ==============================================

-- Check if trades table exists and has correct structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades') THEN
    RAISE NOTICE 'Trades table exists';
    
    -- Check for required columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'status') THEN
      RAISE NOTICE 'Status column exists';
    ELSE
      RAISE NOTICE 'Status column missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'updated_at') THEN
      RAISE NOTICE 'Updated_at column exists';
    ELSE
      RAISE NOTICE 'Updated_at column missing';
    END IF;
  ELSE
    RAISE NOTICE 'Trades table does not exist';
  END IF;
END $$;
