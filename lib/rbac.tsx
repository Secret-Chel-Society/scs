// Role-Based Access Control (RBAC) system
import { createServerSupabaseClient } from "./supabase/server"
import { createClient } from "@/lib/supabase/server"

// Define role hierarchy - each role inherits permissions from roles in its array
export const ROLE_HIERARCHY = {
  Admin: [], // Admin is top-level, doesn't inherit
  SuperAdmin: ["Admin"], // SuperAdmin inherits Admin
  Owner: ["TeamManager"], // Owner inherits TeamManager
  GM: ["TeamManager"], // GM inherits TeamManager
  AGM: ["TeamManager"], // AGM inherits TeamManager
  TeamManager: [], // Base role for team management
  Coach: ["TeamManager"], // Coach inherits TeamManager
  "Assistant Coach": ["TeamManager"], // Assistant Coach inherits TeamManager
  "General Manager": ["TeamManager", "GM"], // Alternate name that inherits both
  "Assistant General Manager": ["TeamManager", "AGM"], // Alternate name that inherits both
  Player: [], // Player has NO management permissions
  User: [], // Regular user, no special permissions
}

// Define the normalized version of each role (for case-insensitive comparison)
export const NORMALIZED_ROLES = Object.fromEntries(
  Object.entries({
    // Standard roles
    admin: "Admin",
    superadmin: "SuperAdmin",
    owner: "Owner",
    gm: "GM",
    agm: "AGM",
    coach: "Coach",
    "assistant coach": "Assistant Coach",
    teammanager: "TeamManager",
    player: "Player",
    user: "User",
    // Variations
    "general manager": "General Manager",
    "assistant general manager": "Assistant General Manager",
    manager: "TeamManager",
    // Additional variations that might exist in the database
    "team owner": "Owner",
    "team manager": "TeamManager",
  }).map(([key, value]) => [key.toLowerCase().trim(), value]),
)

// Function to normalize a role string
export function normalizeRole(role: string): string {
  if (!role) return "User"
  const normalized = NORMALIZED_ROLES[role.toLowerCase().trim()]
  return normalized || role // Return the normalized version or the original if not found
}

// Check if a role has a specific permission via inheritance
export function roleHasPermission(role: string, requiredRole: string): boolean {
  if (!role || !requiredRole) return false

  // Normalize both roles
  const normalizedRole = normalizeRole(role)
  const normalizedRequiredRole = normalizeRole(requiredRole)

  console.log(
    `Checking if role "${role}" (normalized: "${normalizedRole}") has permission "${requiredRole}" (normalized: "${normalizedRequiredRole}")`,
  )

  // EXPLICITLY DENY Player roles from having TeamManager permissions
  if (normalizedRole === "Player" && normalizedRequiredRole === "TeamManager") {
    console.log("Player role explicitly denied TeamManager permissions")
    return false
  }

  // Direct match
  if (normalizedRole === normalizedRequiredRole) {
    console.log("Direct role match found")
    return true
  }

  // Check inheritance
  const inherited = ROLE_HIERARCHY[normalizedRole] || []
  if (inherited.includes(normalizedRequiredRole)) {
    console.log(`Role inherits permission via: ${inherited.join(", ")}`)
    return true
  }

  // Recursive check through inheritance chain
  const hasInheritedPermission = inherited.some((inheritedRole) =>
    roleHasPermission(inheritedRole, normalizedRequiredRole),
  )
  if (hasInheritedPermission) {
    console.log("Role has permission via inheritance chain")
  }

  return hasInheritedPermission
}

// Check if a role can manage matches (explicit function for clarity)
export function canManageMatches(role: string): boolean {
  const normalizedRole = normalizeRole(role)
  const originalRole = role.toLowerCase().trim()

  console.log(`Checking if role "${role}" (normalized: "${normalizedRole}") can manage matches`)

  // Explicitly deny these roles
  const deniedRoles = ["Player", "User"]
  if (deniedRoles.includes(normalizedRole)) {
    console.log(`Role "${normalizedRole}" is explicitly denied from managing matches`)
    return false
  }

  // Allow these roles - including Owner, GM, AGM
  const allowedRoles = [
    "Admin",
    "SuperAdmin",
    "Owner",
    "GM",
    "AGM",
    "TeamManager",
    "Coach",
    "Assistant Coach",
    "General Manager",
    "Assistant General Manager",
  ]

  // Also check for common variations in the database
  const allowedVariations = [
    "owner",
    "gm",
    "agm",
    "general manager",
    "assistant general manager",
    "team manager",
    "coach",
    "assistant coach",
    "admin",
    "superadmin",
    "manager",
  ]

  const directMatch = allowedRoles.includes(normalizedRole)
  const variationMatch = allowedVariations.includes(originalRole)
  const inheritanceMatch = roleHasPermission(role, "TeamManager")

  console.log(`Role check results:`)
  console.log(`- Direct match: ${directMatch}`)
  console.log(`- Variation match: ${variationMatch}`)
  console.log(`- Inheritance match: ${inheritanceMatch}`)

  const isAllowed = directMatch || variationMatch || inheritanceMatch

  console.log(`Role "${normalizedRole}" can manage matches: ${isAllowed}`)

  return isAllowed
}

// Check if a role can access profile settings (including avatar upload)
export function canAccessProfileSettings(role: string): boolean {
  // ALL authenticated users can access their profile settings
  // This includes avatar upload, profile information, and notification preferences
  return true // No role restrictions for profile settings
}

// Check if a role can upload/update avatar
export function canUploadAvatar(role: string): boolean {
  const normalizedRole = normalizeRole(role)

  console.log(`Checking if role "${role}" (normalized: "${normalizedRole}") can upload avatar`)

  // ALL authenticated users can upload avatars - no role restrictions
  // This explicitly includes: Admin, SuperAdmin, Owner, GM, AGM, TeamManager, Coach, Assistant Coach, Player, User
  const result = true
  console.log(`Role "${normalizedRole}" can upload avatar: ${result}`)

  return result
}

// Check if a role can update their own profile
export function canUpdateOwnProfile(role: string): boolean {
  const normalizedRole = normalizeRole(role)

  console.log(`Checking if role "${role}" (normalized: "${normalizedRole}") can update own profile`)

  // ALL authenticated users can update their own profile
  // This includes: gamer tag, discord name, positions, console, avatar, notification preferences
  const result = true
  console.log(`Role "${normalizedRole}" can update own profile: ${result}`)

  return result
}

// Helper function to check if a table exists
async function checkTableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)
    return !error || !error.message.includes("does not exist")
  } catch (error) {
    console.log(`Table ${tableName} does not exist or is not accessible`)
    return false
  }
}

export async function checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", requiredRole)

    if (error) {
      console.error("Error checking user role:", error)
      return false
    }

    return userRoles && userRoles.length > 0
  } catch (error) {
    console.error("Error in checkUserRole:", error)
    return false
  }
}

export async function checkTeamManagerPermission(userId: string, teamId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if user is admin
    const isAdmin = await checkUserRole(userId, "Admin")
    if (isAdmin) return true

    // Check if user is a team manager for this specific team
    const { data: managerData, error } = await supabase
      .from("team_managers")
      .select("id")
      .eq("user_id", userId)
      .eq("team_id", teamId)

    if (error) {
      console.error("Error checking team manager permission:", error)
      return false
    }

    return managerData && managerData.length > 0
  } catch (error) {
    console.error("Error in checkTeamManagerPermission:", error)
    return false
  }
}

// Function to check if a user can manage a specific match
export async function canManageMatch(
  supabase: any,
  userId: string,
  matchId: string,
): Promise<{
  canManage: boolean
  isAdmin: boolean
  isTeamManager: boolean
  debug?: any
}> {
  try {
    console.log(`=== RBAC: Allowing match management for user ${userId} on match ${matchId} ===`)

    // Get the match details to check status
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, status")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error fetching match:", matchError)
      throw matchError
    }

    console.log("Match details:", match)

    // Only allow management for "In Progress" matches
    const matchInProgress =
      match.status?.toLowerCase() === "in progress" || match.status?.toLowerCase() === "inprogress"

    if (!matchInProgress) {
      console.log("Match is not in progress - denying management access")
      return { canManage: false, isAdmin: false, isTeamManager: false }
    }

    // Allow all authenticated users to manage in-progress matches
    console.log("Match is in progress - granting management access to authenticated user")
    return { canManage: true, isAdmin: false, isTeamManager: false }
  } catch (error) {
    console.error("Error checking match management permission:", error)
    return {
      canManage: false,
      isAdmin: false,
      isTeamManager: false,
      debug: { error: error.message },
    }
  }
}

// Server action to check permissions
export async function checkMatchPermissions(matchId: string) {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return { canManage: false, isAdmin: false, isTeamManager: false, authenticated: false }
  }

  const result = await canManageMatch(supabase, session.user.id, matchId)
  return { ...result, authenticated: true }
}

// Function to check if user can access settings page
export async function canAccessSettings(userId: string): Promise<boolean> {
  // ALL authenticated users can access their settings page
  // No role restrictions - everyone can update their profile, avatar, and preferences
  return true
}

// Function to get user's effective permissions
export function getUserPermissions(role: string) {
  const normalizedRole = normalizeRole(role)

  return {
    role: normalizedRole,
    canAccessProfileSettings: canAccessProfileSettings(role),
    canUploadAvatar: canUploadAvatar(role),
    canUpdateOwnProfile: canUpdateOwnProfile(role),
    canManageMatches: canManageMatches(role),
    isAdmin: roleHasPermission(role, "Admin"),
    isTeamManager: roleHasPermission(role, "TeamManager"),
  }
}
