import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Insert sample conferences
    const { error } = await supabase
      .from('conferences')
      .upsert([
        {
          name: 'Eastern Conference',
          description: 'Eastern Conference teams',
          color: '#3b82f6' // Blue
        },
        {
          name: 'Western Conference', 
          description: 'Western Conference teams',
          color: '#ef4444' // Red
        }
      ], {
        onConflict: 'name'
      })

    if (error) {
      console.error("Error adding sample conferences:", error)
      return NextResponse.json(
        { error: "Failed to add sample conferences" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in sample conferences migration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
