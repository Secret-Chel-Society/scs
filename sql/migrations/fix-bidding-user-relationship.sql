-- Fix bidding system by adding user_id to player_bidding table
-- This migration adds the missing user_id field to properly link bids to users

-- Add user_id column to player_bidding table
ALTER TABLE player_bidding 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_player_bidding_user_id ON player_bidding(user_id);

-- Update existing records to populate user_id from players table
UPDATE player_bidding 
SET user_id = players.user_id
FROM players 
WHERE player_bidding.player_id = players.id;

-- Make user_id NOT NULL after populating existing data
ALTER TABLE player_bidding 
ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure data integrity
ALTER TABLE player_bidding 
ADD CONSTRAINT player_bidding_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

