-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT system_settings_pkey PRIMARY KEY (id),
    CONSTRAINT system_settings_key_key UNIQUE (key)
) TABLESPACE pg_default;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS system_settings_key_idx ON public.system_settings USING btree (key);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings table
CREATE POLICY "Enable read access for all users" ON public.system_settings
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only allow service role to insert/update/delete
CREATE POLICY "Enable insert for service role only" ON public.system_settings
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable update for service role only" ON public.system_settings
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for service role only" ON public.system_settings
    FOR DELETE
    TO service_role
    USING (true);

-- Insert default salary cap if it doesn't exist
INSERT INTO public.system_settings (key, value)
VALUES ('salary_cap', '65000000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default season if it doesn't exist
INSERT INTO public.system_settings (key, value)
VALUES ('current_season', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON TABLE public.system_settings TO postgres;
GRANT ALL ON TABLE public.system_settings TO anon;
GRANT ALL ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;
