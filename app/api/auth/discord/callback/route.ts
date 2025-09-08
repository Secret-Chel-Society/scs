import { NextResponse } from "next/server"

// Check if we're in development mode and provide fallback values
const isDevelopment = process.env.NODE_ENV === "development"
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1365888660171653150"
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/discord/callback`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    console.log("Discord callback received:", {
      code: !!code,
      state,
      hasClientSecret: !!DISCORD_CLIENT_SECRET,
      clientId: DISCORD_CLIENT_ID,
      isDevelopment,
    })

    if (!code) {
      console.error("No authorization code received")
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=no_code`)
    }

    // Check for Discord client secret
    if (!DISCORD_CLIENT_SECRET) {
      console.error("Discord client secret not configured")
      console.log("Available Discord env vars:", {
        DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN,
        DISCORD_GUILD_ID: !!process.env.DISCORD_GUILD_ID,
        DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
      })

      // In development, provide a more helpful error
      if (isDevelopment) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=missing_client_secret`)
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=config_error`)
    }

    // Handle registration flow
    if (state === "register") {
      console.log("Processing Discord connection for registration")

      try {
        // Exchange code for access token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: DISCORD_REDIRECT_URI,
          }),
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error("Token exchange failed:", {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: errorText,
          })
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=token_failed`)
        }

        const tokenData = await tokenResponse.json()
        console.log("Token exchange successful")

        // Get user info from Discord
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error("Failed to get Discord user info:", {
            status: userResponse.status,
            statusText: userResponse.statusText,
            error: errorText,
          })
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=user_info_failed`)
        }

        const discordUser = await userResponse.json()
        console.log("Discord user info retrieved:", {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
        })

        // Store Discord info in localStorage for the registration form
        const discordInfo = {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || "0000",
          avatar: discordUser.avatar,
        }

        // Create a response that sets localStorage and redirects
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Discord Connected</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #5865F2;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2>Discord Connected Successfully!</h2>
              <p>Redirecting you back to registration...</p>
            </div>
            <script>
              try {
                localStorage.setItem('discord_connection_info', '${JSON.stringify(discordInfo).replace(/'/g, "\\'")}');
                console.log('Discord info stored:', ${JSON.stringify(discordInfo)});
                setTimeout(() => {
                  window.location.href = '${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_connected=true';
                }, 1500);
              } catch (error) {
                console.error('Error storing Discord info:', error);
                window.location.href = '${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=storage_failed';
              }
            </script>
          </body>
          </html>
        `

        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html",
          },
        })
      } catch (error) {
        console.error("Error in registration flow:", error)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=registration_flow_failed`,
        )
      }
    }

    // Handle settings flow (existing logic)
    let userId: string
    let source: string

    try {
      if (state?.includes(":")) {
        const [id, src] = state.split(":")
        userId = id
        source = src
      } else {
        throw new Error("Invalid state format")
      }
    } catch {
      console.error("Invalid state format:", state)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_error=invalid_state`)
    }

    if (!userId) {
      console.error("Missing user ID in state")
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_error=missing_user_id`)
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error("Token exchange failed:", errorText)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_error=token_exchange_failed`)
      }

      const tokenData = await tokenResponse.json()

      // Get user info from Discord
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        console.error("Failed to get Discord user info")
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_error=user_info_failed`)
      }

      const discordUser = await userResponse.json()
      console.log("Discord user connected:", { id: discordUser.id, username: discordUser.username })

      // For settings flow, we need to update the database
      // This would require importing Supabase client here
      // For now, redirect to settings with success
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_connected=true`)
    } catch (error) {
      console.error("Error in settings flow:", error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?discord_error=settings_flow_failed`)
    }
  } catch (error: any) {
    console.error("Discord callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/register?discord_error=callback_failed`)
  }
}
