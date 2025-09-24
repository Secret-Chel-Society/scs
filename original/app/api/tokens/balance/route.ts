import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
    console.log("=== TOKEN BALANCE API START ===")

    // Get the Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Authorization header:", authHeader ? "Present" : "Missing")

    // Create a response object to handle cookies
    const response = NextResponse.next()

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: any) {
            response.cookies.set(name, "", { ...options, maxAge: 0 })
          },
        },
        global: {
          headers: {
            Authorization: authHeader || "",
          },
        },
      },
    )

    // Try to get the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("User check:", {
      hasUser: !!user,
      userId: user?.id,
      error: userError,
    })

    if (userError || !user) {
      console.error("Authentication failed:", userError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = user.id
    console.log("Authenticated user ID:", userId)

    // First, check if there's a token record for this user
    let { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    console.log("Token query result:", { tokenData, error: tokenError })

    if (tokenError) {
      console.error("❌ Error fetching token balance:", tokenError)
      return NextResponse.json({ error: "Failed to fetch token balance", details: tokenError.message }, { status: 500 })
    }

    // If no token record exists, create one with balance 0
    if (!tokenData) {
      console.log("📝 No token record found, creating one...")
      const { data: newTokenData, error: createError } = await supabase
        .from("tokens")
        .insert({
          user_id: userId,
          balance: 0,
        })
        .select("balance")
        .single()

      console.log("Token creation result:", { newTokenData, error: createError })

      if (createError) {
        console.error("❌ Error creating token record:", createError)
        // If creation fails, just return 0 balance
        console.log("⚠️ Falling back to balance 0")
        return NextResponse.json({ balance: 0 })
      }

      tokenData = newTokenData
      console.log("✅ Created new token record with balance 0")
    }

    const balance = tokenData?.balance || 0
    console.log("✅ Token balance found:", balance)

    return NextResponse.json({ balance })
  } catch (error: any) {
    console.error("❌ Token balance API error:", error.message)
    console.error("Stack trace:", error.stack)
    // Return 0 balance as fallback
    return NextResponse.json({ balance: 0 })
  }
}
