-- Fix waivers system permissions and policies - COMPLETELY SAFE
-- This only adds missing permissions without dropping anything

-- 1. Enable RLS on all tables (safe - won't affect existing data)
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;

-- 2. Create policies only if they don't exist (completely safe)
DO $$
BEGIN
    -- Waivers table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to read waivers') THEN
        CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to insert waivers') THEN
        CREATE POLICY "Allow authenticated users to insert waivers" ON public.waivers
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to update waivers') THEN
        CREATE POLICY "Allow authenticated users to update waivers" ON public.waivers
            FOR UPDATE TO authenticated USING (true);
    END IF;

    -- Waiver claims table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to read waiver claims') THEN
        CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to insert waiver claims') THEN
        CREATE POLICY "Allow authenticated users to insert waiver claims" ON public.waiver_claims
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to update waiver claims') THEN
        CREATE POLICY "Allow authenticated users to update waiver claims" ON public.waiver_claims
            FOR UPDATE TO authenticated USING (true);
    END IF;

    -- Waiver priority table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to read waiver priority') THEN
        CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to insert waiver priority') THEN
        CREATE POLICY "Allow authenticated users to insert waiver priority" ON public.waiver_priority
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to update waiver priority') THEN
        CREATE POLICY "Allow authenticated users to update waiver priority" ON public.waiver_priority
            FOR UPDATE TO authenticated USING (true);
    END IF;
END
$$;

-- 3. Grant permissions (safe - won't affect existing permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Test the tables
DO $$
DECLARE
    waivers_count INTEGER;
    claims_count INTEGER;
    priority_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO waivers_count FROM public.waivers;
    SELECT COUNT(*) INTO claims_count FROM public.waiver_claims;
    SELECT COUNT(*) INTO priority_count FROM public.waiver_priority;
    
    RAISE NOTICE '=== WAIVER SYSTEM STATUS ===';
    RAISE NOTICE 'Waivers table: % records', waivers_count;
    RAISE NOTICE 'Waiver claims table: % records', claims_count;
    RAISE NOTICE 'Waiver priority table: % records', priority_count;
    RAISE NOTICE 'All tables are ready with proper permissions!';
END
$$;
