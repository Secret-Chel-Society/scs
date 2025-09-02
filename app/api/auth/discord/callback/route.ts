import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      return NextResponse.json({ error: "No authorization code received" }, { status: 400 })
    }

    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Discord OAuth not configured" }, { status: 500 })
    }

    // Use the same callback URL that was used in the initial request
    const redirectUri = "https://www.secretchelsociety.com/api/auth/discord/callback"

    console.log("Discord OAuth callback processing with redirect URI:", redirectUri)

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
              // Fallback for non-popup - use URL parameters for more reliable transfer
              const redirectUrl = '/register?discord_connected=true&discord_id=${discordUser.id}&discord_username=${encodeURIComponent(discordUser.username)}';
              window.location.href = redirectUrl;
            }
          </script>
          <p>Discord account connected successfully! Redirecting...</p>
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

    // Default fallback
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Connected</title>
      </head>
      <body>
        <script>
          // Store Discord info and redirect to home
          localStorage.setItem('discord_temp_info', JSON.stringify({
            discord_id: '${discordUser.id}',
            discord_username: '${discordUser.username}'
          }));
          window.location.href = '/?discord_connected=true';
        </script>
        <p>Discord account connected successfully! Redirecting...</p>
      </body>
      </html>
    `
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } })

  } catch (error: any) {
    console.error("Error handling OAuth callback:", error)
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 })
  }
}
