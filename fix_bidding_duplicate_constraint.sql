-- Fix bidding system to prevent teams from placing duplicate bids for the same player
-- This migration adds constraints to ensure proper bid validation

-- First, clean up any existing duplicate bids from the same team for the same player
-- Keep only the highest bid from each team for each player
WITH duplicate_bids AS (
  SELECT 
    pb1.id,
    pb1.player_id,
    pb1.team_id,
    pb1.bid_amount,
    ROW_NUMBER() OVER (
      PARTITION BY pb1.player_id, pb1.team_id 
      ORDER BY pb1.bid_amount DESC, pb1.created_at DESC
    ) as rn
  FROM player_bidding pb1
  WHERE pb1.status = 'active' OR pb1.status IS NULL
)
DELETE FROM player_bidding 
WHERE id IN (
  SELECT id FROM duplicate_bids WHERE rn > 1
);

-- Add a unique constraint to prevent teams from having multiple active bids for the same player
-- This constraint allows only one active bid per team per player
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_bidding_unique_active_bid 
ON player_bidding (player_id, team_id) 
WHERE status = 'active' OR status IS NULL;

-- Add a check constraint to ensure bid amounts are positive
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_bid_amount_positive' 
        AND table_name = 'player_bidding'
    ) THEN
        ALTER TABLE player_bidding 
        ADD CONSTRAINT check_bid_amount_positive 
        CHECK (bid_amount > 0);
    END IF;
END $$;

-- Add a check constraint to ensure bid amounts are in reasonable increments
-- This prevents bids that are too small (less than $500k)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_bid_amount_minimum' 
        AND table_name = 'player_bidding'
    ) THEN
        ALTER TABLE player_bidding 
        ADD CONSTRAINT check_bid_amount_minimum 
        CHECK (bid_amount >= 500000);
    END IF;
END $$;

-- Create an index for better performance on bid queries
CREATE INDEX IF NOT EXISTS idx_player_bidding_player_team_status 
ON player_bidding (player_id, team_id, status);

-- Create an index for finding highest bids per player
CREATE INDEX IF NOT EXISTS idx_player_bidding_player_amount_status 
ON player_bidding (player_id, bid_amount DESC, status);

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_player_bidding_unique_active_bid IS 
'Ensures each team can only have one active bid per player at a time';
