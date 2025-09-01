-- Create conferences table
CREATE TABLE IF NOT EXISTS conferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default conferences
INSERT INTO conferences (name, description, color) VALUES
    ('Eastern Elites', 'Eastern Conference teams', '#3b82f6'),
    ('Western Warriors', 'Western Conference teams', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;

-- Add conference_id column to teams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'conference_id'
    ) THEN
        ALTER TABLE teams ADD COLUMN conference_id UUID REFERENCES conferences(id);
    END IF;
END $$;

-- Create index on conference_id for better performance
CREATE INDEX IF NOT EXISTS idx_teams_conference_id ON teams(conference_id);

-- Update existing teams to assign them to conferences based on current logic
-- This is a placeholder - you'll need to manually assign teams or create a script
-- based on your current team data

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conferences_updated_at 
    BEFORE UPDATE ON conferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
