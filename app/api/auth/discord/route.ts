import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const state = searchParams.get("state")
    const code = searchParams.get("code")

    // If we have a code, this is the OAuth callback
    if (code) {
      return await handleOAuthCallback(code, state)
    }

    // Otherwise, this is the initial OAuth request
    return await initiateOAuth(userId, state, request)
  } catch (error: any) {
    console.error("Error in Discord OAuth:", error)
    return NextResponse.json({ error: "OAuth process failed" }, { status: 500 })
  }
}

async function initiateOAuth(userId: string | null, state: string | null, request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json({ error: "Discord OAuth not configured" }, { status: 500 })
  }

  // Use the correct callback URL
  const redirectUri = "https://www.secretchelsociety.com/api/auth/discord/callback"
  
  console.log("Discord OAuth redirect URI:", redirectUri)

  const scope = "identify"
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(state || "")}`

  return NextResponse.redirect(authUrl)
}

async function handleOAuthCallback(code: string, state: string | null) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Discord OAuth not configured" }, { status: 500 })
    }

    // Use the same callback URL that was used in the initial request
    const redirectUri = "https://www.secretchelsociety.com/api/auth/discord/callback"

    console.log("Discord OAuth callback redirect URI:", redirectUri)

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      return NextResponse.json({ error: "Failed to exchange code for token", details: errorText }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      console.error("Failed to get Discord user info:", await userResponse.text())
      return NextResponse.json({ error: "Failed to get Discord user info" }, { status: 500 })
    }

    const discordUser = await userResponse.json()

    // Parse state to get user ID and source
    let targetUserId: string | null = null
    let source: string | null = null

    if (state) {
      const stateParts = state.split(":")
      if (stateParts.length === 2) {
        targetUserId = stateParts[0]
        source = stateParts[1]
      } else if (state === "register") {
        // This is a registration flow
        source = "register"
      }
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    if (source === "register") {
      // For registration, store Discord info temporarily
      // This will be handled by the registration completion
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Discord Connected</title>
        </head>
        <body>
          <script>
            // Send message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'discord_connected',
                discord_id: '${discordUser.id}',
                discord_username: '${discordUser.username}'
              }, '*');
            } else {
              // Fallback for non-popup
              localStorage.setItem('discord_temp_info', JSON.stringify({
                discord_id: '${discordUser.id}',
                discord_username: '${discordUser.username}'
              }));
              window.location.href = '/register?discord_connected=true';
            }
          </script>
          <p>Discord account connected successfully! You can close this window.</p>
        </body>
        </html>
      `
      return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
    }

    if (targetUserId && source === "settings") {
      // For settings, connect Discord to existing user
      const { error: discordError } = await supabase.from("discord_users").upsert(
        {
          user_id: targetUserId,
          discord_id: discordUser.id,
          discord_username: discordUser.username,
          discord_discriminator: discordUser.discriminator || "0000",
          discord_avatar: discordUser.avatar,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (discordError) {
        console.error("Error saving Discord connection:", discordError)
        return NextResponse.json({ error: "Failed to save Discord connection" }, { status: 500 })
      }

      // Return success page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Discord Connected</title>
        </head>
        <body>
          <script>
            // Send message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'discord_connected',
                discord_id: '${discordUser.id}',
                discord_username: '${discordUser.username}'
              }, '*');
            } else {
              // Fallback for non-popup
              window.location.href = '/settings?discord_connected=true';
            }
          </script>
          <p>Discord account connected successfully! You can close this window.</p>
        </body>
        </html>
      `
      return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
    }

    return NextResponse.json({ error: "Invalid OAuth flow" }, { status: 400 })
  } catch (error: any) {
    console.error("Error handling OAuth callback:", error)
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 })
  }
}
