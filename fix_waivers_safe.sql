-- Completely safe waiver system fix
-- Only adds missing elements, never drops or modifies existing data

-- 1. Create waivers table ONLY if it doesn't exist
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

-- 2. Create waiver_priority table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waiver_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id)
);

-- 3. Create waiver_claims table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waiver_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waiver_id UUID NOT NULL REFERENCES public.waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    priority_at_claim INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(waiver_id, claiming_team_id)
);

-- 4. Add missing columns ONLY if they don't exist (completely safe)
DO $$
BEGIN
    -- Add columns to waivers table if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'winning_team_id') THEN
        ALTER TABLE public.waivers ADD COLUMN winning_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added winning_team_id column to waivers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'processed_at') THEN
        ALTER TABLE public.waivers ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added processed_at column to waivers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'created_at') THEN
        ALTER TABLE public.waivers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to waivers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waivers' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waivers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to waivers table';
    END IF;
    
    -- Add columns to waiver_claims table if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_claims' AND column_name = 'claimed_at') THEN
        ALTER TABLE public.waiver_claims ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added claimed_at column to waiver_claims table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_claims' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waiver_claims ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to waiver_claims table';
    END IF;
    
    -- Add columns to waiver_priority table if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'last_used') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN last_used TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_used column to waiver_priority table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'created_at') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to waiver_priority table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'waiver_priority' AND column_name = 'updated_at') THEN
        ALTER TABLE public.waiver_priority ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to waiver_priority table';
    END IF;
END
$$;

-- 5. Create indexes ONLY if they don't exist (completely safe)
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

-- 6. Create or replace functions (safe - functions don't affect data)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION get_team_waiver_priority(team_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    team_priority INTEGER;
BEGIN
    SELECT priority INTO team_priority
    FROM public.waiver_priority
    WHERE team_id = team_uuid;
    
    RETURN COALESCE(team_priority, 999);
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers ONLY if they don't exist (safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiver_priority_timestamp') THEN
        CREATE TRIGGER update_waiver_priority_timestamp
            BEFORE UPDATE ON public.waiver_priority
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        RAISE NOTICE 'Created update_waiver_priority_timestamp trigger';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiver_claims_timestamp') THEN
        CREATE TRIGGER update_waiver_claims_timestamp
            BEFORE UPDATE ON public.waiver_claims
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        RAISE NOTICE 'Created update_waiver_claims_timestamp trigger';
    END IF;
END
$$;

-- 8. Initialize waiver priority ONLY for teams that don't have it (safe)
INSERT INTO public.waiver_priority (team_id, priority)
SELECT 
    id as team_id,
    ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, losses ASC) as priority
FROM 
    public.teams
WHERE 
    is_active = true
    AND id NOT IN (SELECT COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::UUID) FROM public.waiver_priority)
ON CONFLICT (team_id) DO NOTHING;

-- 9. Enable RLS ONLY if not already enabled (safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'waivers' AND relrowsecurity = true) THEN
        ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on waivers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'waiver_priority' AND relrowsecurity = true) THEN
        ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on waiver_priority table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'waiver_claims' AND relrowsecurity = true) THEN
        ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on waiver_claims table';
    END IF;
END
$$;

-- 10. Create policies ONLY if they don't exist (safe)
DO $$
BEGIN
    -- Waivers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to read waivers') THEN
        CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
            FOR SELECT TO authenticated USING (true);
        RAISE NOTICE 'Created waivers read policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow teams to create waivers for their players') THEN
        CREATE POLICY "Allow teams to create waivers for their players" ON public.waivers
            FOR INSERT TO authenticated WITH CHECK (true);
        RAISE NOTICE 'Created waivers insert policy';
    END IF;
    
    -- Waiver priority policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to read waiver priority') THEN
        CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
            FOR SELECT TO authenticated USING (true);
        RAISE NOTICE 'Created waiver_priority read policy';
    END IF;
    
    -- Waiver claims policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to read waiver claims') THEN
        CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
            FOR SELECT TO authenticated USING (true);
        RAISE NOTICE 'Created waiver_claims read policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow teams to insert their own waiver claims') THEN
        CREATE POLICY "Allow teams to insert their own waiver claims" ON public.waiver_claims
            FOR INSERT TO authenticated WITH CHECK (true);
        RAISE NOTICE 'Created waiver_claims insert policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow teams to update their own waiver claims') THEN
        CREATE POLICY "Allow teams to update their own waiver claims" ON public.waiver_claims
            FOR UPDATE TO authenticated USING (true);
        RAISE NOTICE 'Created waiver_claims update policy';
    END IF;
END
$$;

-- 11. Grant permissions (safe - only adds permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12. Final verification (safe - only reads data)
DO $$
DECLARE
    waivers_count INTEGER;
    priority_count INTEGER;
    claims_count INTEGER;
    waivers_columns INTEGER;
    priority_columns INTEGER;
    claims_columns INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO waivers_count FROM public.waivers;
    SELECT COUNT(*) INTO priority_count FROM public.waiver_priority;
    SELECT COUNT(*) INTO claims_count FROM public.waiver_claims;
    
    -- Count columns
    SELECT COUNT(*) INTO waivers_columns FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waivers';
    SELECT COUNT(*) INTO priority_columns FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waiver_priority';
    SELECT COUNT(*) INTO claims_columns FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waiver_claims';
    
    RAISE NOTICE '=== WAIVER SYSTEM STATUS ===';
    RAISE NOTICE 'Waivers table: % records, % columns', waivers_count, waivers_columns;
    RAISE NOTICE 'Waiver priority table: % records, % columns', priority_count, priority_columns;
    RAISE NOTICE 'Waiver claims table: % records, % columns', claims_count, claims_columns;
    
    IF priority_count = 0 THEN
        RAISE WARNING 'No waiver priority records found! Teams may not be able to claim waivers.';
    ELSE
        RAISE NOTICE 'Waiver priority system is ready!';
    END IF;
    
    RAISE NOTICE '=== FIX COMPLETE ===';
END
$$;
