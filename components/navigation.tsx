"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Menu, X } from "lucide-react"
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

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
    // Don't fetch if no session or supabase client
    if (!session?.user?.id || !supabase) {
      setLoadingProfile(false)
      setUserProfile(null)
      return
    }

    try {
      // Set loading but don't block UI rendering
      setLoadingProfile(true)
      setFetchError(null)

      // Fetch basic user data first
      const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (user) {
        setUserProfile(user)
        setCurrentAvatarUrl(user.avatar_url)
      }

      // Then fetch additional data in parallel
      const [playerResponse, rolesResponse] = await Promise.allSettled([
        supabase.from("players").select("id, role, team_id").eq("user_id", session.user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ])

      // Handle player data
      if (playerResponse.status === "fulfilled" && playerResponse.value.data) {
        const player = playerResponse.value.data
        setPlayerRole(player.role)
        setPlayerId(player.id)
        setIsTeamManager(["GM", "AGM", "Owner"].includes(player.role))

        // Fetch team data if available
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

      // Handle roles data
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

  // Improved user profile fetching with better error handling
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      // Don't fetch if no session or supabase client
      if (!session?.user?.id || !supabase) {
        if (isMounted) {
          setLoadingProfile(false)
          setUserProfile(null)
        }
        return
      }

      try {
        // Set loading but don't block UI rendering
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

    // Start fetching data but don't block UI rendering
    fetchData()

    return () => {
      isMounted = false
    }
  }, [session, supabase])

  // Subscribe to avatar updates
  useEffect(() => {
    if (!session?.user?.id) return

    const unsubscribe = avatarSync.subscribe((newAvatarUrl) => {
      setCurrentAvatarUrl(newAvatarUrl)
      // Also update the userProfile state
      setUserProfile((prev: any) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev))
    })

    return unsubscribe
  }, [session?.user?.id])

  useEffect(() => {
    // Refresh user data when returning to the page (e.g., from settings)
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        // Re-fetch user data when page becomes visible
        fetchUserData()
      }
    }

    // Listen for storage events (when avatar is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "avatar_updated" && session?.user?.id) {
        fetchUserData()
      }
    }

    // Listen for custom avatar update events
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

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
      // Check if we have a session before attempting to sign out
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (currentSession) {
        // We have a valid session, proceed with normal sign out
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      } else {
        // No session found, but we'll still redirect to clear the UI state
        console.log("No active session found, but proceeding with UI sign out")
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      }

      // Force a hard navigation to ensure complete page refresh with new auth state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)

      // Special handling for "Auth session missing!" error
      if (error instanceof Error && error.message.includes("Auth session missing")) {
        console.log("Auth session missing, forcing sign out anyway")
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })

        // Force navigation even if there was an error
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

  // Get role badge color based on role
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

  // Prepare unique roles for display
  const getUniqueRoleBadges = () => {
    const allRoles = new Set<string>()

    // Add player role if it exists
    if (playerRole) {
      allRoles.add(playerRole)
    }

    // Add other roles that aren't already included
    userRoles.forEach((role) => {
      if (role !== playerRole) {
        allRoles.add(role)
      }
    })

    return Array.from(allRoles)
  }

  // Get the profile URL
  const getProfileUrl = () => {
    // If we have a player ID, use it
    if (playerId) {
      return `/players/${playerId}`
    }

    // If we have a user ID, use that for the player page
    if (session?.user?.id) {
      return `/players/${session.user.id}`
    }

    // Last resort fallback
    return "/profile"
  }

  // Navigate to profile
  const navigateToProfile = () => {
    const profileUrl = getProfileUrl()
    console.log("Navigating to profile:", profileUrl)
    router.push(profileUrl)
    closeMenu()
  }

  // Check if user has management role
  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  // Base navigation items
  const baseNavigation = [
    { name: "Home", href: "/" },
    { name: "Teams", href: "/teams" },
    { name: "Standings", href: "/standings" },
    { name: "Stats", href: "/stats" },
    { name: "Matches", href: "/matches" },
    { name: "Awards", href: "/awards" },
    {
      name: "Free Agency",
      href: "/free-agency",
      submenu: [
        { name: "Free Agency", href: "/free-agency" },
        { name: "Bidding Recap", href: "/free-agency/bidding-recap" },
      ],
    },
    {
      name: "News",
      href: "/news",
      submenu: [
        { name: "News", href: "/news" },
        { name: "Daily Recap", href: "/news/daily-recap" },
      ],
    },
    { name: "Forum", href: "/forum" },
  ]

  // Don't add profile link to main navigation when user is logged in
  const navigation = baseNavigation

  // Determine if we should show the full UI or a loading state
  const showFullUI = !isLoading

  const showErrorFallback = !isLoading && session && loadingProfile && fetchError

  // Get unique roles for display
  const uniqueRoles = getUniqueRoleBadges()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
      <div className="container mx-auto px-4 relative">
        <div className="flex h-18 items-center justify-between py-2">
          {/* Logo on the left with enhanced styling */}
          <div className="flex-shrink-0">
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <Image
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//SCS.png"
                  alt="SCS Logo"
                  width={120}
                  height={40}
                  className="h-12 w-auto object-contain relative z-10 filter drop-shadow-lg"
                  priority
                />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Secret Chel Society
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">NHL 26 COMPETITIVE LEAGUE</p>
              </div>
            </Link>
          </div>

          {/* Navigation links centered with enhanced styling */}
          <nav className="hidden md:flex items-center justify-center mx-auto">
            <ul className="flex space-x-1">
              {navigation.map((item) => (
                <li key={item.name} className="relative group">
                  {item.submenu ? (
                    <div className="relative">
                      <Link
                        href={item.href}
                        className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg group-hover:scale-105 ${
                          pathname === item.href || pathname.startsWith(item.href)
                            ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                      >
                        {item.name}
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </Link>
                      <div className="absolute left-0 mt-3 w-56 bg-background/95 backdrop-blur-lg border border-primary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-background/95 border-l border-t border-primary/20 rotate-45" />
                        <div className="relative bg-background/95 rounded-xl overflow-hidden">
                          {item.submenu.map((subItem, index) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg hover:scale-105 group ${
                        pathname === item.href 
                          ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg" 
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      {item.name}
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </Link>
                  )}
                </li>
              ))}
              {session && (
                <Link
                  href="/register/season"
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg hover:scale-105 group ${
                    pathname === "/register/season" 
                      ? "text-white bg-gradient-to-r from-secondary to-primary shadow-lg" 
                      : "text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                  }`}
                >
                  Season Registration
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-secondary to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              )}
            </ul>
          </nav>

          {/* User controls on the right with enhanced styling */}
          <div className="flex items-center space-x-3">
            <div className="p-1 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <ModeToggle />
            </div>

            {/* Team Chat Button with enhanced styling */}
            {showFullUI && session && (
              <div className="relative">
                <TeamChatButton />
              </div>
            )}

            {/* Notifications with glow effect */}
            {showFullUI && session && !loadingProfile && (
              <div className="relative">
                <NotificationsDropdown userId={session.user.id} />
              </div>
            )}

            {showFullUI && (
              <>
                {session ? (
                  <div className="flex items-center gap-3">
                    {/* Enhanced team badge display */}
                    {teamInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/teams/${teamInfo.id}`} className="group flex items-center transition-all duration-300 hover:scale-110">
                              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg group-hover:shadow-xl group-hover:border-primary/50 transition-all duration-300">
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
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background/95 backdrop-blur-lg border border-primary/20">
                            <p className="font-medium">{teamInfo.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Enhanced role badges with hockey-themed styling */}
                    <div className="flex gap-2">
                      {uniqueRoles.map((role) => (
                        <Badge 
                          key={role} 
                          className={`${getRoleBadgeColor(role)} text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105`}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>

                    {showErrorFallback ? (
                      <Button variant="ghost" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:scale-110 transition-all duration-300 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Avatar className="h-9 w-9 border-2 border-primary/30 shadow-lg">
                              <AvatarImage
                                src={currentAvatarUrl || "/placeholder.svg?height=36&width=36"}
                                alt={userProfile?.gamer_tag_id || "User"}
                                key={currentAvatarUrl}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-lg border border-primary/20 shadow-2xl" align="end" forceMount>
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
                  <div className="hidden md:flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      asChild
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-md"
                    >
                      <Link href="/login" className="font-semibold">Log in</Link>
                    </Button>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Link href="/register" className="font-semibold">Sign up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Enhanced mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-10 w-10 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:scale-110" 
              onClick={toggleMenu}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg md:hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
          <div className="container flex h-18 items-center justify-between py-2 relative">
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105" onClick={closeMenu}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <Image
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//SCS.png"
                  alt="SCS Logo"
                  width={120}
                  height={40}
                  className="h-12 w-auto object-contain relative z-10 filter drop-shadow-lg"
                  priority
                />
              </div>
              <div className="block">
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Secret Chel Society
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">NHL 26 COMPETITIVE LEAGUE</p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeMenu}
              className="h-10 w-10 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:scale-110"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="container grid gap-4 py-8 relative">
            {navigation.map((item) => (
              <div key={item.name} className="group">
                <Link
                  href={item.href}
                  className={`block text-xl font-semibold px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    pathname === item.href || pathname.startsWith(item.href) 
                      ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg" 
                      : "text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10"
                  }`}
                  onClick={closeMenu}
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div className="ml-6 mt-3 space-y-2">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`block text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                          pathname === subItem.href 
                            ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg" 
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                        onClick={closeMenu}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {session && (
              <>
                <Link
                  href="/register/season"
                  className={`block text-xl font-semibold px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    pathname === "/register/season" 
                      ? "text-white bg-gradient-to-r from-secondary to-primary shadow-lg" 
                      : "text-muted-foreground hover:text-secondary hover:bg-gradient-to-r hover:from-secondary/10 hover:to-primary/10"
                  }`}
                  onClick={closeMenu}
                >
                  Season Registration
                </Link>
                <button
                  onClick={navigateToProfile}
                  className={`block text-xl font-semibold px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 text-left w-full ${
                    pathname.startsWith("/players/") 
                      ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  My Profile
                </button>
                {/* Enhanced team chat in mobile menu */}
                <div className="mt-6 px-4">
                  <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                    <TeamChatButton />
                  </div>
                </div>
              </>
            )}
            {showFullUI && (
              <>
                {!session && (
                  <div className="grid gap-4 mt-8 px-4">
                    <Button 
                      variant="outline" 
                      asChild
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-md py-3 text-lg font-semibold"
                    >
                      <Link href="/login" onClick={closeMenu}>
                        Log in
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-3 text-lg font-semibold"
                    >
                      <Link href="/register" onClick={closeMenu}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
