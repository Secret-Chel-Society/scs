-- Setup conferences and assign teams
-- Run this in Supabase SQL Editor

-- 1. Create conferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on conferences table
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for conferences
CREATE POLICY "Conferences are viewable by everyone" ON public.conferences
    FOR SELECT USING (true);

CREATE POLICY "Conferences are manageable by admins" ON public.conferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- 4. Insert default conferences if they don't exist
INSERT INTO public.conferences (name, description, color, created_at, updated_at)
VALUES
    ('Eastern Conference', 'Eastern Conference teams', '#3b82f6', NOW(), NOW()),
    ('Western Conference', 'Western Conference teams', '#ef4444', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 5. Add conference_id column to teams table if it doesn't exist
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS conference_id UUID REFERENCES public.conferences(id);

-- 6. Assign teams to conferences (modify team names to match your actual teams)
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

-- 7. Verify the setup
SELECT
    t.name as team_name,
    c.name as conference_name,
    c.color as conference_color
FROM public.teams t
LEFT JOIN public.conferences c ON t.conference_id = c.id
ORDER BY c.name, t.name;
