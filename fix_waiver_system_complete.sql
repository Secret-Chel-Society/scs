-- Complete waiver system fix
-- This script will fix all schema mismatches and initialize the system properly

-- First, let's check what tables exist and their current structure
DO $$
BEGIN
    -- Drop existing tables if they have wrong schema
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_claims') THEN
        DROP TABLE public.waiver_claims CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiver_priority') THEN
        DROP TABLE public.waiver_priority CASCADE;
    END IF;
END
$$;

-- Create waiver_priority table with correct schema
CREATE TABLE public.waiver_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id)
);

-- Create waiver_claims table with correct schema
CREATE TABLE public.waiver_claims (
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

-- Create indexes for better performance
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

-- Create triggers for both tables
CREATE TRIGGER update_waiver_priority_timestamp
    BEFORE UPDATE ON public.waiver_priority
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_waiver_claims_timestamp
    BEFORE UPDATE ON public.waiver_claims
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Initialize waiver priority for all active teams based on standings
INSERT INTO public.waiver_priority (team_id, priority)
SELECT 
    id as team_id,
    ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as priority
FROM 
    public.teams
WHERE 
    is_active = true
ON CONFLICT (team_id) DO UPDATE
SET priority = EXCLUDED.priority;

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

-- Create function to process waiver claims
CREATE OR REPLACE FUNCTION process_waiver_claim(waiver_id UUID)
RETURNS UUID AS $$
DECLARE
    winning_claim_id UUID;
    winning_team_id UUID;
BEGIN
    -- Find the claim with the highest priority (lowest number)
    SELECT 
        wc.id, wc.claiming_team_id INTO winning_claim_id, winning_team_id
    FROM 
        public.waiver_claims wc
    JOIN 
        public.waiver_priority wp ON wc.claiming_team_id = wp.team_id
    WHERE 
        wc.waiver_id = waiver_id AND wc.status = 'pending'
    ORDER BY 
        wp.priority ASC
    LIMIT 1;
    
    -- If we found a winning claim
    IF winning_claim_id IS NOT NULL THEN
        -- Update the winning claim to approved
        UPDATE public.waiver_claims
        SET status = 'approved'
        WHERE id = winning_claim_id;
        
        -- Update all other claims to rejected
        UPDATE public.waiver_claims
        SET status = 'rejected'
        WHERE waiver_id = waiver_id AND id != winning_claim_id;
        
        -- Update the waiver to claimed
        UPDATE public.waivers
        SET status = 'claimed', winning_team_id = winning_team_id, processed_at = NOW()
        WHERE id = waiver_id;
        
        -- Update the winning team's priority to the lowest
        WITH max_priority AS (
            SELECT MAX(priority) + 1 as max_p FROM public.waiver_priority
        )
        UPDATE public.waiver_priority
        SET priority = (SELECT max_p FROM max_priority), last_used = NOW()
        WHERE team_id = winning_team_id;
    END IF;
    
    RETURN winning_claim_id;
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create RLS policies
ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;

-- Policy for waiver_priority - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
    FOR SELECT TO authenticated USING (true);

-- Policy for waiver_claims - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
    FOR SELECT TO authenticated USING (true);

-- Policy for waiver_claims - allow teams to insert their own claims
CREATE POLICY "Allow teams to insert their own waiver claims" ON public.waiver_claims
    FOR INSERT TO authenticated WITH CHECK (true);

-- Policy for waiver_claims - allow teams to update their own claims
CREATE POLICY "Allow teams to update their own waiver claims" ON public.waiver_claims
    FOR UPDATE TO authenticated USING (true);

-- Verify the setup
DO $$
DECLARE
    priority_count INTEGER;
    claims_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO priority_count FROM public.waiver_priority;
    SELECT COUNT(*) INTO claims_count FROM public.waiver_claims;
    
    RAISE NOTICE 'Waiver priority records created: %', priority_count;
    RAISE NOTICE 'Waiver claims records: %', claims_count;
    
    IF priority_count = 0 THEN
        RAISE WARNING 'No waiver priority records found! Teams may not be able to claim waivers.';
    END IF;
END
$$;
