"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
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
  Crown,
  Shield,
  Target,
  TrendingUp,
  Medal,
  Star,
  ArrowRight,
  Lock,
  Eye,
  Cog,
  Wrench,
  CheckCircle,
  XCircle,
  UserPlus as UserPlusIcon,
  Settings as SettingsIcon,
  Database,
  Activity,
  Zap,
  Gavel,
  Users2,
  FileText,
  BarChart3 as BarChart3Icon,
  Target as TargetIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Clock,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  DollarSign as DollarSignIcon,
  Newspaper as NewspaperIcon,
  MessageSquare as MessageSquareIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { TeamChatButton } from "@/components/team-chat/team-chat-button"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { avatarSync } from "@/lib/avatar-sync"
import { cn } from "@/lib/utils"

interface SidebarNavigationProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function SidebarNavigation({ isOpen: externalIsOpen, onToggle: externalOnToggle }: SidebarNavigationProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const onToggle = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen))
  const [userProfile, setUserProfile] = useState<any>(null)
  const [playerRole, setPlayerRole] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamManager, setIsTeamManager] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { supabase, session, isLoading } = useSupabase()
  const { toast } = useToast()

  const fetchUserData = async () => {
    if (!session?.user?.id || !supabase) {
      setLoadingProfile(false)
      setUserProfile(null)
      return
    }

    try {
      setLoadingProfile(true)
      setFetchError(null)

      const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (user) {
        setUserProfile(user)
        setCurrentAvatarUrl(user.avatar_url)
      }

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

          if (team) {
            setTeamInfo(team)
          }
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
      console.error("Error in profile fetch:", error)
      setFetchError("Failed to load profile data. Please try again.")
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!session?.user?.id || !supabase) {
        if (isMounted) {
          setLoadingProfile(false)
          setUserProfile(null)
        }
        return
      }

      try {
        if (isMounted) {
          setLoadingProfile(true)
          setFetchError(null)
        }

        await fetchUserData()
      } catch (error) {
        console.error("Error in profile fetch:", error)
        if (isMounted) {
          setFetchError("Failed to load profile data. Please try again.")
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [session, supabase])

  useEffect(() => {
    if (!session?.user?.id) return

    const unsubscribe = avatarSync.subscribe((newAvatarUrl) => {
      setCurrentAvatarUrl(newAvatarUrl)
      setUserProfile((prev: any) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev))
    })

    return unsubscribe
  }, [session?.user?.id])

  const handleSignOut = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Unable to sign out. Please try again later.",
        variant: "destructive",
      })
      return
    }

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (currentSession) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      } else {
        console.log("No active session found, but proceeding with UI sign out")
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      }

      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)

      if (error instanceof Error && error.message.includes("Auth session missing")) {
        console.log("Auth session missing, forcing sign out anyway")
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })

        window.location.href = "/"
        return
      }

      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getInitials = () => {
    if (userProfile?.gamer_tag_id) {
      return userProfile.gamer_tag_id.substring(0, 2).toUpperCase()
    }
    return session?.user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "Owner":
        return "bg-purple-500 hover:bg-purple-600"
      case "GM":
        return "bg-red-500 hover:bg-red-600"
      case "AGM":
        return "bg-blue-500 hover:bg-blue-600"
      case "Player":
        return "bg-green-500 hover:bg-green-600"
      case "Admin":
        return "bg-amber-500 hover:bg-amber-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getUniqueRoleBadges = () => {
    const allRoles = new Set<string>()

    if (playerRole) {
      allRoles.add(playerRole)
    }

    userRoles.forEach((role) => {
      if (role !== playerRole) {
        allRoles.add(role)
      }
    })

    return Array.from(allRoles)
  }

  const getProfileUrl = () => {
    if (playerId) {
      return `/players/${playerId}`
    }

    if (session?.user?.id) {
      return `/players/${session.user.id}`
    }

    return "/profile"
  }

  const navigateToProfile = () => {
    const profileUrl = getProfileUrl()
    console.log("Navigating to profile:", profileUrl)
    router.push(profileUrl)
    onToggle()
  }

  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'ice-blue': 'from-ice-blue-500 to-rink-blue-600',
      'rink-blue': 'from-rink-blue-500 to-ice-blue-600',
      'assist-green': 'from-assist-green-500 to-assist-green-600',
      'goal-red': 'from-goal-red-500 to-goal-red-600',
      'hockey-silver': 'from-hockey-silver-500 to-hockey-silver-600'
    }
    return colorMap[color] || 'from-ice-blue-500 to-rink-blue-600'
  }

  const navigation = [
    { 
      name: "Home", 
      href: "/", 
      icon: Home,
      color: "ice-blue",
      description: "Return to the main page"
    },
    { 
      name: "Teams", 
      href: "/teams", 
      icon: Users,
      color: "assist-green",
      description: "Browse all teams and rosters"
    },
    { 
      name: "Standings", 
      href: "/standings", 
      icon: Trophy,
      color: "goal-red",
      description: "View league standings and rankings"
    },
    { 
      name: "Stats", 
      href: "/stats", 
      icon: BarChart3,
      color: "rink-blue",
      description: "Player and team statistics"
    },
    { 
      name: "Matches", 
      href: "/matches", 
      icon: Calendar,
      color: "hockey-silver",
      description: "Game schedules and results"
    },
    { 
      name: "Awards", 
      href: "/awards", 
      icon: Award,
      color: "goal-red",
      description: "Season awards and achievements"
    },
    {
      name: "Free Agency",
      href: "/free-agency",
      icon: DollarSign,
      color: "assist-green",
      description: "Available players and bidding",
      submenu: [
        { name: "Free Agency", href: "/free-agency", icon: Target },
        { name: "Bidding Recap", href: "/free-agency/bidding-recap", icon: BarChart3 },
      ],
    },
    {
      name: "ELO",
      href: "/elo/rankings",
      icon: Target,
      color: "rink-blue",
      description: "ELO rankings and competitive matches",
      submenu: [
        { name: "ELO Rankings", href: "/elo/rankings", icon: Trophy },
        { name: "ELO Statistics", href: "/elo/statistics", icon: BarChart3 },
        { name: "ELO Matches", href: "/elo/matches", icon: Calendar },
      ],
    },
    {
      name: "News",
      href: "/news",
      icon: Newspaper,
      color: "rink-blue",
      description: "Latest league updates and stories",
      submenu: [
        { name: "News", href: "/news", icon: FileText },
        { name: "Daily Recap", href: "/news/daily-recap", icon: TrendingUp },
      ],
    },
    { 
      name: "Forum", 
      href: "/forum", 
      icon: MessageSquare,
      color: "hockey-silver",
      description: "Community discussions and chat"
    },
  ]

  const showFullUI = !isLoading
  const showErrorFallback = !isLoading && session && loadingProfile && fetchError
  const uniqueRoles = getUniqueRoleBadges()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden mobile-overlay" 
          onClick={onToggle}
        />
      )}

      {/* Enhanced Hockey-Themed Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-gradient-to-b from-ice-blue-50/80 via-white to-rink-blue-50/80 dark:from-hockey-silver-900/90 dark:via-hockey-silver-800 dark:to-rink-blue-900/90 backdrop-blur-md border-r-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 transform transition-all duration-300 ease-in-out shadow-2xl shadow-ice-blue-500/20 mobile-sidebar",
        "md:translate-x-0 md:static md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full relative">
          {/* Hockey Pattern Overlay */}
          <div className="absolute inset-0 bg-hockey-pattern opacity-5 pointer-events-none"></div>
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30">
            <Link href="/" className="flex items-center group" onClick={onToggle}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="relative bg-white dark:bg-hockey-silver-800 p-2 rounded-lg shadow-lg">
                  <Image
                    src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png"
                    alt="SCS Logo"
                    width={120}
                    height={40}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </div>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggle} 
              className="md:hidden hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="relative z-10 flex-1 overflow-y-auto p-6 sidebar-scrollbar">
            <div className="space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const hasSubmenu = item.submenu && item.submenu.length > 0
                const isExpanded = expandedMenus[item.name]

                return (
                  <div key={item.name} className="group">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={onToggle}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1 group-hover:scale-105",
                            isActive 
                              ? `bg-gradient-to-r ${getColorClasses(item.color)} text-white shadow-lg shadow-${item.color}-500/25` 
                              : "text-hockey-silver-700 dark:text-hockey-silver-300 hover:text-hockey-silver-900 dark:hover:text-hockey-silver-100 hover:bg-gradient-to-r hover:from-ice-blue-50 hover:to-rink-blue-50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                            isActive 
                              ? "bg-white/20 backdrop-blur-sm" 
                              : `bg-gradient-to-r ${getColorClasses(item.color)} bg-opacity-10 group-hover:bg-opacity-20`
                          )}>
                            <Icon className={cn(
                              "h-4 w-4 transition-all duration-300",
                              isActive 
                                ? "text-white" 
                                : `text-${item.color}-600 dark:text-${item.color}-400 group-hover:text-${item.color}-700 dark:group-hover:text-${item.color}-300`
                            )} />
                          </div>
                          <span className="font-semibold">{item.name}</span>
                        </Link>
                        {hasSubmenu && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 transition-all duration-300 hover:scale-110",
                              isActive 
                                ? "text-white hover:bg-white/20" 
                                : `text-${item.color}-600 dark:text-${item.color}-400 hover:bg-${item.color}-100 dark:hover:bg-${item.color}-900/20`
                            )}
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
                        <div className="mt-2 ml-8 space-y-2">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon || item.icon
                            const isSubActive = pathname === subItem.href
                            
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={onToggle}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105",
                                  isSubActive
                                    ? `bg-gradient-to-r ${getColorClasses(item.color)} text-white shadow-md`
                                    : "text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-hockey-silver-800 dark:hover:text-hockey-silver-200 hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10"
                                )}
                              >
                                <SubIcon className={cn(
                                  "h-3 w-3",
                                  isSubActive 
                                    ? "text-white" 
                                    : `text-${item.color}-500 dark:text-${item.color}-400`
                                )} />
                                {subItem.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {session && (
                <div className="group">
                  <Link
                    href="/register/season"
                    onClick={onToggle}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group-hover:scale-105",
                      pathname === "/register/season"
                        ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg shadow-assist-green-500/25"
                        : "text-hockey-silver-700 dark:text-hockey-silver-300 hover:text-hockey-silver-900 dark:hover:text-hockey-silver-100 hover:bg-gradient-to-r hover:from-assist-green-50 hover:to-assist-green-50 dark:hover:from-assist-green-900/20 dark:hover:to-assist-green-900/20"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      pathname === "/register/season"
                        ? "bg-white/20 backdrop-blur-sm" 
                        : "bg-gradient-to-r from-assist-green-500 to-assist-green-600 bg-opacity-10 group-hover:bg-opacity-20"
                    )}>
                      <UserPlus className={cn(
                        "h-4 w-4 transition-all duration-300",
                        pathname === "/register/season"
                          ? "text-white" 
                          : "text-assist-green-600 dark:text-assist-green-400 group-hover:text-assist-green-700 dark:group-hover:text-assist-green-300"
                      )} />
                    </div>
                    <span className="font-semibold">Season Registration</span>
                  </Link>
                </div>
              )}
            </ul>
          </nav>

          {/* Enhanced User Section */}
          {showFullUI && (
            <div className="relative z-10 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 p-6 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
              {session ? (
                <div className="space-y-4">
                  {/* Team Info */}
                  {teamInfo && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link 
                            href={`/teams/${teamInfo.id}`} 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-ice-blue-100/50 hover:to-rink-blue-100/50 dark:hover:from-ice-blue-800/30 dark:hover:to-rink-blue-800/30 transition-all duration-300 group"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-hockey-silver-800 bg-white dark:bg-hockey-silver-800 shadow-lg">
                                {teamInfo.logo_url ? (
                                  <Image
                                    src={teamInfo.logo_url || "/placeholder.svg"}
                                    alt={teamInfo.name}
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{teamInfo.name.substring(0, 2)}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 truncate group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-colors duration-300">{teamInfo.name}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{teamInfo.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Enhanced Role Badges */}
                  <div className="flex flex-wrap gap-2">
                    {uniqueRoles.map((role) => (
                      <Badge 
                        key={role} 
                        className={`transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg ${
                          role === "Owner" ? "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-goal-red-500/25" :
                          role === "GM" ? "bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 text-white shadow-ice-blue-500/25" :
                          role === "AGM" ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-assist-green-500/25" :
                          role === "Player" ? "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-hockey-silver-500/25" :
                          role === "Admin" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/25" :
                          "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white shadow-hockey-silver-500/25"
                        }`}
                      >
                        {role === "Owner" && <Crown className="h-3 w-3 mr-1" />}
                        {role === "GM" && <Shield className="h-3 w-3 mr-1" />}
                        {role === "AGM" && <Star className="h-3 w-3 mr-1" />}
                        {role === "Admin" && <Lock className="h-3 w-3 mr-1" />}
                        {role}
                      </Badge>
                    ))}
                  </div>

                  {/* Enhanced User Info */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-white/50 to-ice-blue-50/30 dark:from-hockey-silver-800/50 dark:to-rink-blue-900/20 border border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full blur-sm opacity-60"></div>
                      <Avatar className="relative h-10 w-10 border-2 border-white dark:border-hockey-silver-800 shadow-lg">
                        <AvatarImage
                          src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                          alt={userProfile?.gamer_tag_id || "User"}
                          key={currentAvatarUrl}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button onClick={navigateToProfile} className="text-left group hover:cursor-pointer w-full">
                        <p className="text-sm font-semibold leading-none text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-colors duration-300 truncate">
                          {userProfile?.gamer_tag_id || "User"}
                        </p>
                      </button>
                      <p className="text-xs leading-none text-hockey-silver-600 dark:text-hockey-silver-400 truncate">{session?.user?.email}</p>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/30 to-ice-blue-50/20 dark:from-hockey-silver-800/30 dark:to-rink-blue-900/10 border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                    <div className="flex items-center gap-2">
                      <TeamChatButton />
                      <NotificationsDropdown userId={session.user.id} />
                      <ModeToggle />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-9 w-9 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" forceMount className="bg-gradient-to-br from-white to-ice-blue-50/90 dark:from-hockey-silver-900 dark:to-rink-blue-900/90 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
                        <DropdownMenuLabel className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-ice-blue-200/50 dark:bg-rink-blue-700/50" />
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-ice-blue-100 hover:to-rink-blue-100 dark:hover:from-ice-blue-800/30 dark:hover:to-rink-blue-800/30 transition-all duration-200">
                            <button onClick={navigateToProfile} className="flex items-center w-full text-left">
                              <Eye className="mr-2 h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                              View My Profile
                            </button>
                          </DropdownMenuItem>
                          {hasManagementRole() && (
                            <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-assist-green-100 hover:to-assist-green-100 dark:hover:from-assist-green-800/30 dark:hover:to-assist-green-800/30 transition-all duration-200">
                              <Link href="/management" className="flex items-center w-full">
                                <Shield className="mr-2 h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                                Management Panel
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-goal-red-100 hover:to-goal-red-100 dark:hover:from-goal-red-800/30 dark:hover:to-goal-red-800/30 transition-all duration-200">
                                <Link href="/admin" className="flex items-center w-full">
                                  <Crown className="mr-2 h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                                  Admin Dashboard
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-rink-blue-100 hover:to-rink-blue-100 dark:hover:from-rink-blue-800/30 dark:hover:to-rink-blue-800/30 transition-all duration-200">
                                <Link href="/admin/settings" className="flex items-center w-full">
                                  <Cog className="mr-2 h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                                  League Settings
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-hockey-silver-100 hover:to-hockey-silver-100 dark:hover:from-hockey-silver-800/30 dark:hover:to-hockey-silver-800/30 transition-all duration-200">
                                <Link href="/admin/player-mappings" className="flex items-center w-full">
                                  <Database className="mr-2 h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                                  Player Mappings
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-ice-blue-100 hover:to-ice-blue-100 dark:hover:from-ice-blue-800/30 dark:hover:to-ice-blue-800/30 transition-all duration-200">
                            <Link href="/settings" className="flex items-center w-full">
                              <Settings className="mr-2 h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                              Account Settings
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-ice-blue-200/50 dark:bg-rink-blue-700/50" />
                        <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gradient-to-r hover:from-goal-red-100 hover:to-goal-red-100 dark:hover:from-goal-red-800/30 dark:hover:to-goal-red-800/30 transition-all duration-200">
                          <LogOut className="mr-2 h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full hockey-button border-2 border-ice-blue-300 hover:border-ice-blue-500 hover:bg-gradient-to-r hover:from-ice-blue-500 hover:to-rink-blue-600 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link href="/login" onClick={onToggle} className="flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      Log in
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    className="w-full hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link href="/register" onClick={onToggle} className="flex items-center justify-center gap-2">
                      <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      Sign up
                    </Link>
                  </Button>
                  <div className="flex justify-center p-2">
                    <ModeToggle />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default SidebarNavigation
