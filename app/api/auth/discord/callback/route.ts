import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Toggle this when debugging locally
const isDevelopment = process.env.NODE_ENV === "development"

// Use environment variables for security
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1403504252508307476"
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "placeholder_secret"
const SITE_URL = isDevelopment
  ? "http://localhost:3000"
  : "https://www.secretchelsociety.com"
const DISCORD_REDIRECT_URI = `${SITE_URL}/api/auth/discord/callback`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    console.log("Discord callback received:", {
      code: !!code,
      state,
      clientId: DISCORD_CLIENT_ID,
      isDevelopment,
      redirectUri: DISCORD_REDIRECT_URI,
    })

    if (!code) {
      console.error("No authorization code received")
      return NextResponse.redirect(`${SITE_URL}/register?discord_error=no_code`)
    }

    // Handle registration flow
    if (state === "register") {
      console.log("Processing Discord connection for registration")

      try {
        // Exchange code for token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
          return NextResponse.redirect(`${SITE_URL}/register?discord_error=token_failed`)
        }

        const tokenData = await tokenResponse.json()

        // Get Discord user
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })

        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error("Failed to get Discord user info:", errorText)
          return NextResponse.redirect(`${SITE_URL}/register?discord_error=user_info_failed`)
        }

        const discordUser = await userResponse.json()
        console.log("Discord user info retrieved:", {
          id: discordUser.id,
          username: discordUser.username,
        })

        // Store in localStorage + redirect
        const discordInfo = {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || "0000",
          avatar: discordUser.avatar,
        }

        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <script>
              localStorage.setItem('discord_connection_info', '${JSON.stringify(discordInfo).replace(/'/g, "\\'")}')
              window.location.href = '${SITE_URL}/register?discord_connected=true'
            </script>
          </body>
          </html>
        `
        return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
      } catch (error) {
        console.error("Error in registration flow:", error)
        return NextResponse.redirect(`${SITE_URL}/register?discord_error=registration_flow_failed`)
      }
    }

    // Handle login flow
    if (state === "login") {
      console.log("Processing Discord login")

      try {
        // Exchange code for token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
          return NextResponse.redirect(`${SITE_URL}/login?discord_error=token_failed`)
        }

        const tokenData = await tokenResponse.json()

        // Get Discord user
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })

        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error("Failed to get Discord user info:", errorText)
          return NextResponse.redirect(`${SITE_URL}/login?discord_error=user_info_failed`)
        }

        const discordUser = await userResponse.json()
        console.log("Discord user info retrieved for login:", {
          id: discordUser.id,
          username: discordUser.username,
        })

        // Check if user exists with this Discord ID
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        
        // First check discord_users table
        const { data: discordConnection, error: discordError } = await supabase
          .from("discord_users")
          .select("user_id")
          .eq("discord_id", discordUser.id)
          .single()

        if (discordError && discordError.code !== "PGRST116") {
          console.error("Error checking Discord connection:", discordError)
          return NextResponse.redirect(`${SITE_URL}/login?discord_error=database_error`)
        }

        if (!discordConnection) {
          // User doesn't exist, redirect to register with Discord info
          const discordInfo = {
            id: discordUser.id,
            username: discordUser.username,
            discriminator: discordUser.discriminator || "0000",
            avatar: discordUser.avatar,
          }

          const html = `
            <!DOCTYPE html>
            <html>
            <body>
              <script>
                localStorage.setItem('discord_connection_info', '${JSON.stringify(discordInfo).replace(/'/g, "\\'")}')
                window.location.href = '${SITE_URL}/register?discord_connected=true&from_login=true'
              </script>
            </body>
            </html>
          `
          return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
        }

        // User exists, get their auth user
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(discordConnection.user_id)

        if (userError || !user.user) {
          console.error("Error getting user:", userError)
          return NextResponse.redirect(`${SITE_URL}/login?discord_error=user_not_found`)
        }

        // Create a session for the user
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          user_id: user.user.id,
        })

        if (sessionError) {
          console.error("Error creating session:", sessionError)
          return NextResponse.redirect(`${SITE_URL}/login?discord_error=session_failed`)
        }

        // Redirect with session
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <script>
              // Set the session in localStorage
              localStorage.setItem('supabase.auth.token', '${JSON.stringify(sessionData.session).replace(/'/g, "\\'")}')
              window.location.href = '${SITE_URL}/?discord_login_success=true'
            </script>
          </body>
          </html>
        `
        return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
      } catch (error) {
        console.error("Error in login flow:", error)
        return NextResponse.redirect(`${SITE_URL}/login?discord_error=login_flow_failed`)
      }
    }

    // Settings flow
    let userId: string
    let source: string
    try {
      if (state?.includes(":")) {
        const [id, src] = state.split(":")
        userId = id
        source = src
      } else throw new Error("Invalid state format")
    } catch {
      console.error("Invalid state format:", state)
      return NextResponse.redirect(`${SITE_URL}/settings?discord_error=invalid_state`)
    }

    try {
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
        return NextResponse.redirect(`${SITE_URL}/settings?discord_error=token_exchange_failed`)
      }

      const tokenData = await tokenResponse.json()
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      if (!userResponse.ok) {
        console.error("Failed to get Discord user info")
        return NextResponse.redirect(`${SITE_URL}/settings?discord_error=user_info_failed`)
      }

      const discordUser = await userResponse.json()
      console.log("Discord user connected:", { id: discordUser.id, username: discordUser.username })

      return NextResponse.redirect(`${SITE_URL}/settings?discord_connected=true`)
    } catch (error) {
      console.error("Error in settings flow:", error)
      return NextResponse.redirect(`${SITE_URL}/settings?discord_error=settings_flow_failed`)
    }
  } catch (error: any) {
    console.error("Discord callback error:", error)
    return NextResponse.redirect(`${SITE_URL}/register?discord_error=callback_failed`)
  }
}
