import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId, banReason, banDuration } = await request.json()

    if (!userId || !banReason || !banDuration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role client for admin operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Calculate ban expiration date
    let banExpiration = null
    if (banDuration !== "permanent") {
      const now = new Date()

      if (banDuration.includes("day")) {
        const days = Number.parseInt(banDuration)
        banExpiration = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
      } else if (banDuration.includes("week")) {
        const weeks = Number.parseInt(banDuration)
        banExpiration = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (banDuration.includes("month")) {
        const months = Number.parseInt(banDuration)
        const futureDate = new Date(now)
        futureDate.setMonth(futureDate.getMonth() + months)
        banExpiration = futureDate.toISOString()
      } else if (banDuration.includes("year")) {
        const years = Number.parseFloat(banDuration)
        const futureDate = new Date(now)
        futureDate.setFullYear(futureDate.getFullYear() + years)
        banExpiration = futureDate.toISOString()
      } else {
        // Handle custom duration - try to parse it
        const customMatch = banDuration.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i)
        if (customMatch) {
          const amount = Number.parseFloat(customMatch[1])
          const unit = customMatch[2].toLowerCase()
          const futureDate = new Date(now)

          switch (unit) {
            case "day":
              banExpiration = new Date(now.getTime() + amount * 24 * 60 * 60 * 1000).toISOString()
              break
            case "week":
              banExpiration = new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000).toISOString()
              break
            case "month":
              futureDate.setMonth(futureDate.getMonth() + amount)
              banExpiration = futureDate.toISOString()
              break
            case "year":
              futureDate.setFullYear(futureDate.getFullYear() + amount)
              banExpiration = futureDate.toISOString()
              break
          }
        }
      }
    }

    // Update user with ban information - IMPORTANT: Set is_banned to true
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_banned: true, // This was missing!
        ban_reason: banReason,
        ban_expiration: banExpiration,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error banning user:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User banned successfully",
      banExpiration,
    })
  } catch (error: any) {
    console.error("Error in ban-user API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
