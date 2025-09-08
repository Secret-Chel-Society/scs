-- First, check if the conferences table exists, if not create it
CREATE TABLE IF NOT EXISTS public.conferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conference_id column to teams table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'teams' 
                   AND column_name = 'conference_id') THEN
        ALTER TABLE public.teams
        ADD COLUMN conference_id UUID REFERENCES public.conferences(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create or replace the update_teams_updated_at function
CREATE OR REPLACE FUNCTION public.update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;

-- Create the trigger
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
WHEN (
    OLD.conference_id IS DISTINCT FROM NEW.conference_id
    OR OLD.name IS DISTINCT FROM NEW.name
    OR OLD.logo_url IS DISTINCT FROM NEW.logo_url
    -- Add other fields that should trigger an update
)
EXECUTE FUNCTION public.update_teams_updated_at();
