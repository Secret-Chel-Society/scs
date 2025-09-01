import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Read the migration SQL file
    const migrationSql = `
    -- Add new columns to ea_player_stats table if they don't exist
    DO $$
    BEGIN
        -- Check if skinterceptions column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skinterceptions') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skinterceptions INTEGER DEFAULT 0;
        END IF;

        -- Check if skfow column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skfow') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skfow INTEGER DEFAULT 0;
        END IF;

        -- Check if skfol column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skfol') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skfol INTEGER DEFAULT 0;
        END IF;

        -- Check if skpenaltiesdrawn column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skpenaltiesdrawn') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skpenaltiesdrawn INTEGER DEFAULT 0;
        END IF;

        -- Check if skpasses column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skpasses') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skpasses INTEGER DEFAULT 0;
        END IF;

        -- Check if skpassattempts column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skpassattempts') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skpassattempts INTEGER DEFAULT 0;
        END IF;

        -- Check if skpossession column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'skpossession') THEN
            ALTER TABLE ea_player_stats ADD COLUMN skpossession INTEGER DEFAULT 0;
        END IF;

        -- Check if glgaa column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'ea_player_stats' 
                      AND column_name = 'glgaa') THEN
            ALTER TABLE ea_player_stats ADD COLUMN glgaa NUMERIC(5,2) DEFAULT 0.00;
        END IF;
    END $$;
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSql })

    if (error) {
      console.error("Error running EA player stats columns migration:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "EA player stats columns added successfully" })
  } catch (error: any) {
    console.error("Error in EA player stats columns migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
