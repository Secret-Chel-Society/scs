import { createAdminClient } from "./supabase/server"

export interface UserToken {
  id: string
  user_id: string
  token_type: "access" | "refresh" | "admin" | "api" | "redemption"
  token_hash: string
  expires_at: string
  is_active: boolean
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  last_used_at?: string
  usage_count: number
  max_usage?: number
  permissions: string[]
  metadata?: Record<string, any>
}

export interface TokenApproval {
  id: string
  token_id: string
  requester_id: string
  approver_id?: string
  status: "pending" | "approved" | "denied"
  request_reason?: string
  approval_notes?: string
  requested_at: string
  approved_at?: string
  expires_at: string
}

export interface UserPermission {
  user_id: string
  role: string
  permissions: string[]
  season_id?: string
  team_id?: string
  granted_by: string
  granted_at: string
  expires_at?: string
}

export async function createUserToken(
  userId: string, 
  tokenType: UserToken["token_type"], 
  requiresApproval: boolean = true, 
  expiresIn: number = 3600,
  permissions: string[] = [],
  metadata?: Record<string, any>
): Promise<{ success: boolean; token?: UserToken; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const tokenHash = generateSecureToken()
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    
    const { data: token, error } = await supabase
      .from("user_tokens")
      .insert({
        user_id: userId,
        token_type: tokenType,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_active: true,
        requires_approval: requiresApproval,
        usage_count: 0,
        permissions: permissions,
        metadata: metadata || {}
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating user token:", error)
      return { success: false, error: error.message }
    }
    
    // If approval is required, create approval request
    if (requiresApproval) {
      await createTokenApprovalRequest(token.id, userId, "Token creation request")
    }
    
    return { success: true, token }
  } catch (error: any) {
    console.error("Error in createUserToken:", error)
    return { success: false, error: error.message }
  }
}

export async function validateAndUseToken(
  token: string, 
  tokenType: UserToken["token_type"]
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("token_hash", token)
      .eq("token_type", tokenType)
      .eq("is_active", true)
      .single()
    
    if (tokenError || !tokenData) {
      return { success: false, error: "Invalid or expired token" }
    }
    
    // Check if token requires approval and hasn't been approved
    if (tokenData.requires_approval && !tokenData.approved_by) {
      return { success: false, error: "Token requires approval before use" }
    }
    
    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: "Token has expired" }
    }
    
    // Check usage limits
    if (tokenData.max_usage && tokenData.usage_count >= tokenData.max_usage) {
      return { success: false, error: "Token usage limit exceeded" }
    }
    
    // Update usage count and last used timestamp
    await supabase
      .from("user_tokens")
      .update({
        usage_count: tokenData.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq("id", tokenData.id)
    
    return { success: true, userId: tokenData.user_id }
  } catch (error: any) {
    console.error("Error in validateAndUseToken:", error)
    return { success: false, error: error.message }
  }
}

export async function approveToken(
  tokenId: string, 
  approverId: string, 
  action: "approve" | "deny", 
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const updateData: any = {
      approved_by: action === "approve" ? approverId : null,
      approved_at: action === "approve" ? new Date().toISOString() : null,
      is_active: action === "approve"
    }
    
    const { error } = await supabase
      .from("user_tokens")
      .update(updateData)
      .eq("id", tokenId)
    
    if (error) {
      console.error("Error approving token:", error)
      return { success: false, error: error.message }
    }
    
    // Update approval request status
    await supabase
      .from("token_approvals")
      .update({
        approver_id: approverId,
        status: action,
        approval_notes: reason,
        approved_at: new Date().toISOString()
      })
      .eq("token_id", tokenId)
      .eq("status", "pending")
    
    return { success: true }
  } catch (error: any) {
    console.error("Error in approveToken:", error)
    return { success: false, error: error.message }
  }
}

export async function getPendingTokenApprovals(): Promise<{ success: boolean; approvals?: any[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { data: approvals, error } = await supabase
      .from("token_approvals")
      .select(`
        *,
        user_tokens(*),
        requester:users!token_approvals_requester_id_fkey(gamer_tag_id, email),
        approver:users!token_approvals_approver_id_fkey(gamer_tag_id, email)
      `)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching pending approvals:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true, approvals }
  } catch (error: any) {
    console.error("Error in getPendingTokenApprovals:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserPermissions(userId: string): Promise<{ success: boolean; permissions?: UserPermission; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { data: permissions, error } = await supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId)
      .eq("expires_at", "gt", new Date().toISOString())
      .order("granted_at", { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user permissions:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true, permissions }
  } catch (error: any) {
    console.error("Error in getUserPermissions:", error)
    return { success: false, error: error.message }
  }
}

export async function hasPermission(userId: string, permission: string): Promise<{ success: boolean; hasPermission: boolean; error?: string }> {
  try {
    const { success, permissions, error } = await getUserPermissions(userId)
    
    if (!success || error) {
      return { success: false, hasPermission: false, error }
    }
    
    if (!permissions) {
      return { success: true, hasPermission: false }
    }
    
    const hasPermission = permissions.permissions.includes(permission) || permissions.role === "Admin"
    
    return { success: true, hasPermission }
  } catch (error: any) {
    console.error("Error in hasPermission:", error)
    return { success: false, hasPermission: false, error: error.message }
  }
}

export async function revokeToken(tokenId: string, revokerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from("user_tokens")
      .update({
        is_active: false,
        approved_by: null,
        approved_at: null
      })
      .eq("id", tokenId)
    
    if (error) {
      console.error("Error revoking token:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Error in revokeToken:", error)
    return { success: false, error: error.message }
  }
}

export async function getTokenStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Get various token statistics
    const [
      { count: totalTokens },
      { count: activeTokens },
      { count: pendingApprovals },
      { count: expiredTokens }
    ] = await Promise.all([
      supabase.from("user_tokens").select("*", { count: "exact", head: true }),
      supabase.from("user_tokens").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("token_approvals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("user_tokens").select("*", { count: "exact", head: true }).lt("expires_at", new Date().toISOString())
    ])
    
    const stats = {
      totalTokens: totalTokens || 0,
      activeTokens: activeTokens || 0,
      pendingApprovals: pendingApprovals || 0,
      expiredTokens: expiredTokens || 0
    }
    
    return { success: true, stats }
  } catch (error: any) {
    console.error("Error in getTokenStats:", error)
    return { success: false, error: error.message }
  }
}

function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function createTokenApprovalRequest(tokenId: string, requesterId: string, reason: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    await supabase
      .from("token_approvals")
      .insert({
        token_id: tokenId,
        requester_id: requesterId,
        status: "pending",
        request_reason: reason,
        requested_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
  } catch (error) {
    console.error("Error creating token approval request:", error)
  }
}

export async function cleanupExpiredTokens(): Promise<{ success: boolean; cleanedCount: number; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Deactivate expired tokens
    const { data: expiredTokens, error } = await supabase
      .from("user_tokens")
      .update({ is_active: false })
      .lt("expires_at", new Date().toISOString())
      .eq("is_active", true)
      .select()
    
    if (error) {
      console.error("Error cleaning up expired tokens:", error)
      return { success: false, cleanedCount: 0, error: error.message }
    }
    
    return { success: true, cleanedCount: expiredTokens?.length || 0 }
  } catch (error: any) {
    console.error("Error in cleanupExpiredTokens:", error)
    return { success: false, cleanedCount: 0, error: error.message }
  }
}
