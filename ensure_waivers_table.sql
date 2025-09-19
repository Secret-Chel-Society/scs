-- Ensure waivers table exists and has proper permissions
-- This is completely safe - only creates if missing

-- Create waivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    waiving_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    winning_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON public.waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON public.waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON public.waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON public.waivers(claim_deadline);

-- Enable RLS
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow authenticated users to read waivers" ON public.waivers;
CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow teams to create waivers" ON public.waivers;
CREATE POLICY "Allow teams to create waivers" ON public.waivers
    FOR INSERT TO authenticated WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;

-- Test the table
DO $$
DECLARE
    waivers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO waivers_count FROM public.waivers;
    RAISE NOTICE 'Waivers table ready with % records', waivers_count;
END
$$;
