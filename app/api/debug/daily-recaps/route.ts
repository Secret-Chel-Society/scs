import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
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
