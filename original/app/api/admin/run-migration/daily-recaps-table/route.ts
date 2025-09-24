import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // First, create the table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS daily_recaps (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        recap_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc("run_sql", {
      query: createTableQuery,
    })

    if (createError) {
      console.log("Trying alternative method...")
      // Try direct query execution
      const { error: directError } = await supabase.from("daily_recaps").select("id").limit(1)

      if (directError && directError.message.includes("does not exist")) {
        // Table doesn't exist, we need to create it manually
        return NextResponse.json(
          {
            success: false,
            error: "Table creation requires manual intervention. Please run the SQL manually in your database.",
            sql: createTableQuery,
          },
          { status: 500 },
        )
      }
    }

    // Create the index
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_daily_recaps_date ON daily_recaps(date);
    `

    const { error: indexError } = await supabase.rpc("run_sql", {
      query: createIndexQuery,
    })

    if (indexError) {
      console.warn("Index creation failed, but table might exist:", indexError.message)
    }

    return NextResponse.json({
      success: true,
      message: "Daily recaps table migration completed successfully",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        suggestion: "Try running the migration manually or check if the table already exists",
      },
      { status: 500 },
    )
  }
}
