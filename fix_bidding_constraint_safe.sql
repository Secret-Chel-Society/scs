-- Safe, non-destructive fix for bidding system constraints
-- This only adds constraints and indexes without deleting any existing data

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

-- Note: This script is non-destructive and only adds constraints
-- Existing duplicate bids will remain but new ones will be prevented
-- If you need to clean up existing duplicates, run the cleanup script separately
