-- Fix daily_recaps table to use UUID instead of SERIAL to avoid sequence permission issues
-- Drop the existing table if it exists
DROP TABLE IF EXISTS daily_recaps;

-- Create the table with UUID primary key
CREATE TABLE daily_recaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    recap_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_daily_recaps_date ON daily_recaps(date);

-- Grant necessary permissions
GRANT ALL ON daily_recaps TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
