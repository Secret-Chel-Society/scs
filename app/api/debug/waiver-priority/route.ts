import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Debug session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Debug user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Debug teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, wins, losses, otl, points, goal_differential")
      .eq("is_active", true)
      .limit(5)

    return NextResponse.json({
      debug: {
        session: {
          exists: !!session,
          userId: session?.user?.id,
          error: sessionError?.message,
        },
        user: {
          exists: !!user,
          userId: user?.id,
          error: userError?.message,
        },
        teams: {
          count: teams?.length || 0,
          error: teamsError?.message,
          sample: teams?.slice(0, 2),
        },
        cookies: {
          count: cookies().getAll().length,
          names: cookies()
            .getAll()
            .map((c) => c.name),
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    })
  }
}
