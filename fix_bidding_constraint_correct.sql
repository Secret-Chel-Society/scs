-- Fix bidding system constraints to match actual database schema
-- This script adds the proper constraints based on the actual player_bidding table structure

-- Add a unique constraint to prevent teams from having multiple active bids for the same player
-- This constraint allows only one active bid per team per player
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_bidding_unique_active_bid 
ON player_bidding (player_id, team_id) 
WHERE status = 'Active' OR status IS NULL;

-- Add a check constraint to ensure bid amounts are positive (already exists in schema)
-- The schema already has: CHECK (bid_amount > 0)

-- Add a check constraint to ensure bid amounts meet minimum requirements
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

-- Note: This script matches the actual database schema where status values are:
-- 'Active', 'Won', 'Outbid', 'Expired' (not lowercase 'active')
