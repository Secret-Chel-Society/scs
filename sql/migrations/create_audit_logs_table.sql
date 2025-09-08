/*
 * This migration creates the audit_logs table and related objects if they don't exist
 * It's completely non-destructive and can be run multiple times safely
 */

-- Create the update_updated_at_column function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'update_updated_at_column' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END
$$;

-- Create the table if it doesn't exist
DO $$
BEGIN
    -- Only proceed if the table doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
    ) THEN
        -- Enable UUID extension if not already enabled
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        END IF;

        -- Create the table
        CREATE TABLE public.audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            action TEXT NOT NULL,
            user_id UUID NOT NULL,
            details JSONB,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );

        -- Add comments
        COMMENT ON TABLE public.audit_logs IS 'Stores audit trail for all significant system actions';
        COMMENT ON COLUMN public.audit_logs.action IS 'The action performed (e.g., user_login, bidding_enabled)';
        COMMENT ON COLUMN public.audit_logs.details IS 'Additional context about the action in JSON format';
        COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the client';
        COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string of the client';

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

        -- Enable RLS
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Audit logs table and related objects created successfully';
    ELSE
        RAISE NOTICE 'Audit logs table already exists, skipping creation';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating audit logs: %', SQLERRM;
END
$$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Admin read access policy
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policy 
        WHERE policyname = 'Enable read access for admins' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE POLICY "Enable read access for admins" 
        ON public.audit_logs
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = ANY(ARRAY['admin'::text, 'superadmin'::text])
            )
        );
    END IF;

    -- User read own logs policy
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policy 
        WHERE policyname = 'Enable users to read their own logs' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE POLICY "Enable users to read their own logs"
        ON public.audit_logs
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating RLS policies: %', SQLERRM;
END
$$;
