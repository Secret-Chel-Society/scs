-- Add conference_id column to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS conference_id UUID REFERENCES public.conferences(id) ON DELETE SET NULL;

-- Update the updated_at column when conference_id changes
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on conference_id change
CREATE OR REPLACE TRIGGER update_teams_updated_at
BEFORE UPDATE OF conference_id ON public.teams
FOR EACH ROW
EXECUTE FUNCTION update_teams_updated_at();
