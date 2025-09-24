import { type NextRequest, NextResponse } from "next/server"
import { createCustomClient } from "@/lib/supabase/custom-client"

export async function GET(request: NextRequest) {
  try {
    console.log("=== TOKEN TRANSACTIONS API START ===")

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

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Get user's token transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (transactionsError) {
      console.error("❌ Error fetching transactions:", transactionsError)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    console.log("✅ Found", transactions?.length || 0, "transactions")

    return NextResponse.json({ transactions: transactions || [] })
  } catch (error: any) {
    console.error("❌ Token transactions API error:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
