import { NextResponse } from "next/server"

export async function GET() {
  const isDevelopment = process.env.NODE_ENV === "development"
  
  // Only allow this in development
  if (!isDevelopment) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const config = {
    DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || 
             (isDevelopment ? "http://localhost:3000" : "https://www.secretchelsociety.com"),
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || 
                  (isDevelopment ? "http://localhost:3000" : "https://www.secretchelsociety.com")}/api/auth/discord/callback`
  }

  return NextResponse.json(config)
}
