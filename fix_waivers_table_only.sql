-- Fix just the waivers table to match the expected schema
-- This is a non-destructive approach

-- First, check if waivers table exists and what columns it has
DO $$
BEGIN
    -- If waivers table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waivers') THEN
        CREATE TABLE public.waivers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
            waiving_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
            waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(20) DEFAULT 'active' CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'claimed'::character varying::text, 'cleared'::character varying::text])),
            winning_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created waivers table';
    ELSE
        RAISE NOTICE 'Waivers table already exists';
    END IF;
END
$$;

-- Create indexes for waivers table
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON public.waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON public.waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON public.waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON public.waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waivers_winning_team_id ON public.waivers(winning_team_id);

-- Enable RLS on waivers table
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for waivers
DROP POLICY IF EXISTS "Allow authenticated users to read waivers" ON public.waivers;
CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow teams to create waivers for their players" ON public.waivers;
CREATE POLICY "Allow teams to create waivers for their players" ON public.waivers
    FOR INSERT TO authenticated WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;

-- Verify the table structure
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'waivers'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'waivers';
        
        RAISE NOTICE 'Waivers table exists with % columns', column_count;
    ELSE
        RAISE WARNING 'Waivers table does not exist!';
    END IF;
END
$$;
