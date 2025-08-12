import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all redeemable items
    const { data: redeemables, error: redeemablesError } = await supabase
      .from("token_redeemables")
      .select("*")
      .order("category", { ascending: true })
      .order("cost", { ascending: true })

    if (redeemablesError) {
      console.error("Error fetching redeemables:", redeemablesError)
      return NextResponse.json({ error: redeemablesError.message }, { status: 500 })
    }

    return NextResponse.json({ redeemables })
  } catch (error: any) {
    console.error("Admin redeemables API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { name, description, cost, requires_approval, category, max_per_season } = body

    // Create new redeemable item
    const { data: redeemable, error: redeemableError } = await supabase
      .from("token_redeemables")
      .insert({
        name,
        description,
        cost,
        requires_approval: requires_approval || false,
        category: category || "utility",
        max_per_season,
      })
      .select()
      .single()

    if (redeemableError) {
      console.error("Error creating redeemable:", redeemableError)
      return NextResponse.json({ error: redeemableError.message }, { status: 500 })
    }

    return NextResponse.json({ redeemable })
  } catch (error: any) {
    console.error("Admin create redeemable API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { id, name, description, cost, requires_approval, category, max_per_season, is_active } = body

    // Update redeemable item
    const { data: redeemable, error: redeemableError } = await supabase
      .from("token_redeemables")
      .update({
        name,
        description,
        cost,
        requires_approval,
        category,
        max_per_season,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (redeemableError) {
      console.error("Error updating redeemable:", redeemableError)
      return NextResponse.json({ error: redeemableError.message }, { status: 500 })
    }

    return NextResponse.json({ redeemable })
  } catch (error: any) {
    console.error("Admin update redeemable API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Redeemable ID is required" }, { status: 400 })
    }

    // Delete redeemable item
    const { error: deleteError } = await supabase.from("token_redeemables").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting redeemable:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin delete redeemable API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
