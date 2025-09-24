import { type NextRequest, NextResponse } from "next/server"
import { createCustomClient } from "@/lib/supabase/custom-client"

export async function POST(request: NextRequest) {
  try {
    console.log("=== TOKEN REDEEM API START ===")

    // Create Supabase client using the same method as user profile API
    const supabase = createCustomClient()

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("✅ User authenticated:", userId)

    // Parse request body
    const { redeemable_id, notes } = await request.json()

    if (!redeemable_id) {
      return NextResponse.json({ error: "Redeemable ID is required" }, { status: 400 })
    }

    // Get the redeemable details
    const { data: redeemable, error: redeemableError } = await supabase
      .from("token_redeemables")
      .select("*")
      .eq("id", redeemable_id)
      .eq("is_active", true)
      .single()

    if (redeemableError || !redeemable) {
      console.error("❌ Redeemable not found:", redeemableError)
      return NextResponse.json({ error: "Redeemable not found" }, { status: 404 })
    }

    // Get user's current token balance
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (tokenError || !tokenData) {
      console.error("❌ Error fetching user tokens:", tokenError)
      return NextResponse.json({ error: "Failed to fetch token balance" }, { status: 500 })
    }

    // Check if user has enough tokens
    if (tokenData.balance < redeemable.cost) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 })
    }

    // Start a transaction to deduct tokens and create redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from("token_redemptions")
      .insert({
        user_id: userId,
        redeemable_id: redeemable_id,
        tokens_spent: redeemable.cost,
        status: redeemable.requires_approval ? "pending" : "approved",
        notes: notes || null,
      })
      .select()
      .single()

    if (redemptionError) {
      console.error("❌ Error creating redemption:", redemptionError)
      return NextResponse.json({ error: "Failed to create redemption" }, { status: 500 })
    }

    // Deduct tokens from user's balance
    const { error: updateError } = await supabase
      .from("tokens")
      .update({ balance: tokenData.balance - redeemable.cost })
      .eq("user_id", userId)

    if (updateError) {
      console.error("❌ Error updating token balance:", updateError)
      // Try to rollback the redemption
      await supabase.from("token_redemptions").delete().eq("id", redemption.id)
      return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 })
    }

    // Create a transaction record
    await supabase.from("token_transactions").insert({
      user_id: userId,
      amount: -redeemable.cost,
      transaction_type: "redemption",
      source: "token_redemption",
      description: `Redeemed: ${redeemable.name}`,
    })

    console.log("✅ Redemption successful")

    const message = redeemable.requires_approval ? "Redemption submitted for approval" : "Redemption successful"

    return NextResponse.json({ message, redemption })
  } catch (error: any) {
    console.error("❌ Token redeem API error:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
