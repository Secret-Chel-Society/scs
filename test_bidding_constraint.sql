-- Test script to verify bidding constraints are working
-- This should help identify if the constraints were properly applied

-- 1. Check if the unique constraint exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'player_bidding' 
AND indexname = 'idx_player_bidding_unique_active_bid';

-- 2. Check if check constraints exist
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'player_bidding'
AND tc.constraint_type = 'CHECK';

-- 3. Test the constraint by trying to insert duplicate active bids
-- This should fail if the constraint is working
DO $$
DECLARE
    test_player_id uuid;
    test_team_id uuid;
BEGIN
    -- Get a sample player and team ID
    SELECT id INTO test_player_id FROM players LIMIT 1;
    SELECT id INTO test_team_id FROM teams LIMIT 1;
    
    IF test_player_id IS NOT NULL AND test_team_id IS NOT NULL THEN
        -- Insert first bid (should succeed)
        INSERT INTO player_bidding (player_id, team_id, bid_amount, bid_expires_at, status)
        VALUES (test_player_id, test_team_id, 1000000, NOW() + INTERVAL '4 hours', 'active');
        
        RAISE NOTICE 'First bid inserted successfully';
        
        -- Try to insert second bid from same team for same player (should fail)
        BEGIN
            INSERT INTO player_bidding (player_id, team_id, bid_amount, bid_expires_at, status)
            VALUES (test_player_id, test_team_id, 2000000, NOW() + INTERVAL '4 hours', 'active');
            
            RAISE NOTICE 'ERROR: Second bid was allowed - constraint is NOT working!';
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'SUCCESS: Constraint is working - duplicate bid blocked';
            WHEN OTHERS THEN
                RAISE NOTICE 'ERROR: Unexpected error: %', SQLERRM;
        END;
        
        -- Clean up test data
        DELETE FROM player_bidding 
        WHERE player_id = test_player_id 
        AND team_id = test_team_id;
        
    ELSE
        RAISE NOTICE 'No test data available - skipping constraint test';
    END IF;
END $$;
