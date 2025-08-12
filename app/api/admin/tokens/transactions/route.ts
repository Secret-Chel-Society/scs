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
    const userId = searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's token transactions with running balance calculation
    const { data: transactions, error: transactionsError } = await supabase
      .from("token_transactions")
      .select(`
        id,
        user_id,
        amount,
        transaction_type,
        source,
        description,
        created_at,
        admin_user_id,
        reference_id
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json({ error: transactionsError.message }, { status: 500 })
    }

    // Get current token balance
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (tokenError && tokenError.code !== "PGRST116") {
      console.error("Error fetching token balance:", tokenError)
      return NextResponse.json({ error: tokenError.message }, { status: 500 })
    }

    const currentBalance = tokenData?.balance || 0

    // Calculate running balance for each transaction (working backwards from current balance)
    let runningBalance = currentBalance
    const transactionsWithBalance =
      transactions?.map((transaction, index) => {
        const balanceAfter = runningBalance
        // For the next iteration, subtract this transaction's amount to get the balance before
        runningBalance = runningBalance - transaction.amount

        return {
          ...transaction,
          balance_after: balanceAfter,
        }
      }) || []

    return NextResponse.json({
      transactions: transactionsWithBalance,
      current_balance: currentBalance,
      total_transactions: transactions?.length || 0,
    })
  } catch (error: any) {
    console.error("Admin token transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
