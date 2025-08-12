-- Add featured column to matches table if it doesn't exist
ALTER TABLE matches ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
