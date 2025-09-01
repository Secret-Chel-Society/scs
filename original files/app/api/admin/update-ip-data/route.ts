import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if the user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (roleError || !roleData || roleData.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users without registration_ip or last_login_ip
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .or("registration_ip.is.null,last_login_ip.is.null")

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Update each user with a placeholder IP
    const updates = []
    for (const user of users) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          registration_ip: user.registration_ip || "0.0.0.0",
          last_login_ip: user.last_login_ip || "0.0.0.0",
          last_login_at: user.last_login_at || new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        console.error(`Error updating user ${user.id}:`, updateError)
      } else {
        updates.push(user.id)
      }

      // Add an entry to the ip_logs table
      const { error: ipLogError } = await supabase.from("ip_logs").insert({
        user_id: user.id,
        ip_address: "0.0.0.0",
        action: "backfill",
        user_agent: "System backfill",
      })

      if (ipLogError) {
        console.error(`Error adding IP log for user ${user.id}:`, ipLogError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} users with placeholder IP data`,
      updatedUsers: updates.length,
    })
  } catch (error: any) {
    console.error("Error updating IP data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
