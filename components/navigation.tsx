// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { trackUserAction, trackEvent } from "@/lib/analytics"
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
  Database,
  LayoutDashboard,
  Target,
  Zap,
  Activity
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

  // Ensure mobile menu is closed on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

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
      name: "ELO",
      href: "/elo/rankings",
      icon: Target,
      submenu: [
        { name: "ELO Rankings", href: "/elo/rankings" },
        { name: "ELO Statistics", href: "/elo/statistics" },
        { name: "ELO Matches", href: "/elo/matches" },
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
      {/* Mobile Menu Button */}
              <button
                onClick={() => {
                  setIsMobileOpen(!isMobileOpen);
                  trackUserAction('navigation_toggle', isMobileOpen ? 'close' : 'open');
                }}
                className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:scale-105 transition-all duration-300 mobile-nav-button flex items-center justify-center"
                aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
              >
        {isMobileOpen ? <X className="h-7 w-7 text-ice-blue-600 dark:text-ice-blue-400" /> : <Menu className="h-7 w-7 text-ice-blue-600 dark:text-ice-blue-400" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl transition-transform duration-300 ease-in-out mobile-sidebar",
          "md:translate-x-0", // Always visible on desktop
          isMobileOpen ? "translate-x-0" : "-translate-x-full" // Hidden on mobile unless menu is open
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
            <Link href="/" className="flex items-center gap-4 group" onClick={() => setIsMobileOpen(false)}>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-ice-blue-500 via-rink-blue-600 to-ice-blue-700 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-assist-green-400 to-assist-green-500 rounded-full shadow-lg animate-pulse flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 dark:from-ice-blue-400 dark:to-rink-blue-500 bg-clip-text text-transparent">
                  Secret Chel Society
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  Elite Hockey League
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === "/" 
                ? pathname === "/" 
                : pathname === item.href || pathname.startsWith(item.href + "/")
              const hasSubmenu = item.submenu && item.submenu.length > 0
              const isExpanded = expandedMenus[item.name]

              return (
                <div key={item.name}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-300 group relative overflow-hidden hover:scale-105 flex-1 min-h-[48px]",
                        isActive
                          ? "bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-lg shadow-ice-blue-500/25"
                          : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 hover:text-ice-blue-700 dark:hover:text-ice-blue-300"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        isActive
                          ? "bg-white/20"
                          : "bg-slate-100 dark:bg-slate-700 group-hover:bg-ice-blue-100 dark:group-hover:bg-ice-blue-900"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5 transition-all duration-300",
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400"
                        )} />
                      </div>
                      <span className="flex-1 truncate font-medium">{item.name}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </Link>
                    {hasSubmenu && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-300 hover:scale-105"
                        onClick={() => toggleSubmenu(item.name)}
                        aria-label={isExpanded ? `Collapse ${item.name} submenu` : `Expand ${item.name} submenu`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {hasSubmenu && isExpanded && (
                    <div className="mt-4 ml-8 space-y-4">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "block px-4 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:scale-105 min-h-[48px] flex items-center",
                            pathname === subItem.href
                              ? "bg-gradient-to-r from-ice-blue-500/30 to-rink-blue-500/30 text-ice-blue-800 dark:text-ice-blue-200 shadow-lg shadow-ice-blue-500/20"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-gradient-to-r hover:from-ice-blue-100/40 hover:to-rink-blue-100/40 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20"
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {session && (
              <Link
                href="/register/season"
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden hover:scale-105",
                  pathname === "/register/season"
                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg shadow-assist-green-500/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-assist-green-100/50 hover:to-assist-green-200/50 dark:hover:from-assist-green-900/20 dark:hover:to-assist-green-800/20 hover:text-assist-green-700 dark:hover:text-assist-green-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  pathname === "/register/season"
                    ? "bg-white/20"
                    : "bg-slate-100 dark:bg-slate-700 group-hover:bg-assist-green-100 dark:group-hover:bg-assist-green-900"
                )}>
                  <UserPlus className={cn(
                    "h-5 w-5 transition-all duration-300",
                    pathname === "/register/season"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 group-hover:text-assist-green-600 dark:group-hover:text-assist-green-400"
                  )} />
                </div>
                <span className="flex-1 truncate font-medium">Season Registration</span>
                {pathname === "/register/season" && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                )}
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-4 bg-gradient-to-r from-slate-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-900/20">
            {session ? (
              <div className="space-y-4">
                {/* Team Info */}
                {teamInfo && (
                  <Link href={`/teams/${teamInfo.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-700 shadow-lg group-hover:shadow-xl transition-all duration-300">
                      {teamInfo.logo_url ? (
                        <Image
                          src={teamInfo.logo_url}
                          alt={teamInfo.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{teamInfo.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-300">{teamInfo.name}</span>
                  </Link>
                )}

                {/* User Profile Card */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  {/* Role Badges */}
                  {userRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {getUniqueRoleBadges().map((role) => {
                        const RoleIcon = getRoleIcon(role)
                        return (
                          <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1`}>
                            <RoleIcon className="h-3 w-3" />
                            {role}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                    <Avatar className="h-12 w-12 ring-2 ring-ice-blue-200/50 dark:ring-rink-blue-700/50 shadow-lg">
                      <AvatarImage
                        src={userProfile?.avatar_url || "/placeholder.svg?height=32&width=32"}
                        alt={userProfile?.gamer_tag_id || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white font-bold">
                        {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none truncate text-slate-800 dark:text-slate-200">
                        {userProfile?.gamer_tag_id || "User"}
                      </p>
                      <p className="text-xs leading-none text-slate-600 dark:text-slate-400 truncate mt-1">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/50 dark:bg-slate-700/50 border border-slate-200/30 dark:border-slate-600/30 mt-4">
                    <div className="flex items-center gap-2">
                      <ModeToggle />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-300 hover:scale-105">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
                          <DropdownMenuLabel className="text-slate-800 dark:text-slate-200 font-semibold">Account</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                              <Link href={`/players/${playerId || session.user.id}`} className="flex items-center gap-3">
                                <Eye className="h-4 w-4 text-blue-500" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                              <Link href="/dashboard" className="flex items-center gap-3">
                                <LayoutDashboard className="h-4 w-4 text-green-500" />
                                Dashboard
                              </Link>
                            </DropdownMenuItem>
                            {isTeamManager && (
                              <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                                <Link href="/management" className="flex items-center gap-3">
                                  <Shield className="h-4 w-4 text-emerald-500" />
                                  Management
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                                <Link href="/admin" className="flex items-center gap-3">
                                  <Crown className="h-4 w-4 text-amber-500" />
                                  Admin Dashboard
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                              <Link href="/settings" className="flex items-center gap-3">
                                <Cog className="h-4 w-4 text-slate-500" />
                                Settings
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                          <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-red-600 dark:text-red-400">
                            <LogOut className="mr-3 h-4 w-4" />
                            Log out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button variant="outline" asChild className="w-full border-ice-blue-300 dark:border-rink-blue-600 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 transition-all duration-200 hover:scale-105">
                  <Link href="/login" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 transition-all duration-200 hover:scale-105">
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
        </div>
      </aside>
    </>
  )
}
