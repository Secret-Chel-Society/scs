import { NextResponse } from "next/server"

const isDevelopment = process.env.NODE_ENV === "development"
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1365888660171653150"
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/discord/callback`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const state = searchParams.get("state")

    console.log("Discord OAuth request:", {
      userId,
      state,
      hasClientId: !!DISCORD_CLIENT_ID,
      hasClientSecret: !!DISCORD_CLIENT_SECRET,
      redirectUri: DISCORD_REDIRECT_URI,
    })

    // Check if Discord is properly configured
    if (!DISCORD_CLIENT_ID) {
      console.error("Discord client ID not configured")
      return NextResponse.json({ error: "Discord client ID not configured" }, { status: 500 })
    }

    if (!DISCORD_CLIENT_SECRET) {
      console.error("Discord client secret not configured")
      console.log("Available Discord env vars:", {
        DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN,
        DISCORD_GUILD_ID: !!process.env.DISCORD_GUILD_ID,
        DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
      })

      // Return a more helpful error in development
      if (isDevelopment) {
        return NextResponse.json(
          {
            error: "Discord OAuth not configured",
            details: "DISCORD_CLIENT_SECRET environment variable is missing",
            availableVars: {
              DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN,
              DISCORD_GUILD_ID: !!process.env.DISCORD_GUILD_ID,
              DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
              DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
            },
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ error: "Discord not configured" }, { status: 500 })
    }

    // Build the Discord OAuth URL
    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize")
    discordAuthUrl.searchParams.set("client_id", DISCORD_CLIENT_ID)
    discordAuthUrl.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI)
    discordAuthUrl.searchParams.set("response_type", "code")
    discordAuthUrl.searchParams.set("scope", "identify")

    // Use the state parameter directly
    if (state) {
      discordAuthUrl.searchParams.set("state", state)
    }

    console.log("Redirecting to Discord OAuth:", discordAuthUrl.toString())

    return NextResponse.redirect(discordAuthUrl.toString())
  } catch (error: any) {
    console.error("Discord OAuth error:", error)
    return NextResponse.json(
      {
        error: "Failed to initiate Discord OAuth",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
