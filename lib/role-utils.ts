// Midnight Studios INTl - All rights reserved

export interface Role {
  id: string
  name: string
  display_name: string
  description: string
  level: number
  is_system_role: boolean
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  roles: Role
}

// Role constants based on your database
export const ROLES = {
  USER: { id: 'f1b2a262-1c23-4c46-a408-5e84ee16b432', name: 'user', level: 10 },
  PLAYER: { id: 'c6fb6556-f7ff-49fe-b630-9802f1ab5373', name: 'player', level: 20 },
  CAPTAIN: { id: 'b5ee34ed-8a96-41f1-892e-1c701078608c', name: 'captain', level: 30 },
  ASSISTANT_COACH: { id: '8f2b7e58-78c4-4107-ad4e-c0a3388b6663', name: 'assistant_coach', level: 40 },
  MEDIA: { id: '8c351bd3-f101-440d-84d5-1987b58474af', name: 'media', level: 45 },
  COACH: { id: '338eee75-c0df-483a-a4e1-3430e071fb8e', name: 'coach', level: 50 },
  ASSISTANT_GM: { id: '60cc8e4e-f548-4432-8b67-c1670f46d36c', name: 'assistant_gm', level: 60 },
  GENERAL_MANAGER: { id: 'd52029b6-3c2c-4365-acd3-639b16b6e7c', name: 'general_manager', level: 70 },
  TEAM_OWNER: { id: '396d1d03-b271-4033-b49b-ea1252589301', name: 'team_owner', level: 80 },
  ADMIN: { id: '70d21ef8-8d5e-441f-b54a-90802f521da5', name: 'admin', level: 90 },
  SUPER_ADMIN: { id: 'b1ec5e53-236d-47f0-84b6-5d5bc75fe2d0', name: 'super_admin', level: 100 }
} as const

export const ROLE_LEVELS = {
  USER: 10,
  PLAYER: 20,
  CAPTAIN: 30,
  ASSISTANT_COACH: 40,
  MEDIA: 45,
  COACH: 50,
  ASSISTANT_GM: 60,
  GENERAL_MANAGER: 70,
  TEAM_OWNER: 80,
  ADMIN: 90,
  SUPER_ADMIN: 100
} as const

// Management roles (level 30+)
export const MANAGEMENT_ROLES = [
  ROLES.CAPTAIN,
  ROLES.ASSISTANT_COACH,
  ROLES.MEDIA,
  ROLES.COACH,
  ROLES.ASSISTANT_GM,
  ROLES.GENERAL_MANAGER,
  ROLES.TEAM_OWNER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN
]

// Admin roles (level 90+)
export const ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN
]

// Team management roles (level 30-80)
export const TEAM_MANAGEMENT_ROLES = [
  ROLES.CAPTAIN,
  ROLES.ASSISTANT_COACH,
  ROLES.MEDIA,
  ROLES.COACH,
  ROLES.ASSISTANT_GM,
  ROLES.GENERAL_MANAGER,
  ROLES.TEAM_OWNER
]

export function hasRoleLevel(userRoles: UserRole[], requiredLevel: number): boolean {
  return userRoles.some(userRole => 
    userRole.roles && userRole.roles.level >= requiredLevel
  )
}

export function hasManagementRole(userRoles: UserRole[]): boolean {
  return hasRoleLevel(userRoles, ROLE_LEVELS.CAPTAIN)
}

export function hasAdminRole(userRoles: UserRole[]): boolean {
  return hasRoleLevel(userRoles, ROLE_LEVELS.ADMIN)
}

export function hasTeamOwnerRole(userRoles: UserRole[]): boolean {
  return hasRoleLevel(userRoles, ROLE_LEVELS.TEAM_OWNER)
}

export function hasGeneralManagerRole(userRoles: UserRole[]): boolean {
  return hasRoleLevel(userRoles, ROLE_LEVELS.GENERAL_MANAGER)
}

export function canManageWaivers(userRoles: UserRole[]): boolean {
  // Captain, Coach, Assistant GM, GM, and Team Owner can manage waivers
  return hasRoleLevel(userRoles, ROLE_LEVELS.CAPTAIN)
}

export function canManagePriority(userRoles: UserRole[]): boolean {
  // Only GM, Team Owner, and Admins can manage priority
  return hasRoleLevel(userRoles, ROLE_LEVELS.GENERAL_MANAGER)
}

export function canProcessWaivers(userRoles: UserRole[]): boolean {
  // Only Admins can process waivers
  return hasRoleLevel(userRoles, ROLE_LEVELS.ADMIN)
}

export function getHighestRoleLevel(userRoles: UserRole[]): number {
  if (!userRoles || userRoles.length === 0) return 0
  
  return Math.max(...userRoles.map(userRole => 
    userRole.roles ? userRole.roles.level : 0
  ))
}

export function getRoleDisplayName(userRoles: UserRole[]): string {
  if (!userRoles || userRoles.length === 0) return 'User'
  
  const highestRole = userRoles.reduce((highest, current) => {
    if (!current.roles) return highest
    if (!highest || current.roles.level > highest.level) {
      return current.roles
    }
    return highest
  }, null as Role | null)
  
  return highestRole?.display_name || 'User'
}

export function getRolePermissions(userRoles: UserRole[]) {
  const highestLevel = getHighestRoleLevel(userRoles)
  
  return {
    canManageTeam: highestLevel >= ROLE_LEVELS.CAPTAIN,
    canManageWaivers: highestLevel >= ROLE_LEVELS.CAPTAIN,
    canManagePriority: highestLevel >= ROLE_LEVELS.GENERAL_MANAGER,
    canProcessWaivers: highestLevel >= ROLE_LEVELS.ADMIN,
    canManageUsers: highestLevel >= ROLE_LEVELS.ADMIN,
    canAccessAdmin: highestLevel >= ROLE_LEVELS.ADMIN,
    canManageSystem: highestLevel >= ROLE_LEVELS.SUPER_ADMIN
  }
}
