-- Midnight Studios INTl - All rights reserved
-- Complete waivers system fix

-- Create tables if they don't exist (non-destructive)

-- Create waivers table with exact schema match
CREATE TABLE IF NOT EXISTS waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    waiving_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'claimed'::character varying::text, 'cleared'::character varying::text])),
    winning_team_id UUID REFERENCES teams(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiver_claims table with exact schema match
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority_at_claim INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance (non-destructive)
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waivers_winning_team_id ON waivers(winning_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON waiver_claims(waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_id ON waiver_claims(claiming_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_status ON waiver_claims(status);

-- Enable RLS
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_claims ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies (non-destructive)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow all operations on waivers') THEN
        CREATE POLICY "Allow all operations on waivers" ON waivers FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow all operations on waiver_claims') THEN
        CREATE POLICY "Allow all operations on waiver_claims" ON waiver_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Grant all permissions to authenticated role (non-destructive)
DO $$
BEGIN
    BEGIN
        GRANT ALL ON waivers TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;
    
    BEGIN
        GRANT ALL ON waiver_claims TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;
END $$;

-- Grant usage on sequences if they exist
DO $$
BEGIN
    BEGIN
        GRANT USAGE ON SEQUENCE waivers_id_seq TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if sequence doesn't exist or already granted
    END;
    
    BEGIN
        GRANT USAGE ON SEQUENCE waiver_claims_id_seq TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if sequence doesn't exist or already granted
    END;
END $$;
