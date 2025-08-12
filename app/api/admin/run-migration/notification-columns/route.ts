import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Run the migration SQL
    const { error } = await supabase.rpc("run_sql", {
      sql_query: `
        -- Add notification preference columns to users table
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS game_notifications BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS news_notifications BOOLEAN DEFAULT true;

        -- Update existing users to have default notification preferences
        UPDATE users 
        SET 
          email_notifications = COALESCE(email_notifications, true),
          game_notifications = COALESCE(game_notifications, true),
          news_notifications = COALESCE(news_notifications, true)
        WHERE 
          email_notifications IS NULL 
          OR game_notifications IS NULL 
          OR news_notifications IS NULL;
      `,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification columns migration completed successfully",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Failed to run migration",
      },
      { status: 500 },
    )
  }
}
