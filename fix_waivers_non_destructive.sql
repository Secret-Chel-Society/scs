-- Non-destructive waiver system fix
-- This will only add missing tables/columns without dropping anything

-- Create waivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waivers (
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

-- Create waiver_priority table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waiver_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id)
);

-- Create waiver_claims table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waiver_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waiver_id UUID NOT NULL REFERENCES public.waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    priority_at_claim INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(waiver_id, claiming_team_id)
);

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
    -- Add winning_team_id to waivers if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'winning_team_id') THEN
        ALTER TABLE public.waivers ADD COLUMN winning_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
    
    -- Add processed_at to waivers if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'processed_at') THEN
        ALTER TABLE public.waivers ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add created_at to waivers if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'created_at') THEN
        ALTER TABLE public.waivers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at to waivers if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waivers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add claimed_at to waiver_claims if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_claims' AND column_name = 'claimed_at') THEN
        ALTER TABLE public.waiver_claims ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at to waiver_claims if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_claims' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waiver_claims ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add last_used to waiver_priority if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'last_used') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN last_used TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add created_at to waiver_priority if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'created_at') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at to waiver_priority if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END
$$;

-- Create indexes for better performance (non-destructive)
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON public.waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON public.waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON public.waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON public.waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waivers_winning_team_id ON public.waivers(winning_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON public.waiver_priority(team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_priority ON public.waiver_priority(priority);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON public.waiver_claims(waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_id ON public.waiver_claims(claiming_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_status ON public.waiver_claims(status);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_claimed_at ON public.waiver_claims(claimed_at);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS update_waiver_priority_timestamp ON public.waiver_priority;
CREATE TRIGGER update_waiver_priority_timestamp
    BEFORE UPDATE ON public.waiver_priority
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_waiver_claims_timestamp ON public.waiver_claims;
CREATE TRIGGER update_waiver_claims_timestamp
    BEFORE UPDATE ON public.waiver_claims
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Initialize waiver priority for all active teams based on standings (only if no data exists)
INSERT INTO public.waiver_priority (team_id, priority)
SELECT 
    id as team_id,
    ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as priority
FROM 
    public.teams
WHERE 
    is_active = true
    AND id NOT IN (SELECT team_id FROM public.waiver_priority WHERE team_id IS NOT NULL)
ON CONFLICT (team_id) DO NOTHING;

-- Create function to reset waiver priority
CREATE OR REPLACE FUNCTION reset_waiver_priority()
RETURNS VOID AS $$
BEGIN
    -- Update priority based on current standings
    WITH team_standings AS (
        SELECT 
            id as team_id,
            ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as new_priority
        FROM 
            public.teams
        WHERE 
            is_active = true
    )
    UPDATE public.waiver_priority wp
    SET 
        priority = ts.new_priority,
        updated_at = NOW()
    FROM 
        team_standings ts
    WHERE 
        wp.team_id = ts.team_id;
    
    -- Insert any missing teams
    INSERT INTO public.waiver_priority (team_id, priority)
    SELECT 
        t.id as team_id,
        ROW_NUMBER() OVER (ORDER BY t.points DESC, t.wins DESC, t.losses ASC) as priority
    FROM 
        public.teams t
    LEFT JOIN 
        public.waiver_priority wp ON t.id = wp.team_id
    WHERE 
        t.is_active = true AND wp.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to get team's current waiver priority
CREATE OR REPLACE FUNCTION get_team_waiver_priority(team_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    team_priority INTEGER;
BEGIN
    SELECT priority INTO team_priority
    FROM public.waiver_priority
    WHERE team_id = team_uuid;
    
    RETURN COALESCE(team_priority, 999); -- Return high number if no priority found
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on tables
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read waivers" ON public.waivers;
CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow teams to create waivers for their players" ON public.waivers;
CREATE POLICY "Allow teams to create waivers for their players" ON public.waivers
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read waiver priority" ON public.waiver_priority;
CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read waiver claims" ON public.waiver_claims;
CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow teams to insert their own waiver claims" ON public.waiver_claims;
CREATE POLICY "Allow teams to insert their own waiver claims" ON public.waiver_claims
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow teams to update their own waiver claims" ON public.waiver_claims;
CREATE POLICY "Allow teams to update their own waiver claims" ON public.waiver_claims
    FOR UPDATE TO authenticated USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the setup
DO $$
DECLARE
    waivers_count INTEGER;
    priority_count INTEGER;
    claims_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO waivers_count FROM public.waivers;
    SELECT COUNT(*) INTO priority_count FROM public.waiver_priority;
    SELECT COUNT(*) INTO claims_count FROM public.waiver_claims;
    
    RAISE NOTICE 'Waivers table: % records', waivers_count;
    RAISE NOTICE 'Waiver priority table: % records', priority_count;
    RAISE NOTICE 'Waiver claims table: % records', claims_count;
    
    IF priority_count = 0 THEN
        RAISE WARNING 'No waiver priority records found! Teams may not be able to claim waivers.';
    END IF;
END
$$;
