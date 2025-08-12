import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
    console.log("=== USER PROFILE API START ===")

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

    // Get user profile from the database
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("Profile query result:", { profile: !!profile, error: profileError })

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch user profile", details: profileError.message },
        { status: 500 },
      )
    }

    console.log("✅ User profile found")

    // Get player data with team information
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select(`
        id,
        role,
        team_id,
        salary,
        teams:team_id(
          id,
          name,
          logo_url
        )
      `)
      .eq("user_id", userId)
      .single()

    console.log("Player query result:", { playerData: !!playerData, error: playerError })

    // Get current season registration data
    const { data: registrationData, error: registrationError } = await supabase
      .from("season_registrations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    console.log("Registration query result:", { registrationData: !!registrationData, error: registrationError })

    // Prepare the response data
    const responseData = {
      user: profile,
      player: playerData || null,
      team: playerData?.teams || null,
      registration: registrationData || null,
    }

    console.log("Final response data structure:", {
      hasUser: !!responseData.user,
      hasPlayer: !!responseData.player,
      hasTeam: !!responseData.team,
      hasRegistration: !!responseData.registration,
      teamId: responseData.player?.team_id,
      salary: responseData.player?.salary,
      primaryPosition: responseData.registration?.primary_position,
      registrationStatus: responseData.registration?.status,
    })

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("❌ User profile API error:", error.message)
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
