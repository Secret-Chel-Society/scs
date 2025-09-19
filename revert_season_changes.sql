-- Revert Season Changes
-- This script reverts the season changes that broke everything

-- 1. First, let's see what seasons exist and their current state
SELECT 
    'Current Season State' as step,
    id,
    name,
    is_active,
    start_date,
    end_date,
    created_at
FROM seasons 
ORDER BY created_at DESC;

-- 2. Check what the original active season should be
-- Let's see all seasons and their creation dates to identify the original active one
SELECT 
    'All Seasons by Creation Date' as step,
    id,
    name,
    is_active,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as creation_order
FROM seasons 
ORDER BY created_at ASC;

-- 3. Restore the original active season (usually the first one created)
-- We'll set the first created season as active and others as inactive
UPDATE seasons 
SET is_active = FALSE, 
    updated_at = NOW()
WHERE id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE seasons 
SET is_active = TRUE, 
    updated_at = NOW()
WHERE id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 4. Update system settings to use the original active season
UPDATE system_settings 
SET value = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE key = 'current_season_id';

-- 5. Update all other tables to use the original active season
UPDATE season_registrations 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE team_assignments 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE matches 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE player_bidding 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE trades 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE waivers 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

UPDATE daily_recaps 
SET season_id = (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
),
    updated_at = NOW()
WHERE season_id IS NULL OR season_id != (
    SELECT id 
    FROM seasons 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 6. Verify the revert
SELECT 
    'After Revert - Active Season' as step,
    id,
    name,
    is_active,
    start_date,
    end_date
FROM seasons 
WHERE is_active = TRUE;

-- 7. Check system settings
SELECT 
    'System Settings After Revert' as step,
    key,
    value,
    description
FROM system_settings 
WHERE key LIKE '%season%';
