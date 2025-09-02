import { NextResponse } from "next/server"

export async function GET() {
  try {
    const isDevelopment = process.env.NODE_ENV === "development"
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (isDevelopment ? "http://localhost:3000" : "https://www.secretchelsociety.com")
    const DISCORD_REDIRECT_URI = process.env.REDIRECT_URI || `${SITE_URL}/api/auth/discord/callback`

    return NextResponse.json({
      status: "ok",
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DISCORD_CLIENT_ID: DISCORD_CLIENT_ID ? "Configured" : "Missing",
        DISCORD_CLIENT_SECRET: DISCORD_CLIENT_SECRET ? "Configured" : "Missing",
        SITE_URL,
        DISCORD_REDIRECT_URI
      },
      endpoints: {
        login: "/api/auth/discord/login",
        callback: "/api/auth/discord/callback",
        status: "/api/auth/discord/status"
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message
    }, { status: 500 })
  }
}
