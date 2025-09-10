-- Fix waiver priority data - 100% SAFE
-- Only adds missing priority entries, never deletes anything

-- Add waiver priority entries for all teams that don't have them
INSERT INTO waiver_priority (team_id, priority)
SELECT 
    t.id as team_id,
    ROW_NUMBER() OVER (ORDER BY t.created_at) as priority
FROM teams t
WHERE NOT EXISTS (
    SELECT 1 FROM waiver_priority wp 
    WHERE wp.team_id = t.id
)
ON CONFLICT (team_id) DO NOTHING;

-- Check the results
SELECT 
    COUNT(*) as total_teams,
    (SELECT COUNT(*) FROM waiver_priority) as teams_with_priority
FROM teams;
