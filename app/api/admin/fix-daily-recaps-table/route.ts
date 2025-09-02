import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    // Drop and recreate the table with UUID primary key
    const { error: dropError } = await supabase.rpc("exec_sql", {
      sql_query: "DROP TABLE IF EXISTS daily_recaps;"
    })

    if (dropError) {
      console.error("Error dropping table:", dropError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to drop table: ${dropError.message}` 
      }, { status: 500 })
    }

    // Create the table with UUID primary key
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE daily_recaps (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL UNIQUE,
          recap_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createError) {
      console.error("Error creating table:", createError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create table: ${createError.message}` 
      }, { status: 500 })
    }

    // Create index
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql_query: "CREATE INDEX idx_daily_recaps_date ON daily_recaps(date);"
    })

    if (indexError) {
      console.warn("Warning: Index creation failed:", indexError.message)
    }

    // Grant permissions
    const { error: grantError } = await supabase.rpc("exec_sql", {
      sql_query: `
        GRANT ALL ON daily_recaps TO authenticated;
        GRANT USAGE ON SCHEMA public TO authenticated;
      `
    })

    if (grantError) {
      console.warn("Warning: Permission grant failed:", grantError.message)
    }

    return NextResponse.json({
      success: true,
      message: "Daily recaps table has been fixed with UUID primary key"
    })

  } catch (error: any) {
    console.error("Error fixing daily recaps table:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An error occurred"
    }, { status: 500 })
  }
}
