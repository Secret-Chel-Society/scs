"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Trophy, 
  BarChart3, 
  Calendar, 
  Award, 
  DollarSign, 
  Newspaper, 
  MessageSquare,
  UserPlus,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Crown,
  Star,
  Lock,
  Eye,
  Cog,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function Navigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [playerRole, setPlayerRole] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamManager, setIsTeamManager] = useState(false)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  
  const pathname = usePathname()
  const router = useRouter()
  const { supabase, session, isLoading } = useSupabase()
  const { toast } = useToast()

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id || !supabase) return

      try {
        const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()
        if (user) setUserProfile(user)

        const [playerResponse, rolesResponse] = await Promise.allSettled([
          supabase.from("players").select("id, role, team_id").eq("user_id", session.user.id).single(),
          supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        ])

        if (playerResponse.status === "fulfilled" && playerResponse.value.data) {
          const player = playerResponse.value.data
          setPlayerRole(player.role)
          setPlayerId(player.id)
          setIsTeamManager(["GM", "AGM", "Owner"].includes(player.role))

          if (player.team_id) {
            const { data: team } = await supabase
              .from("teams")
              .select("id, name, logo_url")
              .eq("id", player.team_id)
              .single()
            if (team) setTeamInfo(team)
          }
        }

        if (rolesResponse.status === "fulfilled" && rolesResponse.value.data) {
          const roles = rolesResponse.value.data
          if (roles.length > 0) {
            const roleNames = roles.map((r) => r.role)
            setUserRoles(roleNames)
            setIsAdmin(roleNames.includes("Admin"))
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [session, supabase])

  const handleSignOut = async () => {
    if (!supabase) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const getColorClasses = (itemName: string) => {
    switch (itemName) {
      case "Home": return "from-ice-blue-500 to-rink-blue-600"
      case "Teams": return "from-assist-green-500 to-assist-green-600"
      case "Standings": return "from-goal-red-500 to-goal-red-600"
      case "Stats": return "from-hockey-silver-500 to-hockey-silver-600"
      case "Matches": return "from-rink-blue-500 to-rink-blue-600"
      case "Awards": return "from-amber-500 to-amber-600"
      case "Free Agency": return "from-emerald-500 to-emerald-600"
      case "News": return "from-purple-500 to-purple-600"
      case "Forum": return "from-indigo-500 to-indigo-600"
      default: return "from-ice-blue-500 to-rink-blue-600"
    }
  }

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Standings", href: "/standings", icon: Trophy },
    { name: "Stats", href: "/stats", icon: BarChart3 },
    { name: "Matches", href: "/matches", icon: Calendar },
    { name: "Awards", href: "/awards", icon: Award },
    {
      name: "Free Agency",
      href: "/free-agency",
      icon: DollarSign,
      submenu: [
        { name: "Free Agency", href: "/free-agency" },
        { name: "Bidding Recap", href: "/free-agency/bidding-recap" },
      ],
    },
    {
      name: "News",
      href: "/news",
      icon: Newspaper,
      submenu: [
        { name: "News", href: "/news" },
        { name: "Daily Recap", href: "/news/daily-recap" },
      ],
    },
    { name: "Forum", href: "/forum", icon: MessageSquare },
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner": return "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg"
      case "GM": return "bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 text-white shadow-lg"
      case "AGM": return "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg"
      case "Player": return "bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 text-white shadow-lg"
      case "Admin": return "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
      default: return "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-lg"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Owner": return Crown
      case "GM": return Shield
      case "AGM": return Star
      case "Admin": return Database
      default: return Users
    }
  }

  const getUniqueRoleBadges = () => {
    const allRoles = new Set<string>()
    if (playerRole) allRoles.add(playerRole)
    userRoles.forEach((role) => {
      if (role !== playerRole) allRoles.add(role)
    })
    return Array.from(allRoles)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 bg-gradient-to-b from-ice-blue-50/80 via-white to-rink-blue-50/80 dark:from-hockey-silver-900/90 dark:via-hockey-silver-800 dark:to-rink-blue-900/90 backdrop-blur-md border-r-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 transform transition-all duration-300 ease-in-out shadow-2xl shadow-ice-blue-500/20",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="relative p-6 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
          <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
          <div className="relative z-10 flex items-center justify-center">
            <Link href="/" onClick={() => setIsMobileOpen(false)} className="group">
              <div className="p-2 rounded-xl bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 group-hover:from-ice-blue-500/30 group-hover:to-rink-blue-500/30 transition-all duration-300">
                <Image
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                  alt="MGHL Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain filter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
                  priority
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6 sidebar-scrollbar">
          <ul className="space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon
              // Special handling for home page to prevent it from always being active
              const isActive = item.href === "/" 
                ? pathname === "/" 
                : pathname === item.href || pathname.startsWith(item.href + "/")
              const hasSubmenu = item.submenu && item.submenu.length > 0
              const isExpanded = expandedMenus[item.name]

              return (
                <li key={item.name}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group-hover:scale-105 flex-1",
                        isActive 
                          ? `bg-gradient-to-r ${getColorClasses(item.name)} text-white shadow-lg` 
                          : "text-hockey-silver-700 dark:text-hockey-silver-300 hover:text-hockey-silver-900 dark:hover:text-hockey-silver-100 hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 text-ice-blue-600 dark:text-rink-blue-400 group-hover:from-ice-blue-200/50 group-hover:to-rink-blue-200/50 dark:group-hover:from-ice-blue-800/30 dark:group-hover:to-rink-blue-800/30"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {item.name}
                    </Link>
                    {hasSubmenu && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-200/50 dark:from-hockey-silver-800/20 dark:to-hockey-silver-700/20 hover:from-hockey-silver-200/50 hover:to-hockey-silver-300/50 dark:hover:from-hockey-silver-700/30 dark:hover:to-hockey-silver-600/30 text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-hockey-silver-800 dark:hover:text-hockey-silver-200 transition-all duration-300 hover:scale-105"
                        onClick={() => toggleSubmenu(item.name)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  {hasSubmenu && isExpanded && (
                    <ul className="mt-2 ml-8 space-y-2">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.name}>
                          <Link
                            href={subItem.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "block px-4 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105",
                              pathname === subItem.href
                                ? "bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 text-ice-blue-700 dark:text-ice-blue-300 font-medium"
                                : "text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-hockey-silver-800 dark:hover:text-hockey-silver-200 hover:bg-gradient-to-r hover:from-ice-blue-100/30 hover:to-rink-blue-100/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10"
                            )}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}

            {session && (
              <li>
                <Link
                  href="/register/season"
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group-hover:scale-105",
                    pathname === "/register/season"
                      ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg"
                      : "text-hockey-silver-700 dark:text-hockey-silver-300 hover:text-hockey-silver-900 dark:hover:text-hockey-silver-100 hover:bg-gradient-to-r hover:from-assist-green-100/50 hover:to-assist-green-200/50 dark:hover:from-assist-green-900/20 dark:hover:to-assist-green-800/20"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    pathname === "/register/season"
                      ? "bg-white/20 text-white"
                      : "bg-gradient-to-r from-assist-green-100/50 to-assist-green-200/50 dark:from-assist-green-900/20 dark:to-assist-green-800/20 text-assist-green-600 dark:text-assist-green-400 group-hover:from-assist-green-200/50 group-hover:to-assist-green-300/50 dark:group-hover:from-assist-green-800/30 dark:group-hover:to-assist-green-700/30"
                  )}>
                    <UserPlus className="h-4 w-4" />
                  </div>
                  Season Registration
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 p-6 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10">
          {session ? (
            <div className="space-y-4">
              {/* Team Info */}
              {teamInfo && (
                <Link href={`/teams/${teamInfo.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 transition-all duration-300 group">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    {teamInfo.logo_url ? (
                      <Image
                        src={teamInfo.logo_url}
                        alt={teamInfo.name}
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-ice-blue-700 dark:text-ice-blue-300">{teamInfo.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium truncate text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-hockey-silver-900 dark:group-hover:text-hockey-silver-100 transition-colors duration-300">{teamInfo.name}</span>
                </Link>
              )}

              {/* Role Badges */}
              <div className="flex flex-wrap gap-2">
                {getUniqueRoleBadges().map((role) => {
                  const RoleIcon = getRoleIcon(role)
                  return (
                    <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1`}>
                      <RoleIcon className="h-3 w-3" />
                      {role}
                    </Badge>
                  )
                })}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Avatar className="h-10 w-10 ring-2 ring-ice-blue-200/50 dark:ring-rink-blue-700/50 shadow-lg">
                  <AvatarImage
                    src={userProfile?.avatar_url || "/placeholder.svg?height=32&width=32"}
                    alt={userProfile?.gamer_tag_id || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white font-bold">
                    {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate text-hockey-silver-800 dark:text-hockey-silver-200">
                    {userProfile?.gamer_tag_id || "User"}
                  </p>
                  <p className="text-xs leading-none text-hockey-silver-600 dark:text-hockey-silver-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-200/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-700/10 border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <div className="flex items-center gap-2">
                  <ModeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-200/50 dark:from-hockey-silver-800/20 dark:to-hockey-silver-700/20 hover:from-hockey-silver-200/50 hover:to-hockey-silver-300/50 dark:hover:from-hockey-silver-700/30 dark:hover:to-hockey-silver-600/30 text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-hockey-silver-800 dark:hover:text-hockey-silver-200 transition-all duration-300 hover:scale-105">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
                      <DropdownMenuLabel className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Account</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-ice-blue-200/50 dark:bg-rink-blue-700/50" />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 transition-all duration-300">
                          <Link href={`/players/${playerId || session.user.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        {isTeamManager && (
                          <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-assist-green-100/50 hover:to-assist-green-200/50 dark:hover:from-assist-green-900/20 dark:hover:to-assist-green-800/20 transition-all duration-300">
                            <Link href="/management" className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                              Management
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-amber-100/50 hover:to-amber-200/50 dark:hover:from-amber-900/20 dark:hover:to-amber-800/20 transition-all duration-300">
                            <Link href="/admin" className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-hockey-silver-100/50 hover:to-hockey-silver-200/50 dark:hover:from-hockey-silver-900/20 dark:hover:to-hockey-silver-800/20 transition-all duration-300">
                          <Link href="/settings" className="flex items-center gap-2">
                            <Cog className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-ice-blue-200/50 dark:bg-rink-blue-700/50" />
                      <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gradient-to-r hover:from-goal-red-100/50 hover:to-goal-red-200/50 dark:hover:from-goal-red-900/20 dark:hover:to-goal-red-800/20 transition-all duration-300 text-goal-red-700 dark:text-goal-red-300">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" asChild className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-ice-blue-300 dark:border-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <Link href="/login" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Log in
                </Link>
              </Button>
              <Button asChild className="w-full hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <Link href="/register" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
              </Button>
              <div className="flex justify-center">
                <ModeToggle />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
