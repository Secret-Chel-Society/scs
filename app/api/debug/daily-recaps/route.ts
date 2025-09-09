import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET() {
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }


  try {
    // Check if table exists and get all recaps
    const { data, error } = await supabase
      .from("daily_recaps")
      .select("id, date, created_at, recap_data")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        tableExists: false,
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      count: data?.length || 0,
      recaps:
        data?.map((recap) => ({
          id: recap.id,
          date: recap.date,
          created_at: recap.created_at,
          hasData: !!recap.recap_data,
          dataSize: recap.recap_data ? JSON.stringify(recap.recap_data).length : 0,
        })) || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        tableExists: false,
      },
      { status: 500 },
    )
  }
}
