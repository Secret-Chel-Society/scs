import { NextResponse } from "next/server"

const isDevelopment = process.env.NODE_ENV === "development"
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (isDevelopment ? "http://localhost:3000" : "https://www.secretchelsociety.com")
const DISCORD_REDIRECT_URI = `${SITE_URL}/api/auth/discord/callback`

export async function GET(request: Request) {
  try {
    console.log("Discord login OAuth request initiated")

    // Check if Discord is properly configured
    if (!DISCORD_CLIENT_ID) {
      console.error("Discord client ID not configured")
      return NextResponse.json({ error: "Discord client ID not configured" }, { status: 500 })
    }

    if (!DISCORD_CLIENT_SECRET) {
      console.error("Discord client secret not configured")
      return NextResponse.json({ error: "Discord not configured" }, { status: 500 })
    }

    // Build the Discord OAuth URL for login
    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize")
    discordAuthUrl.searchParams.set("client_id", DISCORD_CLIENT_ID)
    discordAuthUrl.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI)
    discordAuthUrl.searchParams.set("response_type", "code")
    discordAuthUrl.searchParams.set("scope", "identify")
    discordAuthUrl.searchParams.set("state", "login") // State for login flow

    console.log("Redirecting to Discord OAuth for login:", discordAuthUrl.toString())

    return NextResponse.redirect(discordAuthUrl.toString())
  } catch (error: any) {
    console.error("Discord login OAuth error:", error)
    return NextResponse.json({ error: "Failed to initiate Discord login" }, { status: 500 })
  }
}
