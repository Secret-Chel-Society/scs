-- Setup conferences and assign teams
-- Run this to create conferences and assign teams to them

-- 1. Insert sample conferences if they don't exist
INSERT INTO public.conferences (id, name, description, color, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Eastern Conference', 'Eastern Conference teams', '#3b82f6', NOW(), NOW()),
    (gen_random_uuid(), 'Western Conference', 'Western Conference teams', '#ef4444', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Get the conference IDs
WITH conference_ids AS (
    SELECT id, name FROM public.conferences WHERE name IN ('Eastern Conference', 'Western Conference')
)
SELECT 
    'Conference IDs' as info,
    id,
    name
FROM conference_ids;

-- 3. Assign teams to conferences (you can modify this based on your teams)
-- This is a sample assignment - modify the team names to match your actual teams

-- Get Eastern Conference ID
WITH eastern_conf AS (
    SELECT id FROM public.conferences WHERE name = 'Eastern Conference' LIMIT 1
)
UPDATE public.teams 
SET conference_id = (SELECT id FROM eastern_conf)
WHERE name IN (
    'Toronto Maple Leafs',
    'Montreal Canadiens', 
    'Ottawa Senators',
    'Boston Bruins',
    'Buffalo Sabres',
    'Detroit Red Wings',
    'Tampa Bay Lightning',
    'Florida Panthers',
    'New York Rangers',
    'New York Islanders',
    'New Jersey Devils',
    'Philadelphia Flyers',
    'Pittsburgh Penguins',
    'Washington Capitals',
    'Carolina Hurricanes',
    'Columbus Blue Jackets'
)
AND conference_id IS NULL;

-- Get Western Conference ID  
WITH western_conf AS (
    SELECT id FROM public.conferences WHERE name = 'Western Conference' LIMIT 1
)
UPDATE public.teams 
SET conference_id = (SELECT id FROM western_conf)
WHERE name IN (
    'Vancouver Canucks',
    'Calgary Flames',
    'Edmonton Oilers',
    'Winnipeg Jets',
    'Chicago Blackhawks',
    'St. Louis Blues',
    'Nashville Predators',
    'Dallas Stars',
    'Minnesota Wild',
    'Colorado Avalanche',
    'Arizona Coyotes',
    'Vegas Golden Knights',
    'Los Angeles Kings',
    'Anaheim Ducks',
    'San Jose Sharks',
    'Seattle Kraken'
)
AND conference_id IS NULL;

-- 4. Verify the assignments
SELECT 'Final Team Conference Assignments' as info;
SELECT 
    t.name as team_name,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
ORDER BY c.name, t.name;
