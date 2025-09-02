import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("=== ADMIN TOKEN MANAGEMENT API START ===")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const team = searchParams.get("team") || ""
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    // Build query for users with token data
    let query = supabase
      .from("users")
      .select(`
        id,
        email,
        gamer_tag_id,
        primary_position,
        secondary_position,
        console,
        created_at,
        is_active,
        tokens(balance),
        players(
          team_id,
          role,
          teams:team_id(name, logo_url)
        )
      `)
      .eq("is_active", true)

    // Apply search filter
    if (search) {
      query = query.or(`gamer_tag_id.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error("❌ Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Process and sort users
    const processedUsers =
      users?.map((user) => ({
        ...user,
        token_balance: user.tokens?.[0]?.balance || 0,
        team_name: user.players?.[0]?.teams?.name || "Free Agent",
        team_logo: user.players?.[0]?.teams?.logo_url || null,
        role: user.players?.[0]?.role || "Player",
      })) || []

    // Apply team filter
    const filteredUsers = team
      ? processedUsers.filter(
          (user) => user.team_name === team || (team === "Free Agent" && user.team_name === "Free Agent"),
        )
      : processedUsers

    // Sort users
    filteredUsers.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case "tokens":
          aValue = a.token_balance
          bValue = b.token_balance
          break
        case "team":
          aValue = a.team_name
          bValue = b.team_name
          break
        case "position":
          aValue = a.primary_position
          bValue = b.primary_position
          break
        default:
          aValue = a.gamer_tag_id || a.email
          bValue = b.gamer_tag_id || b.email
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })

    console.log(`✅ Fetched ${filteredUsers.length} users for token management`)

    return NextResponse.json({ users: filteredUsers })
  } catch (error: any) {
    console.error("❌ Admin token management API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== ADMIN TOKEN TRANSACTION API START ===")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { user_id, amount, source, description } = body

    // Get admin user ID from session
    const session = cookies().get("sb-access-token")?.value
    const { data, error } = await supabase.auth.getUser(session ? { access_token: session } : undefined)
    const user = data.user

    console.log("Creating token transaction:", { user_id, amount, source, description })

    // First, check if user has a tokens record
    const { data: existingTokens, error: tokensCheckError } = await supabase
      .from("tokens")
      .select("*")
      .eq("user_id", user_id)
      .single()

    if (tokensCheckError && tokensCheckError.code !== "PGRST116") {
      console.error("❌ Error checking existing tokens:", tokensCheckError)
      return NextResponse.json({ error: tokensCheckError.message }, { status: 500 })
    }

    // If no tokens record exists, create one
    if (!existingTokens) {
      console.log("Creating new tokens record for user:", user_id)
      const { error: createTokensError } = await supabase.from("tokens").insert({
        user_id,
        balance: Math.max(0, amount), // Ensure balance doesn't go negative
      })

      if (createTokensError) {
        console.error("❌ Error creating tokens record:", createTokensError)
        return NextResponse.json({ error: createTokensError.message }, { status: 500 })
      }
    } else {
      // Update existing tokens record
      const newBalance = Math.max(0, existingTokens.balance + amount)
      console.log("Updating tokens balance:", { oldBalance: existingTokens.balance, amount, newBalance })

      const { error: updateTokensError } = await supabase
        .from("tokens")
        .update({ balance: newBalance })
        .eq("user_id", user_id)

      if (updateTokensError) {
        console.error("❌ Error updating tokens balance:", updateTokensError)
        return NextResponse.json({ error: updateTokensError.message }, { status: 500 })
      }
    }

    // Create token transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("token_transactions")
      .insert({
        user_id,
        amount,
        transaction_type: amount > 0 ? "earned" : "spent",
        source: source || "admin",
        description: description || "Admin adjustment",
        admin_user_id: user?.id || null,
      })
      .select()

    if (transactionError) {
      console.error("❌ Error creating transaction:", transactionError)
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    console.log("✅ Token transaction created successfully")

    return NextResponse.json({
      transaction: transaction?.[0],
      message: "Token adjustment completed successfully",
    })
  } catch (error: any) {
    console.error("❌ Admin token transaction API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
