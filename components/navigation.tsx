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
  User,
  Crown,
  Star,
  Zap,
  Target,
  Gamepad2,
  Medal,
  Shield,
  TrendingUp,
  Activity,
  Database,
  Coins,
  Gift,
  ChevronLeft
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
import { motion, AnimatePresence } from "framer-motion"

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
  const { supabase, session, isLoading } = useSupabase()
  const { toast } = useToast()

  // Close mobile menu when route changes
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const navigation = [
    { 
      name: "Home", 
      href: "/", 
      icon: Home,
      description: "League overview and latest updates"
    },
    { 
      name: "Teams", 
      href: "/teams", 
      icon: Users,
      description: "View all competing franchises"
    },
    { 
      name: "Standings", 
      href: "/standings", 
      icon: Trophy,
      description: "Current league standings and playoff picture"
    },
    { 
      name: "Stats", 
      href: "/stats", 
      icon: BarChart3,
      description: "Advanced player and team statistics"
    },
    { 
      name: "Matches", 
      href: "/matches", 
      icon: Calendar,
      description: "Schedule and match results"
    },
    { 
      name: "Awards", 
      href: "/awards", 
      icon: Award,
      description: "Season awards and achievements"
    },
    {
      name: "Free Agency",
      href: "/free-agency",
      icon: DollarSign,
      description: "Player bidding and free agency",
      submenu: [
        { name: "Free Agency", href: "/free-agency", icon: DollarSign },
        { name: "Bidding Recap", href: "/free-agency/bidding-recap", icon: TrendingUp },
      ],
    },
    {
      name: "News",
      href: "/news",
      icon: Newspaper,
      description: "League announcements and highlights",
      submenu: [
        { name: "News", href: "/news", icon: Newspaper },
        { name: "Daily Recap", href: "/news/daily-recap", icon: Activity },
      ],
    },
    { 
      name: "Forum", 
      href: "/forum", 
      icon: MessageSquare,
      description: "Community discussions and chat"
    },
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner": return "badge-champion"
      case "GM": return "badge-playoff"
      case "AGM": return "badge-playoff"
      case "Player": return "badge-regular"
      case "Admin": return "badge-champion"
      default: return "badge-regular"
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

  const getIconForSubmenu = (name: string) => {
    switch (name) {
      case "Free Agency": return DollarSign
      case "Bidding Recap": return TrendingUp
      case "News": return Newspaper
      case "Daily Recap": return Activity
      default: return Newspaper
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden h-12 w-12 bg-background/80 backdrop-blur-md border border-hockey-blue/20 shadow-hockey"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
            onClick={() => setIsMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md border-r border-hockey-blue/20">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-hockey-blue/20">
                <Link href="/" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold hockey-gradient-text">SCS</h1>
                      <p className="text-xs text-muted-foreground">Secret Chel Society</p>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-hockey-blue/10"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
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
                              "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 flex-1 group",
                              isActive 
                                ? "bg-gradient-to-r from-hockey-blue to-hockey-purple text-white shadow-hockey-lg" 
                                : "text-foreground hover:bg-hockey-blue/10 hover:scale-105"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg transition-all duration-200",
                              isActive 
                                ? "bg-white/20" 
                                : "bg-hockey-blue/10 group-hover:bg-hockey-blue/20"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold">{item.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          </Link>
                          {hasSubmenu && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 hover:bg-hockey-blue/10"
                              onClick={() => toggleSubmenu(item.name)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>

                        {hasSubmenu && isExpanded && (
                          <motion.div 
                            className="mt-2 ml-8 space-y-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {item.submenu.map((subItem) => {
                              const SubIcon = getIconForSubmenu(subItem.name)
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => setIsMobileOpen(false)}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200",
                                    pathname === subItem.href
                                      ? "bg-hockey-blue/20 text-hockey-blue font-semibold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-hockey-blue/10"
                                  )}
                                >
                                  <SubIcon className="h-4 w-4" />
                                  {subItem.name}
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </div>
                    )
                  })}

                  {session && (
                    <Link
                      href="/register/season"
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 group",
                        pathname === "/register/season"
                          ? "bg-gradient-to-r from-hockey-green to-hockey-blue text-white shadow-hockey-lg"
                          : "text-foreground hover:bg-hockey-green/10 hover:scale-105"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        pathname === "/register/season"
                          ? "bg-white/20"
                          : "bg-hockey-green/10 group-hover:bg-hockey-green/20"
                      )}>
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold">Season Registration</span>
                        <p className="text-xs text-muted-foreground mt-1">Join the upcoming season</p>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Mobile User Section */}
                <div className="mt-8 pt-6 border-t border-hockey-blue/20">
                  {session ? (
                    <div className="space-y-4">
                      {/* Team Info */}
                      {teamInfo && (
                        <Link 
                          href={`/teams/${teamInfo.id}`} 
                          onClick={() => setIsMobileOpen(false)}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-hockey-blue/10 transition-colors border border-hockey-blue/20"
                        >
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-hockey-blue/30 bg-background flex-shrink-0">
                            {teamInfo.logo_url ? (
                              <Image
                                src={teamInfo.logo_url}
                                alt={teamInfo.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-hockey-blue">{teamInfo.name.substring(0, 2)}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{teamInfo.name}</p>
                            <p className="text-sm text-muted-foreground">Your Team</p>
                          </div>
                        </Link>
                      )}

                      {/* Role Badges */}
                      {getUniqueRoleBadges().length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {getUniqueRoleBadges().map((role) => (
                            <Badge key={role} className={getRoleBadgeColor(role)}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* User Info */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-hockey-blue/5 border border-hockey-blue/20">
                        <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-hockey-blue/30">
                          <AvatarImage
                            src={userProfile?.avatar_url || "/placeholder.svg?height=56&width=56"}
                            alt={userProfile?.gamer_tag_id || "User"}
                          />
                          <AvatarFallback className="bg-hockey-blue/10 text-hockey-blue font-bold">
                            {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {userProfile?.gamer_tag_id || "User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session?.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <ModeToggle />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-hockey-blue/10">
                              <Settings className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel className="text-hockey-blue font-semibold">Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <Link href={`/players/${playerId || session.user.id}`}>
                                  <User className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              {isTeamManager && (
                                <DropdownMenuItem asChild>
                                  <Link href="/management">Management</Link>
                                </DropdownMenuItem>
                              )}
                              {isAdmin && (
                                <DropdownMenuItem asChild>
                                  <Link href="/admin">Admin Dashboard</Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href="/settings">Settings</Link>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                              <LogOut className="mr-2 h-4 w-4" />
                              Log out
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button variant="outline" asChild className="w-full h-14 border-hockey-blue/30 hover:bg-hockey-blue/10">
                        <Link href="/login" onClick={() => setIsMobileOpen(false)}>Log in</Link>
                      </Button>
                      <Button asChild className="w-full h-14 btn-championship">
                        <Link href="/register" onClick={() => setIsMobileOpen(false)}>Sign up</Link>
                      </Button>
                      <div className="flex justify-center">
                        <ModeToggle />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block fixed left-0 top-0 z-50 h-screen bg-background/95 backdrop-blur-md border-r border-hockey-blue/20 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-20" : "w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hockey-blue/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
              <Crown className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold hockey-gradient-text">SCS</h1>
                <p className="text-xs text-muted-foreground">Secret Chel Society</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-hockey-blue/10"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
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
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex-1 group",
                        isActive 
                          ? "bg-gradient-to-r from-hockey-blue to-hockey-purple text-white shadow-hockey-lg" 
                          : "text-muted-foreground hover:text-foreground hover:bg-hockey-blue/10"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-hockey-blue/10 group-hover:bg-hockey-blue/20"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold truncate">{item.name}</span>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
                        </div>
                      )}
                    </Link>
                    {hasSubmenu && !sidebarCollapsed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 hover:bg-hockey-blue/10"
                        onClick={() => toggleSubmenu(item.name)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {hasSubmenu && isExpanded && !sidebarCollapsed && (
                    <ul className="mt-2 ml-8 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = getIconForSubmenu(subItem.name)
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                                pathname === subItem.href
                                  ? "bg-hockey-blue/20 text-hockey-blue font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-hockey-blue/10"
                              )}
                            >
                              <SubIcon className="h-4 w-4" />
                              {subItem.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}

            {session && (
              <li>
                <Link
                  href="/register/season"
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    pathname === "/register/season"
                      ? "bg-gradient-to-r from-hockey-green to-hockey-blue text-white shadow-hockey-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-hockey-green/10"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                    pathname === "/register/season"
                      ? "bg-white/20"
                      : "bg-hockey-green/10 group-hover:bg-hockey-green/20"
                  )}>
                    <UserPlus className="h-4 w-4" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold truncate">Season Registration</span>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Join the upcoming season</p>
                    </div>
                  )}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-hockey-blue/20 p-6 space-y-4">
          {session ? (
            <>
              {/* Team Info */}
              {teamInfo && (
                <Link 
                  href={`/teams/${teamInfo.id}`} 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-hockey-blue/10 transition-colors border border-hockey-blue/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-hockey-blue/30 bg-background flex-shrink-0">
                    {teamInfo.logo_url ? (
                      <Image
                        src={teamInfo.logo_url}
                        alt={teamInfo.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-hockey-blue">{teamInfo.name.substring(0, 2)}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{teamInfo.name}</p>
                      <p className="text-xs text-muted-foreground">Your Team</p>
                    </div>
                  )}
                </Link>
              )}

              {/* Role Badges */}
              {getUniqueRoleBadges().length > 0 && !sidebarCollapsed && (
                <div className="flex flex-wrap gap-1">
                  {getUniqueRoleBadges().map((role) => (
                    <Badge key={role} className={getRoleBadgeColor(role)}>
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-hockey-blue/5 border border-hockey-blue/20">
                <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-hockey-blue/30">
                  <AvatarImage
                    src={userProfile?.avatar_url || "/placeholder.svg?height=48&width=48"}
                    alt={userProfile?.gamer_tag_id || "User"}
                  />
                  <AvatarFallback className="bg-hockey-blue/10 text-hockey-blue font-bold">
                    {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {userProfile?.gamer_tag_id || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate mt-1">
                      {session?.user?.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <ModeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-hockey-blue/10">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-hockey-blue font-semibold">Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={`/players/${playerId || session.user.id}`}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      {isTeamManager && (
                        <DropdownMenuItem asChild>
                          <Link href="/management">Management</Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" asChild className="w-full h-11 border-hockey-blue/30 hover:bg-hockey-blue/10">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full h-11 btn-championship">
                <Link href="/register">Sign up</Link>
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
