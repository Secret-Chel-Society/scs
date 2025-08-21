import { NextResponse } from "next/server"

const isDevelopment = process.env.NODE_ENV === "development"
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
  (isDevelopment ? "http://localhost:3000" : "https://www.secretchelsociety.com")

// Prefer explicit env var, fallback to SITE_URL version
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI?.trim() ||
  `${SITE_URL}/api/auth/discord/callback`

/**
 * STEP 1: Start OAuth flow
 * /api/auth/discord
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const state = searchParams.get("state")

    // Ensure no spaces/newlines sneak into redirect URI
    const safeRedirectUri = DISCORD_REDIRECT_URI.replace(/^\s+|\s+$/g, "")

    console.log("Discord OAuth request:", {
      userId,
      state,
      hasClientId: !!DISCORD_CLIENT_ID,
      hasClientSecret: !!DISCORD_CLIENT_SECRET,
      redirectUri: safeRedirectUri,
      siteUrl: SITE_URL,
    })

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return NextResponse.json({ error: "Discord not configured" }, { status: 500 })
    }

    // Build the Discord OAuth URL
    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize")
    discordAuthUrl.searchParams.set("client_id", DISCORD_CLIENT_ID)
    discordAuthUrl.searchParams.set("redirect_uri", safeRedirectUri)
    discordAuthUrl.searchParams.set("response_type", "code")
    discordAuthUrl.searchParams.set("scope", "identify email guilds")

    if (state) {
      discordAuthUrl.searchParams.set("state", state)
    }

    console.log("Redirecting to Discord OAuth:", discordAuthUrl.toString())

    return NextResponse.redirect(discordAuthUrl.toString())
  } catch (error: any) {
    console.error("Discord OAuth error:", error)
    return NextResponse.json(
      { error: "Failed to initiate Discord OAuth", details: error.message },
      { status: 500 },
    )
  }
}

/**
 * STEP 2: Handle callback
 * /api/auth/discord/callback
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/register?discord_error=no_code`)
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error(JSON.stringify(tokenData))

    // 2. Fetch Discord user profile
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const user = await userResponse.json()

    // 3. (Placeholder) Save user / create session
    // Replace this with your DB + session system
    console.log("Discord user authenticated:", user)

    // Redirect back to your app
    return NextResponse.redirect(`${SITE_URL}/settings`)
  } catch (err: any) {
    console.error("Discord callback error:", err)
    return NextResponse.redirect(`${SITE_URL}/register?discord_error=callback_failed`)
  }
}
