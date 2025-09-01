import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { normalizeRole, roleHasPermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated", userError: userError?.message }, { status: 401 })
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    // Get team managers
    const { data: teamManagers, error: managersError } = await supabase
      .from("team_managers")
      .select("team_id, role, teams:team_id(name)")
      .eq("user_id", user.id)

    // Check permissions
    const isAdmin = userRoles?.some((role) => roleHasPermission(role.role, "Admin")) || false
    const hasTeamManagerRole = teamManagers?.some((manager) => roleHasPermission(manager.role, "TeamManager")) || false

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      roles: {
        userRoles: userRoles?.map((r) => ({
          role: r.role,
          normalized: normalizeRole(r.role),
          hasAdminPermission: roleHasPermission(r.role, "Admin"),
        })),
        teamManagers: teamManagers?.map((tm) => ({
          teamId: tm.team_id,
          teamName: tm.teams?.name,
          role: tm.role,
          normalized: normalizeRole(tm.role),
          hasTeamManagerPermission: roleHasPermission(tm.role, "TeamManager"),
        })),
      },
      permissions: {
        isAdmin,
        hasTeamManagerRole,
        canManageMatches: isAdmin || hasTeamManagerRole,
      },
      errors: {
        rolesError: rolesError?.message,
        managersError: managersError?.message,
      },
    })
  } catch (error: any) {
    console.error("Error checking user permissions:", error)
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 })
  }
}
