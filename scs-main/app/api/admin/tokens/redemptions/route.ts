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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"

    // Build query for redemptions with explicit relationship naming
    let query = supabase
      .from("token_redemptions")
      .select(`
        id,
        user_id,
        redeemable_id,
        tokens_spent,
        status,
        notes,
        created_at,
        updated_at,
        admin_user_id,
        users!token_redemptions_user_id_fkey(gamer_tag_id, email),
        token_redeemables!token_redemptions_redeemable_id_fkey(name, description, cost, category)
      `)
      .order("created_at", { ascending: false })

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: redemptions, error: redemptionsError } = await query

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError)
      return NextResponse.json({ error: redemptionsError.message }, { status: 500 })
    }

    return NextResponse.json({ redemptions })
  } catch (error: any) {
    console.error("Admin redemptions API error:", error)
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
    const { id, status, notes, admin_user_id } = body

    // Update redemption status
    const { data: redemption, error: redemptionError } = await supabase
      .from("token_redemptions")
      .update({
        status,
        notes,
        admin_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        user_id,
        tokens_spent,
        status,
        users!token_redemptions_user_id_fkey(gamer_tag_id, email),
        token_redeemables!token_redemptions_redeemable_id_fkey(name, description, cost)
      `)
      .single()

    if (redemptionError) {
      console.error("Error updating redemption:", redemptionError)
      return NextResponse.json({ error: redemptionError.message }, { status: 500 })
    }

    // If redemption was denied, refund the tokens
    if (status === "denied") {
      const { error: refundError } = await supabase.from("token_transactions").insert({
        user_id: redemption.user_id,
        amount: redemption.tokens_spent,
        transaction_type: "earned",
        source: "refund",
        description: `Refund for denied redemption: ${redemption.token_redeemables.name}`,
        admin_user_id,
        reference_id: redemption.id,
      })

      if (refundError) {
        console.error("Error creating refund transaction:", refundError)
        return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
      }
    }

    return NextResponse.json({ redemption })
  } catch (error: any) {
    console.error("Admin update redemption API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
