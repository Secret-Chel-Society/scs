-- Midnight Studios INTl - All rights reserved
-- Fix waivers system - create missing tables and permissions

-- Create waivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    waiving_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    waived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    claim_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiver_claims table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
    claiming_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority_at_claim INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiver_priority table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiver_priority (
    id SERIAL PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_reset TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(team_id)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waivers_player_id ON waivers(player_id);
CREATE INDEX IF NOT EXISTS idx_waivers_team_id ON waivers(waiving_team_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON waivers(status);
CREATE INDEX IF NOT EXISTS idx_waivers_claim_deadline ON waivers(claim_deadline);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_waiver_id ON waiver_claims(waiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_id ON waiver_claims(claiming_team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_priority_team_id ON waiver_priority(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS on all tables
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_priority ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for waivers table
DO $$
BEGIN
    -- Allow authenticated users to read waivers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to read waivers') THEN
        CREATE POLICY "Allow authenticated users to read waivers" ON waivers
        FOR SELECT TO authenticated
        USING (true);
    END IF;

    -- Allow authenticated users to insert waivers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to insert waivers') THEN
        CREATE POLICY "Allow authenticated users to insert waivers" ON waivers
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- Allow authenticated users to update waivers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waivers' AND policyname = 'Allow authenticated users to update waivers') THEN
        CREATE POLICY "Allow authenticated users to update waivers" ON waivers
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Create RLS policies for waiver_claims table
DO $$
BEGIN
    -- Allow authenticated users to read waiver claims
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to read waiver claims') THEN
        CREATE POLICY "Allow authenticated users to read waiver claims" ON waiver_claims
        FOR SELECT TO authenticated
        USING (true);
    END IF;

    -- Allow authenticated users to insert waiver claims
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to insert waiver claims') THEN
        CREATE POLICY "Allow authenticated users to insert waiver claims" ON waiver_claims
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- Allow authenticated users to update waiver claims
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_claims' AND policyname = 'Allow authenticated users to update waiver claims') THEN
        CREATE POLICY "Allow authenticated users to update waiver claims" ON waiver_claims
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Create RLS policies for waiver_priority table
DO $$
BEGIN
    -- Allow authenticated users to read waiver priority
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to read waiver priority') THEN
        CREATE POLICY "Allow authenticated users to read waiver priority" ON waiver_priority
        FOR SELECT TO authenticated
        USING (true);
    END IF;

    -- Allow authenticated users to insert waiver priority
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to insert waiver priority') THEN
        CREATE POLICY "Allow authenticated users to insert waiver priority" ON waiver_priority
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- Allow authenticated users to update waiver priority
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiver_priority' AND policyname = 'Allow authenticated users to update waiver priority') THEN
        CREATE POLICY "Allow authenticated users to update waiver priority" ON waiver_priority
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Create RLS policies for notifications table
DO $$
BEGIN
    -- Allow users to read their own notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow users to read their own notifications') THEN
        CREATE POLICY "Allow users to read their own notifications" ON notifications
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- Allow users to insert notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow users to insert notifications') THEN
        CREATE POLICY "Allow users to insert notifications" ON notifications
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- Allow users to update their own notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow users to update their own notifications') THEN
        CREATE POLICY "Allow users to update their own notifications" ON notifications
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions to authenticated role
DO $$
BEGIN
    -- Grant permissions on waivers table
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON waivers TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;

    -- Grant permissions on waiver_claims table
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON waiver_claims TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;

    -- Grant permissions on waiver_priority table
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON waiver_priority TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;

    -- Grant permissions on notifications table
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if already granted
    END;
END $$;

-- Create function to update waiver priority after claim (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_waiver_priority_after_claim') THEN
        EXECUTE '
        CREATE FUNCTION update_waiver_priority_after_claim()
        RETURNS TRIGGER AS $func$
        DECLARE
            current_priority INTEGER;
            max_priority INTEGER;
        BEGIN
            -- Get the current priority of the claiming team
            SELECT priority INTO current_priority FROM waiver_priority WHERE team_id = NEW.claiming_team_id;
            SELECT MAX(priority) INTO max_priority FROM waiver_priority;
            
            -- Move the claiming team to the bottom of the priority list
            IF current_priority IS NOT NULL AND max_priority IS NOT NULL THEN
                -- Update priorities for teams that were below the claiming team
                UPDATE waiver_priority
                SET priority = priority - 1
                WHERE priority > current_priority;
                
                -- Set the claiming team to the lowest priority
                UPDATE waiver_priority
                SET priority = max_priority
                WHERE team_id = NEW.claiming_team_id;
            END IF;
            
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql';
    END IF;
END $$;

-- Create trigger for waiver priority updates (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'waiver_claim_successful') THEN
        CREATE TRIGGER waiver_claim_successful
        AFTER INSERT ON waiver_claims
        FOR EACH ROW
        EXECUTE FUNCTION update_waiver_priority_after_claim();
    END IF;
END $$;

-- Initialize waiver priority for all teams if not exists
DO $$
BEGIN
    -- Check if the table exists and has the required columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waiver_priority' AND table_schema = 'public') THEN
        -- Check which columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiver_priority' AND column_name = 'next_reset' AND table_schema = 'public') THEN
            -- Check if last_updated column exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiver_priority' AND column_name = 'last_updated' AND table_schema = 'public') THEN
                -- Insert with all columns (order by points, then wins, then name)
                INSERT INTO waiver_priority (team_id, priority, last_updated, next_reset)
                SELECT 
                    t.id::bigint,
                    ROW_NUMBER() OVER (ORDER BY COALESCE(t.points, 0) ASC, COALESCE(t.wins, 0) ASC, t.name ASC) as priority,
                    NOW(),
                    NOW() + interval '1 week'
                FROM teams t
                WHERE t.is_active = true
                ON CONFLICT (team_id) DO NOTHING;
            ELSE
                -- Insert without last_updated column (order by points, then wins, then name)
                INSERT INTO waiver_priority (team_id, priority, next_reset)
                SELECT 
                    t.id::bigint,
                    ROW_NUMBER() OVER (ORDER BY COALESCE(t.points, 0) ASC, COALESCE(t.wins, 0) ASC, t.name ASC) as priority,
                    NOW() + interval '1 week'
                FROM teams t
                WHERE t.is_active = true
                ON CONFLICT (team_id) DO NOTHING;
            END IF;
        ELSE
            -- Insert with only basic columns (team_id, priority) - order by points, then wins, then name
            INSERT INTO waiver_priority (team_id, priority)
            SELECT 
                t.id::bigint,
                ROW_NUMBER() OVER (ORDER BY COALESCE(t.points, 0) ASC, COALESCE(t.wins, 0) ASC, t.name ASC) as priority
            FROM teams t
            WHERE t.is_active = true
            ON CONFLICT (team_id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE waivers IS 'Tracks player waivers and claim deadlines';
COMMENT ON TABLE waiver_claims IS 'Tracks team claims on waived players';
COMMENT ON TABLE waiver_priority IS 'Tracks waiver claim priority order for teams';
COMMENT ON TABLE notifications IS 'User notifications system';
