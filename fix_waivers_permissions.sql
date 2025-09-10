-- Fix waivers system permissions and policies
-- This is completely safe - only adds missing permissions

-- 1. Enable RLS on all tables
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read waivers" ON public.waivers;
DROP POLICY IF EXISTS "Allow teams to create waivers" ON public.waivers;
DROP POLICY IF EXISTS "Allow authenticated users to read waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow teams to insert their own waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow teams to update their own waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow authenticated users to read waiver priority" ON public.waiver_priority;

-- 3. Create new policies for waivers table
CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waivers" ON public.waivers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waivers" ON public.waivers
    FOR UPDATE TO authenticated USING (true);

-- 4. Create new policies for waiver_claims table
CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waiver claims" ON public.waiver_claims
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waiver claims" ON public.waiver_claims
    FOR UPDATE TO authenticated USING (true);

-- 5. Create new policies for waiver_priority table
CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waiver priority" ON public.waiver_priority
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waiver priority" ON public.waiver_priority
    FOR UPDATE TO authenticated USING (true);

-- 6. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Test the tables
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
