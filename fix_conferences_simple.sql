-- Simple fix for conferences and standings
-- Run this in Supabase SQL Editor

-- 1. Insert conferences if they don't exist
INSERT INTO public.conferences (name, description, color, created_at, updated_at)
VALUES
    ('Eastern Conference', 'Eastern Conference teams', '#3b82f6', NOW(), NOW()),
    ('Western Conference', 'Western Conference teams', '#ef4444', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Assign teams to conferences (modify team names to match your actual teams)
-- Get Eastern Conference ID and assign teams
WITH eastern_conf AS (
    SELECT id FROM public.conferences WHERE name = 'Eastern Conference' LIMIT 1
)
UPDATE public.teams
SET conference_id = (SELECT id FROM eastern_conf)
WHERE name IN (
    'Toronto Maple Leafs', 'Montreal Canadiens', 'Ottawa Senators', 'Boston Bruins',
    'Buffalo Sabres', 'Detroit Red Wings', 'Tampa Bay Lightning', 'Florida Panthers',
    'New York Rangers', 'New York Islanders', 'New Jersey Devils', 'Philadelphia Flyers',
    'Pittsburgh Penguins', 'Washington Capitals', 'Carolina Hurricanes', 'Columbus Blue Jackets'
)
AND conference_id IS NULL;

-- Get Western Conference ID and assign teams
WITH western_conf AS (
    SELECT id FROM public.conferences WHERE name = 'Western Conference' LIMIT 1
)
UPDATE public.teams
SET conference_id = (SELECT id FROM western_conf)
WHERE name IN (
    'Vancouver Canucks', 'Calgary Flames', 'Edmonton Oilers', 'Winnipeg Jets',
    'Chicago Blackhawks', 'St. Louis Blues', 'Nashville Predators', 'Dallas Stars',
    'Minnesota Wild', 'Colorado Avalanche', 'Arizona Coyotes', 'Vegas Golden Knights',
    'Los Angeles Kings', 'Anaheim Ducks', 'San Jose Sharks', 'Seattle Kraken'
)
AND conference_id IS NULL;

-- 3. Verify the setup
SELECT
    t.name as team_name,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
ORDER BY c.name, t.name;
