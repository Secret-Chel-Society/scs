import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { roleHasPermission, normalizeRole, canManageMatch } from "@/lib/rbac"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { userId, matchId, testRole } = await request.json()
    const supabase = createServerSupabaseClient(cookies())

    // Test role normalization
    const normalizedRole = normalizeRole(testRole || "Owner")
    const hasTeamManagerPermission = roleHasPermission(testRole || "Owner", "TeamManager")
    const hasAdminPermission = roleHasPermission(testRole || "Owner", "Admin")

    // Test match management permission if matchId and userId provided
    let matchPermissionResult = null
    if (userId && matchId) {
      matchPermissionResult = await canManageMatch(supabase, userId, matchId)
    }

    // Get current user's actual permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let currentUserPermissions = null
    if (session?.user && matchId) {
      currentUserPermissions = await canManageMatch(supabase, session.user.id, matchId)
    }

    return NextResponse.json({
      testResults: {
        inputRole: testRole || "Owner",
        normalizedRole,
        hasTeamManagerPermission,
        hasAdminPermission,
      },
      matchPermissionResult,
      currentUserPermissions,
      rbacFunctions: {
        normalizeRole: "Working",
        roleHasPermission: "Working",
        canManageMatch: matchPermissionResult ? "Working" : "Not tested",
      },
    })
  } catch (error: any) {
    console.error("Error testing RBAC:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
