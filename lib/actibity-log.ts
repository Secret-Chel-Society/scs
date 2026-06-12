import { SupabaseClient } from "@supabase/supabase-js"

export type ActivityCategory = 
  | "Registration" 
  | "Trade" 
  | "Release" 
  | "Role" 
  | "Bidding" 
  | "Account"
  | "Waiver"
  | "Match"
  | "Signup"

export type ActorType = 
  | "Admin" 
  | "Site Owner" 
  | "UPHL Admin"
  | "Owner" 
  | "GM" 
  | "AGM" 
  | "Player" 
  | "System"

export interface LogActivityParams {
  actorId: string
  actorName: string
  actorType: ActorType
  actionType: string
  actionDescription: string
  targetId?: string
  targetName?: string
  category: ActivityCategory
  league?: string
  metadata?: Record<string, any>
}

/**
 * Logs an activity to the admin_actions table for audit tracking
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("admin_actions").insert({
      admin_user_id: params.actorId || null,
      action_type: params.actionType,
      action_description: params.actionDescription,
      target_user_id: params.targetId || null,
      actor_name: params.actorName,
      target_name: params.targetName || null,
      category: params.category,
      league: params.league || null,
      actor_type: params.actorType,
      details: params.metadata || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[ActivityLog] Error logging activity:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("[ActivityLog] Exception logging activity:", err)
    return { success: false, error: String(err) }
  }
}

/**
 * Fetches user's role from both players table and user_roles table
 * Returns the highest role found
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: ActorType; roleName: string }> {
  const roleHierarchy: ActorType[] = [
    "Site Owner",
    "UPHL Admin", 
    "Admin",
    "Owner",
    "GM",
    "AGM",
    "Player",
  ]

  let highestRole: ActorType = "Player"

  try {
    // Check user_roles table first (for Site Owner, Admin, UPHL Admin)
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)

    if (userRoles && userRoles.length > 0) {
      for (const ur of userRoles) {
        const role = ur.role as ActorType
        if (roleHierarchy.indexOf(role) < roleHierarchy.indexOf(highestRole) && roleHierarchy.indexOf(role) !== -1) {
          highestRole = role
        }
      }
    }

    // Check players table for team roles (Owner, GM, AGM)
    const { data: playerData } = await supabase
      .from("players")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (playerData?.role) {
      const role = playerData.role as ActorType
      if (roleHierarchy.indexOf(role) < roleHierarchy.indexOf(highestRole) && roleHierarchy.indexOf(role) !== -1) {
        highestRole = role
      }
    }
  } catch (err) {
    console.error("[ActivityLog] Error fetching user role:", err)
  }

  return { role: highestRole, roleName: highestRole }
}

/**
 * Alias for getUserRole that returns just the actor type string
 */
export async function getUserActorType(
  supabase: SupabaseClient,
  userId: string
): Promise<ActorType> {
  const { role } = await getUserRole(supabase, userId)
  return role
}

/**
 * Fetches user's gamer tag
 */
export async function getUserName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    const { data } = await supabase
      .from("users")
      .select("gamer_tag_id")
      .eq("id", userId)
      .single()

    return data?.gamer_tag_id || "Unknown"
  } catch {
    return "Unknown"
  }
}

/**
 * Helper to get category badge color classes
 */
export function getCategoryColor(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    Registration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Trade: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Release: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Role: "bg-green-500/20 text-green-400 border-green-500/30",
    Bidding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Account: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    Waiver: "bg-red-500/20 text-red-400 border-red-500/30",
    Match: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Signup: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  }
  return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
}

/**
 * Helper to get actor type badge color classes
 */
export function getActorTypeColor(actorType: ActorType): string {
  const colors: Record<ActorType, string> = {
    "Site Owner": "bg-red-500/20 text-red-400 border-red-500/30",
    "UPHL Admin": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Admin": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "GM": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "AGM": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Player": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "System": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  }
  return colors[actorType] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
}
