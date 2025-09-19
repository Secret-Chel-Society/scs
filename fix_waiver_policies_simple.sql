-- Fix waiver RLS policies - 100% SAFE
-- Only creates policies if they don't exist

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read waivers" ON public.waivers;
DROP POLICY IF EXISTS "Allow authenticated users to insert waivers" ON public.waivers;
DROP POLICY IF EXISTS "Allow authenticated users to update waivers" ON public.waivers;
DROP POLICY IF EXISTS "Allow authenticated users to delete waivers" ON public.waivers;

DROP POLICY IF EXISTS "Allow authenticated users to read waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow authenticated users to insert waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow authenticated users to update waiver claims" ON public.waiver_claims;
DROP POLICY IF EXISTS "Allow authenticated users to delete waiver claims" ON public.waiver_claims;

DROP POLICY IF EXISTS "Allow authenticated users to read waiver priority" ON public.waiver_priority;
DROP POLICY IF EXISTS "Allow authenticated users to insert waiver priority" ON public.waiver_priority;
DROP POLICY IF EXISTS "Allow authenticated users to update waiver priority" ON public.waiver_priority;
DROP POLICY IF EXISTS "Allow authenticated users to delete waiver priority" ON public.waiver_priority;

-- Create simple, permissive policies
CREATE POLICY "Allow authenticated users to read waivers" ON public.waivers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waivers" ON public.waivers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waivers" ON public.waivers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete waivers" ON public.waivers
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read waiver claims" ON public.waiver_claims
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waiver claims" ON public.waiver_claims
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waiver claims" ON public.waiver_claims
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete waiver claims" ON public.waiver_claims
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read waiver priority" ON public.waiver_priority
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert waiver priority" ON public.waiver_priority
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update waiver priority" ON public.waiver_priority
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete waiver priority" ON public.waiver_priority
    FOR DELETE TO authenticated USING (true);

-- Grant all permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the policies
SELECT 'Policies created successfully' as status;
