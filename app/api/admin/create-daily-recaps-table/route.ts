import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Try to insert a test record to see if table exists
    const testDate = "1900-01-01"
    const { error: testError } = await supabase.from("daily_recaps").insert({
      date: testDate,
      recap_data: { test: true },
    })

    if (testError && testError.message.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          error: "Table does not exist. Please create it manually with this SQL:",
          sql: `
CREATE TABLE daily_recaps (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  recap_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_recaps_date ON daily_recaps(date);
        `,
        },
        { status: 400 },
      )
    }

    // Clean up test record if it was inserted
    if (!testError) {
      await supabase.from("daily_recaps").delete().eq("date", testDate)
    }

    return NextResponse.json({
      success: true,
      message: "Daily recaps table already exists and is working properly",
    })
  } catch (error: any) {
    console.error("Table check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
