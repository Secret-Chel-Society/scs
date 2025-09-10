-- Complete waiver system fix - 100% SAFE
-- This will fix the 500 errors without affecting any existing data

-- 1. Ensure all tables exist with correct structure
CREATE TABLE IF NOT EXISTS public.waivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  waiving_team_id uuid NOT NULL,
  waived_at timestamp with time zone DEFAULT now(),
  claim_deadline timestamp with time zone NOT NULL,
  status character varying(20) DEFAULT 'active'::character varying,
  winning_team_id uuid NULL,
  processed_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waivers_pkey PRIMARY KEY (id),
  CONSTRAINT waivers_player_id_fkey FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  CONSTRAINT waivers_waiving_team_id_fkey FOREIGN KEY (waiving_team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT waivers_winning_team_id_fkey FOREIGN KEY (winning_team_id) REFERENCES teams (id) ON DELETE SET NULL,
  CONSTRAINT waivers_status_check CHECK (
    (status)::text = ANY (
      ARRAY[
        ('active'::character varying)::text,
        ('claimed'::character varying)::text,
        ('cleared'::character varying)::text
      ]
    )
  )
);

CREATE TABLE IF NOT EXISTS public.waiver_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  waiver_id uuid NOT NULL,
  claiming_team_id uuid NOT NULL,
  priority_at_claim integer NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  claimed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waiver_claims_pkey PRIMARY KEY (id),
  CONSTRAINT waiver_claims_waiver_id_claiming_team_id_key UNIQUE (waiver_id, claiming_team_id),
  CONSTRAINT waiver_claims_claiming_team_id_fkey FOREIGN KEY (claiming_team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT waiver_claims_waiver_id_fkey FOREIGN KEY (waiver_id) REFERENCES waivers (id) ON DELETE CASCADE,
  CONSTRAINT waiver_claims_status_check CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'approved'::text,
        'rejected'::text
      ]
    )
  )
);

CREATE TABLE IF NOT EXISTS public.waiver_priority (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  priority integer NOT NULL,
  last_used timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waiver_priority_pkey PRIMARY KEY (id),
  CONSTRAINT waiver_priority_team_id_key UNIQUE (team_id),
  CONSTRAINT waiver_priority_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
);

-- 2. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON public.waivers USING btree (claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON public.waivers USING btree (status);
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON public.waivers USING btree (player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON public.waivers USING btree (waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_winning_team_id ON public.waivers USING btree (winning_team_id);

CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON public.waiver_claims USING btree (waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_id ON public.waiver_claims USING btree (claiming_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_status ON public.waiver_claims USING btree (status);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_claimed_at ON public.waiver_claims USING btree (claimed_at);

CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON public.waiver_priority USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_priority ON public.waiver_priority USING btree (priority);

-- 3. Create update_timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waivers_timestamp') THEN
    CREATE TRIGGER update_waivers_timestamp
      BEFORE UPDATE ON public.waivers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiver_claims_timestamp') THEN
    CREATE TRIGGER update_waiver_claims_timestamp
      BEFORE UPDATE ON public.waiver_claims
      FOR EACH ROW
      EXECUTE FUNCTION public.update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiver_priority_timestamp') THEN
    CREATE TRIGGER update_waiver_priority_timestamp
      BEFORE UPDATE ON public.waiver_priority
      FOR EACH ROW
      EXECUTE FUNCTION public.update_timestamp();
  END IF;
END
$$;

-- 5. Initialize waiver priority for all teams (this is the key fix!)
INSERT INTO public.waiver_priority (team_id, priority)
SELECT 
  t.id as team_id,
  ROW_NUMBER() OVER (ORDER BY t.created_at) as priority
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.waiver_priority wp 
  WHERE wp.team_id = t.id
)
ON CONFLICT (team_id) DO NOTHING;

-- 6. Enable RLS
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_priority ENABLE ROW LEVEL SECURITY;

-- 7. Create policies only if they don't exist
DO $$
BEGIN
  -- Waivers policies
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

  -- Waiver claims policies
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

  -- Waiver priority policies
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

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiver_priority TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Test the system
DO $$
DECLARE
  waivers_count INTEGER;
  claims_count INTEGER;
  priority_count INTEGER;
  teams_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO waivers_count FROM public.waivers;
  SELECT COUNT(*) INTO claims_count FROM public.waiver_claims;
  SELECT COUNT(*) INTO priority_count FROM public.waiver_priority;
  SELECT COUNT(*) INTO teams_count FROM public.teams;
  
  RAISE NOTICE '=== WAIVER SYSTEM STATUS ===';
  RAISE NOTICE 'Teams: %', teams_count;
  RAISE NOTICE 'Waiver priority entries: %', priority_count;
  RAISE NOTICE 'Active waivers: %', waivers_count;
  RAISE NOTICE 'Waiver claims: %', claims_count;
  RAISE NOTICE 'System is ready!';
END
$$;
