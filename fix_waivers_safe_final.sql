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

-- 1b. Create waiver_claims table ONLY if it doesn't exist
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

-- 2. Add missing columns ONLY if they don't exist
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
END
$$;

-- 3. Create indexes ONLY if they don't exist
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON public.waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON public.waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON public.waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON public.waivers(claim_deadline);

-- 4. Enable RLS ONLY if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'waivers' AND relrowsecurity = true) THEN
        ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on waivers table';
    END IF;
END
$$;

-- 5. Create policies ONLY if they don't exist
DO $$
BEGIN
    -- Waivers read policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to read waivers') THEN
        CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
            FOR SELECT TO authenticated USING (true);
        RAISE NOTICE 'Created waivers read policy';
    END IF;
    
    -- Waivers insert policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow teams to create waivers') THEN
        CREATE POLICY "Allow teams to create waivers" ON public.waivers
            FOR INSERT TO authenticated WITH CHECK (true);
        RAISE NOTICE 'Created waivers insert policy';
    END IF;
END
$$;

-- 6. Grant permissions (safe - only adds permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;

-- 7. Test the table (safe - only reads data)
DO $$
DECLARE
    waivers_count INTEGER;
    waivers_columns INTEGER;
BEGIN
    SELECT COUNT(*) INTO waivers_count FROM public.waivers;
    SELECT COUNT(*) INTO waivers_columns FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waivers';
    
    RAISE NOTICE '=== WAIVERS TABLE STATUS ===';
    RAISE NOTICE 'Waivers table: % records, % columns', waivers_count, waivers_columns;
    RAISE NOTICE 'Waivers table is ready!';
END
$$;
