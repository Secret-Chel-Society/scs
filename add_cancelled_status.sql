-- Midnight Studios INTl - All rights reserved
-- Add cancelled status to trades table

-- ==============================================
-- 1. UPDATE STATUS CONSTRAINT TO INCLUDE CANCELLED
-- ==============================================

-- First, drop the existing constraint
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_status_check;

-- Add the new constraint with cancelled status
ALTER TABLE public.trades 
ADD CONSTRAINT trades_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));

-- ==============================================
-- 2. VERIFY THE CHANGE
-- ==============================================

-- Check if the constraint was added successfully
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'trades_status_check';

-- ==============================================
-- 3. TEST THE NEW STATUS
-- ==============================================

-- Test that we can insert a cancelled trade (this should work)
DO $$
BEGIN
  -- This is just a test - we'll rollback
  BEGIN
    -- Try to insert a test record with cancelled status
    INSERT INTO public.trades (team1_id, team2_id, status) 
    VALUES (
      (SELECT id FROM teams LIMIT 1), 
      (SELECT id FROM teams LIMIT 1 OFFSET 1), 
      'cancelled'
    );
    
    -- If we get here, the status is valid
    RAISE NOTICE '✅ Cancelled status is now valid';
    
    -- Rollback the test insert
    ROLLBACK;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Cancelled status is not valid: %', SQLERRM;
  END;
END $$;
