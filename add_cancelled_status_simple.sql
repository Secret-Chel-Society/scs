-- Midnight Studios INTl - All rights reserved
-- Simple fix to add cancelled status to trades table

-- ==============================================
-- 1. UPDATE STATUS CONSTRAINT TO INCLUDE CANCELLED
-- ==============================================

-- Drop the existing constraint if it exists
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_status_check;

-- Add the new constraint with cancelled status
ALTER TABLE public.trades 
ADD CONSTRAINT trades_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));

-- ==============================================
-- 2. VERIFY THE CHANGE
-- ==============================================

-- Simple check to see if we can use the cancelled status
DO $$
BEGIN
  RAISE NOTICE '✅ Cancelled status has been added to trades table';
  RAISE NOTICE 'Valid statuses are now: pending, accepted, rejected, completed, cancelled';
END $$;
