import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { awardId, seasonNumber } = body

    if (!awardId || seasonNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure seasonNumber is a valid integer
    const parsedSeasonNumber = Number.parseInt(String(seasonNumber), 10)
    if (isNaN(parsedSeasonNumber)) {
      return NextResponse.json({ error: "Invalid season number" }, { status: 400 })
    }

    // Update the award with the correct season number
    const { error } = await supabase.from("team_awards").update({ season_number: parsedSeasonNumber }).eq("id", awardId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Award ${awardId} updated with season ${parsedSeasonNumber}`,
    })
  } catch (error: any) {
    console.error("Error fixing award season:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
