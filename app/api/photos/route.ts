import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = searchParams.get("limit") || "50"

    let query = supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit))

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching photos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photos: data || [] })
  } catch (error: any) {
    console.error("Error in photos API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { title, description, category, file_path, url, size, file_type } = body

    if (!title || !category || !url) {
      return NextResponse.json(
        { error: "Title, category, and URL are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("photos")
      .insert({
        title,
        description,
        category,
        file_path,
        url,
        size,
        file_type,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating photo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photo: data })
  } catch (error: any) {
    console.error("Error in photos POST API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
