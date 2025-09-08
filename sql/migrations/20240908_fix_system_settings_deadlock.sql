-- First, ensure the table exists with minimal locking
DO $$
BEGIN
    -- Check if table exists first to avoid locking if not needed
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
        CREATE TABLE public.system_settings (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            key text NOT NULL,
            value jsonb NOT NULL,
            description text,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT system_settings_pkey PRIMARY KEY (id),
            CONSTRAINT system_settings_key_key UNIQUE (key)
        ) TABLESPACE pg_default;
    END IF;
END
$$;

-- Create index in a separate transaction
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND indexname = 'system_settings_key_idx'
    ) THEN
        CREATE INDEX system_settings_key_idx ON public.system_settings USING btree (key);
    END IF;
END
$$;

-- Enable RLS in a separate transaction
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Add policies one by one in separate transactions
DO $$
BEGIN
    -- Read access for all users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" 
        ON public.system_settings
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;

    -- Insert for service role only
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND policyname = 'Enable insert for service role only'
    ) THEN
        CREATE POLICY "Enable insert for service role only" 
        ON public.system_settings
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;

    -- Update for service role only
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND policyname = 'Enable update for service role only'
    ) THEN
        CREATE POLICY "Enable update for service role only" 
        ON public.system_settings
        FOR UPDATE
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;

    -- Delete for service role only
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings' 
        AND policyname = 'Enable delete for service role only'
    ) THEN
        CREATE POLICY "Enable delete for service role only" 
        ON public.system_settings
        FOR DELETE
        TO service_role
        USING (true);
    END IF;
END
$$;

-- Insert default values in a separate transaction
DO $$
BEGIN
    -- Insert default salary cap if it doesn't exist
    INSERT INTO public.system_settings (key, value)
    SELECT 'salary_cap', '65000000'::jsonb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.system_settings WHERE key = 'salary_cap'
    );

    -- Insert default season if it doesn't exist
    INSERT INTO public.system_settings (key, value)
    SELECT 'current_season', '1'::jsonb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.system_settings WHERE key = 'current_season'
    );
END
$$;
