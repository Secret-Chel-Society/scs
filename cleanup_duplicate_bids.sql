-- OPTIONAL: Cleanup script for duplicate bids
-- WARNING: This script will DELETE duplicate bids - review carefully before running
-- Run this ONLY if you want to clean up existing duplicate bids

-- First, let's see what duplicate bids exist
SELECT 
    player_id,
    team_id,
    COUNT(*) as bid_count,
    ARRAY_AGG(id) as bid_ids,
    ARRAY_AGG(bid_amount) as bid_amounts,
    ARRAY_AGG(created_at) as created_dates
FROM player_bidding 
WHERE status = 'active' OR status IS NULL
GROUP BY player_id, team_id
HAVING COUNT(*) > 1
ORDER BY bid_count DESC;

-- If you want to proceed with cleanup, uncomment the section below:
/*
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
*/
