-- Create conferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name VARCHAR(10),
    description TEXT,
    color VARCHAR(7) DEFAULT '#000000',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conferences_name_key UNIQUE (name)
);

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conferences' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.conferences
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create index for active conferences if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'conferences' 
        AND indexname = 'idx_conferences_active'
    ) THEN
        CREATE INDEX idx_conferences_active ON public.conferences(is_active);
    END IF;
END $$;

-- Add conference_id to teams table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'conference_id'
    ) THEN
        -- First add the column without the foreign key constraint
        ALTER TABLE public.teams
        ADD COLUMN conference_id UUID;
        
        -- Then add the foreign key constraint
        ALTER TABLE public.teams
        ADD CONSTRAINT fk_teams_conference 
        FOREIGN KEY (conference_id) 
        REFERENCES public.conferences(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for updating conferences.updated_at
DO $$
BEGIN
    -- Drop the trigger if it exists to avoid errors
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conferences_updated_at') THEN
        DROP TRIGGER IF EXISTS update_conferences_updated_at ON public.conferences;
    END IF;
    
    -- Create the trigger
    EXECUTE '
    CREATE TRIGGER update_conferences_updated_at
    BEFORE UPDATE ON public.conferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();';
END $$;
