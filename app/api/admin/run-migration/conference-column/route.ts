import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Add conference_id column to teams table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.teams 
        ADD COLUMN IF NOT EXISTS conference_id uuid REFERENCES public.conferences(id);
      `
    })

    if (error) {
      console.error("Error adding conference_id column:", error)
      return NextResponse.json(
        { error: "Failed to add conference_id column" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in conference column migration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
