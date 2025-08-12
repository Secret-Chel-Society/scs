import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.session?.user.id)
      .single()

    if (existingUserError) {
      console.error("Error checking for existing user:", existingUserError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }

    if (!existingUser) {
      const { data: user, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      // Create player record with $0 salary for new registrations
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          user_id: user.user?.id,
          salary: 0, // Changed from 750000 to 0
          role: "Player",
          team_id: null,
        })
        .select()
        .single()

      if (playerError) {
        console.error("Error creating player record:", playerError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
