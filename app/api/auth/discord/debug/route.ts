import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    return NextResponse.json({
      configured: {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        siteUrl: !!siteUrl,
      },
      values: {
        clientId: clientId ? `${clientId.substring(0, 8)}...` : null,
        clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : null,
        siteUrl,
      },
      callbackUrl: "https://www.secretchelsociety.com/api/auth/discord/callback",
      oauthUrl: clientId ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent("https://www.secretchelsociety.com/api/auth/discord/callback")}&response_type=code&scope=identify` : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
