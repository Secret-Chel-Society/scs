"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown,
  Home,
  Trophy,
  BarChart3,
  Calendar,
  Award,
  Users,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Star
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
import { useMobile } from "@/hooks/use-mobile"
import { useSupabase } from "@/lib/supabase/client"
import { avatarSync } from "@/lib/avatar-sync"
// import { motion } from "framer-motion" // Commented out to fix build issues
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
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
  
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        fetchUserData()
      }
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "avatar_updated" && session?.user?.id) {
        fetchUserData()
      }
    }
    const handleAvatarUpdate = (e: CustomEvent) => {
      if (e.detail?.userId === session?.user?.id && e.detail?.avatarUrl) {
        setCurrentAvatarUrl(e.detail.avatarUrl)
        setUserProfile((prev: any) => (prev ? { ...prev, avatar_url: e.detail.avatarUrl } : prev))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("avatarUpdated", handleAvatarUpdate as EventListener)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("avatarUpdated", handleAvatarUpdate as EventListener)
    }
  }, [session])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Auto-collapse on mobile and emit sidebar state changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }, [isMobile])

  // Emit sidebar state changes for layout adjustment
  useEffect(() => {
    const event = new CustomEvent('sidebarToggle', {
      detail: { isOpen: isMobile ? isMobileOpen : isOpen }
    })
    window.dispatchEvent(event)
  }, [isOpen, isMobileOpen, isMobile])

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
  }

  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    )
  }

  // Navigation items with icons
  const navigationItems = [
    { 
      name: "Home", 
      href: "/", 
      icon: Home 
    },
    { 
      name: "Teams", 
      href: "/teams", 
      icon: Users 
    },
    { 
      name: "Standings", 
      href: "/standings", 
      icon: Trophy 
    },
    { 
      name: "Stats", 
      href: "/stats", 
      icon: BarChart3 
    },
    { 
      name: "Matches", 
      href: "/matches", 
      icon: Calendar 
    },
    { 
      name: "Awards", 
      href: "/awards", 
      icon: Award 
    },
    {
      name: "Free Agency",
      href: "/free-agency",
      icon: TrendingUp,
      submenu: [
        { name: "Free Agency", href: "/free-agency" },
        { name: "Bidding Recap", href: "/free-agency/bidding-recap" },
      ],
    },
    {
      name: "News",
      href: "/news",
      icon: Star,
      submenu: [
        { name: "News", href: "/news" },
        { name: "Daily Recap", href: "/news/daily-recap" },
      ],
    },
    { 
      name: "Forum", 
      href: "/forum", 
      icon: MessageSquare 
    },
  ]

  const showFullUI = !isLoading
  const showErrorFallback = !isLoading && session && loadingProfile && fetchError
  const uniqueRoles = getUniqueRoleBadges()

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden h-12 w-12 rounded-xl bg-background/90 backdrop-blur-lg border border-primary/20 hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      )}

      {/* Professional Championship Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-background/95 backdrop-blur-lg border-r-2 border-primary/30 shadow-2xl overflow-hidden",
          isMobile && !isMobileOpen && "w-0",
          !isMobile && "min-w-[80px]"
        )}
        style={{
          width: isMobile ? (isMobileOpen ? "280px" : "0px") : (isOpen ? "280px" : "80px")
        }}
      >
        {/* Enhanced Hockey-Themed Sidebar Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-secondary/5 to-primary/8" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-secondary to-primary" />
        
        <div className="relative h-full flex flex-col">
          {/* Enhanced Professional Logo Section */}
          <div className="p-6 border-b border-primary/20">
            <Link 
              href="/" 
              className="group flex items-center gap-4 transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <Image
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//SCS.png"
                  alt="SCS Logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain relative z-10 filter drop-shadow-lg"
                  priority
                />
              </div>
              {(isOpen || isMobileOpen) && (
                <div className="flex flex-col">
                  <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Secret Chel Society
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium tracking-wide">
                    NHL 26 CHAMPIONSHIP
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Enhanced Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item, index) => (
              <div key={item.name}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between h-12 px-4 rounded-xl transition-all duration-300 hover:scale-105 group",
                        pathname.startsWith(item.href)
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                          : "text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10"
                      )}
                      onClick={() => toggleSubmenu(item.name)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {(isOpen || isMobileOpen) && (
                          <span className="font-semibold">{item.name}</span>
                        )}
                      </div>
                      {(isOpen || isMobileOpen) && (
                        <div
                          className={`transform transition-transform duration-200 ${
                            expandedMenus.includes(item.name) ? 'rotate-90' : 'rotate-0'
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                    
                    {(isOpen || isMobileOpen) && expandedMenus.includes(item.name) && (
                      <div className="ml-6 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.name} href={subItem.href}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105",
                                pathname === subItem.href
                                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                              )}
                            >
                              <span className="font-medium">{subItem.name}</span>
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-12 px-4 rounded-xl transition-all duration-300 hover:scale-105 group",
                        pathname === item.href
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                          : "text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {(isOpen || isMobileOpen) && (
                          <span className="font-semibold">{item.name}</span>
                        )}
                      </div>
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}

            {/* Season Registration - Special Item */}
            {session && (
              <div>
                <Link href="/register/season">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 px-4 rounded-xl transition-all duration-300 hover:scale-105 group",
                      pathname === "/register/season"
                        ? "bg-gradient-to-r from-secondary to-primary text-white shadow-lg"
                        : "text-muted-foreground hover:text-secondary hover:bg-gradient-to-r hover:from-secondary/10 hover:to-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5" />
                      {(isOpen || isMobileOpen) && (
                        <span className="font-semibold">Season Registration</span>
                      )}
                    </div>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-secondary to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Enhanced User Section */}
          <div className="border-t border-primary/20 p-4 space-y-4">
            {/* Theme Toggle and Controls */}
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <ModeToggle />
              </div>
              
              {showFullUI && session && (
                <>
                  <TeamChatButton />
                  {!loadingProfile && <NotificationsDropdown userId={session.user.id} />}
                </>
              )}
            </div>

            {/* Team Badge */}
            {teamInfo && (isOpen || isMobileOpen) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/teams/${teamInfo.id}`} className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105">
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg">
                        {teamInfo.logo_url ? (
                          <Image
                            src={teamInfo.logo_url || "/placeholder.svg"}
                            alt={teamInfo.name}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {teamInfo.name.substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-foreground">{teamInfo.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-background/95 backdrop-blur-lg border border-primary/20">
                    <p className="font-medium">Team: {teamInfo.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Role Badges */}
            {uniqueRoles.length > 0 && (isOpen || isMobileOpen) && (
              <div className="flex flex-wrap gap-2">
                {uniqueRoles.map((role) => (
                  <Badge 
                    key={role} 
                    className={`${getRoleBadgeColor(role)} text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105`}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            {/* User Profile Section */}
            {showFullUI && (
              <>
                {session ? (
                  <div className="space-y-3">
                    {showErrorFallback ? (
                      <Button 
                        variant="ghost" 
                        onClick={() => window.location.reload()}
                        className="w-full"
                      >
                        Retry
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-14 px-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:scale-105 group"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-lg">
                                  <AvatarImage
                                    src={currentAvatarUrl || "/placeholder.svg?height=40&width=40"}
                                    alt={userProfile?.gamer_tag_id || "User"}
                                    key={currentAvatarUrl}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                                    {getInitials()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              {(isOpen || isMobileOpen) && (
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-foreground">
                                    {userProfile?.gamer_tag_id || "User"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {session?.user?.email}
                                  </p>
                                </div>
                              )}
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="w-64 bg-background/95 backdrop-blur-lg border border-primary/20 shadow-2xl ml-4" 
                          align="start" 
                          forceMount
                        >
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <button onClick={navigateToProfile} className="text-left group hover:cursor-pointer">
                                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                  {userProfile?.gamer_tag_id || "User"}
                                </p>
                              </button>
                              <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {playerRole && (
                                  <Badge variant="outline" className="w-fit">
                                    {playerRole}
                                  </Badge>
                                )}
                                {userRoles.map((role) => (
                                  <Badge key={role} variant="outline" className="w-fit">
                                    {role}
                                  </Badge>
                                ))}
                                {teamInfo && (
                                  <Badge variant="secondary" className="w-fit">
                                    {teamInfo.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <button onClick={navigateToProfile} className="flex items-center w-full text-left">
                                <span className="mr-2">👤</span>
                                View My Profile
                              </button>
                            </DropdownMenuItem>
                            {hasManagementRole() && (
                              <DropdownMenuItem asChild>
                                <Link href="/management" className="flex items-center">
                                  <span className="mr-2">🏢</span>
                                  Management Panel
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href="/admin">Admin Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/settings">League Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/player-mappings">Player Mappings</Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href="/settings">Account Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/register/season">Season Registration</Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      asChild
                      variant="outline" 
                      className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-md h-12 font-semibold"
                    >
                      <Link href="/login">
                        {(isOpen || isMobileOpen) ? "Log in" : "Login"}
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-12 font-semibold"
                    >
                      <Link href="/register">
                        {(isOpen || isMobileOpen) ? "Sign up" : "Join"}
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Professional Sidebar Toggle */}
          {!isMobile && (
            <div className="border-t border-primary/20 p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(!isOpen)}
                      className="h-12 w-full rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg group"
                    >
                      <div
                        className={`transform transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-primary group-hover:text-secondary transition-colors duration-300" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="bg-background/95 backdrop-blur-lg border border-primary/20 font-medium"
                  >
                    <p>{isOpen ? "Collapse Sidebar" : "Expand Sidebar"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
