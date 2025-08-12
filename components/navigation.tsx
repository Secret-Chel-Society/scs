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
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                alt="MGHL Logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Navigation links centered */}
          <nav className="hidden md:flex items-center justify-center mx-auto">
            <ul className="flex space-x-6">
              {navigation.map((item) => (
                <li key={item.name} className="relative group">
                  {item.submenu ? (
                    <div className="relative">
                      <Link
                        href={item.href}
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === item.href || pathname.startsWith(item.href)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                      <div className="absolute left-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
              {session && (
                <Link
                  href="/register/season"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/register/season" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Season Registration
                </Link>
              )}
            </ul>
          </nav>

          {/* User controls on the right */}
          <div className="flex items-center space-x-2">
            <ModeToggle />

            {/* Team Chat Button - show for all authenticated users, component handles team check */}
            {showFullUI && session && <TeamChatButton />}

            {showFullUI && session && !loadingProfile && <NotificationsDropdown userId={session.user.id} />}

            {showFullUI && (
              <>
                {session ? (
                  <div className="flex items-center gap-2">
                    {/* Display team badge if available */}
                    {teamInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/teams/${teamInfo.id}`} className="flex items-center">
                              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                                {teamInfo.logo_url ? (
                                  <Image
                                    src={teamInfo.logo_url || "/placeholder.svg"}
                                    alt={teamInfo.name}
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">{teamInfo.name.substring(0, 2)}</span>
                                )}
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{teamInfo.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Display unique role badges */}
                    <div className="flex gap-1">
                      {uniqueRoles.map((role) => (
                        <Badge key={role} className={`${getRoleBadgeColor(role)} text-white`}>
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
                          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                                alt={userProfile?.gamer_tag_id || "User"}
                                key={currentAvatarUrl} // Force re-render when avatar changes
                              />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
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
                  <div className="hidden md:flex items-center space-x-2">
                    <Button variant="outline" asChild>
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Sign up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <Image
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                alt="MGHL Logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="container grid gap-6 py-6">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`text-lg font-medium ${pathname === item.href || pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"}`}
                  onClick={closeMenu}
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div className="ml-4 mt-2 space-y-2">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`block text-base font-medium ${pathname === subItem.href ? "text-primary" : "text-muted-foreground"}`}
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
                  className={`text-lg font-medium ${pathname === "/register/season" ? "text-primary" : "text-muted-foreground"}`}
                  onClick={closeMenu}
                >
                  Season Registration
                </Link>
                <button
                  onClick={navigateToProfile}
                  className={`text-lg font-medium text-left ${pathname.startsWith("/players/") ? "text-primary" : "text-muted-foreground"}`}
                >
                  My Profile
                </button>
                {/* Team Chat in mobile menu */}
                <div className="mt-4">
                  <TeamChatButton />
                </div>
              </>
            )}
            {showFullUI && (
              <>
                {!session && (
                  <div className="grid gap-4 mt-4">
                    <Button variant="outline" asChild>
                      <Link href="/login" onClick={closeMenu}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild>
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
