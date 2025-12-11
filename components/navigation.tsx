"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
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
import { cn } from "@/lib/utils"

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
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({})
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
          setIsAdmin(roleNames.includes("Admin") || roleNames.includes("Site Owner"))
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

  // Subscribe to avatar updates
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }))
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
      case "TC":
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

    if (playerRole) allRoles.add(playerRole)

    userRoles.forEach((role) => {
      if (role !== playerRole) {
        allRoles.add(role)
      }
    })

    return Array.from(allRoles)
  }

  const getProfileUrl = () => {
    if (playerId) return `/players/${playerId}`
    if (session?.user?.id) return `/players/${session.user.id}`
    return "/profile"
  }

  const navigateToProfile = () => {
    const profileUrl = getProfileUrl()
    router.push(profileUrl)
    closeMenu()
  }

  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  const navigationStructure = {
    home: { name: "Home", href: "/" },
    leagues: [
      {
        name: "SCSHL",
        logo: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png",
        items: [
          { name: "Teams", href: "/teams" },
          { name: "Standings", href: "/standings" },
          { name: "Stats", href: "/statistics" },
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
          ...(session ? [{ name: "Season Registration", href: "/register/season" }] : []),
        ],
      },
      {
        name: "SCSDHL",
        logo: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png",
        items: [
          { name: "Teams", href: "/ahl/teams" },
          { name: "Standings", href: "/ahl/standings" },
          { name: "Stats", href: "/ahl/statistics" },
          { name: "Matches", href: "/ahl/matches" },
          { name: "Awards", href: "/ahl/awards" },
          {
            name: "News",
            href: "/ahl/news",
            submenu: [
              { name: "News", href: "/ahl/news" },
              { name: "Daily Recap", href: "/ahl/news/daily-recap" },
            ],
          },
        ],
      },
    ],
  }

  const showFullUI = !isLoading
  const showErrorFallback = !isLoading && session && loadingProfile && fetchError
  const uniqueRoles = getUniqueRoleBadges()

  const isPathActive = (href: string, submenu?: any[]) => {
    if (pathname === href) return true
    if (submenu) {
      return submenu.some((item) => pathname === item.href || pathname.startsWith(item.href))
    }
    return pathname.startsWith(href) && href !== "/"
  }

  /* ====================== MOBILE LAYOUT ====================== */
  if (isMobile) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-3">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"
                  alt="SCS Logo"
                  width={100}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>

              {showFullUI && session && teamInfo && (
                <Link href={`/teams/${teamInfo.id}`} className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-background">
                    {teamInfo.logo_url ? (
                      <Image
                        src={teamInfo.logo_url || "/placeholder.svg"}
                        alt={teamInfo.name}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">{teamInfo.name.substring(0, 2)}</span>
                    )}
                  </div>
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <ModeToggle />
              {showFullUI && session && <TeamChatButton />}
              {showFullUI && session && !loadingProfile && <NotificationsDropdown userId={session.user.id} />}

              {showFullUI && session && !loadingProfile && (
                <button
                  onClick={navigateToProfile}
                  className="flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border-2 border-muted hover:border-primary transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={currentAvatarUrl || "/placeholder.svg?height=28&width=28"}
                      alt={userProfile?.gamer_tag_id || "User"}
                      key={currentAvatarUrl}
                    />
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              )}

              <Button variant="ghost" size="icon" onClick={toggleMenu} className="h-9 w-9">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </header>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="flex h-16 items-center justify-between px-3 border-b">
              <Link href="/" className="flex items-center" onClick={closeMenu}>
                <Image
                  src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"
                  alt="SCS Logo"
                  width={100}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>
              <Button variant="ghost" size="icon" onClick={closeMenu} className="h-9 w-9">
                <X className="h-4 w-4" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            <div className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
              <nav className="space-y-4">
                <div className="space-y-2">
                  <Link
                    href={navigationStructure.home.href}
                    className={`block px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === navigationStructure.home.href
                        ? "text-primary bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={closeMenu}
                  >
                    {navigationStructure.home.name}
                  </Link>
                </div>

                {navigationStructure.leagues.map((league) => (
                  <div key={league.name} className="space-y-2">
                    <button
                      onClick={() => toggleSubmenu(`league-${league.name}`)}
                      className="flex w-full items-center justify-between px-2 py-2 text-sm font-semibold text-primary uppercase tracking-wider rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={league.logo || "/placeholder.svg"}
                          alt={`${league.name} Logo`}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                        <span>{league.name}</span>
                      </div>
                      {expandedMenus[`league-${league.name}`] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedMenus[`league-${league.name}`] && (
                      <div className="space-y-1 ml-4">
                        {league.items.map((item) => (
                          <div key={item.name}>
                            <Link
                              href={item.href}
                              className={`block px-2 py-2 text-base font-medium rounded-md transition-colors ${
                                isPathActive(item.href, item.submenu)
                                  ? "text-primary bg-muted"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                              onClick={closeMenu}
                            >
                              {item.name}
                            </Link>
                            {item.submenu && (
                              <div className="ml-4 mt-1 space-y-1">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className={`block px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                      pathname === subItem.href
                                        ? "text-primary bg-muted"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                      </div>
                    )}
                  </div>
                ))}

                {session && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider px-2">Account</h3>
                    <div className="space-y-1">
                      <button
                        onClick={navigateToProfile}
                        className="block w-full text-left px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        My Profile
                      </button>
                      {hasManagementRole() && (
                        <Link
                          href="/management"
                          className="block px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={closeMenu}
                        >
                          Management Panel
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={closeMenu}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        className="block px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        onClick={closeMenu}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-2 py-2 text-base font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}

                {showFullUI && !session && (
                  <div className="space-y-3 pt-4 border-t">
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/login" onClick={closeMenu}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={closeMenu}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </>
    )
  }

  /* ====================== DESKTOP SIDEBAR ====================== */
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background flex flex-col">
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"
            alt="SCS Logo"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 sidebar-scroll">
        <div className="space-y-6">
          <div className="space-y-2">
            <Link
              href={navigationStructure.home.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === navigationStructure.home.href && "bg-muted text-primary",
              )}
            >
              {navigationStructure.home.name}
            </Link>
          </div>

          {navigationStructure.leagues.map((league) => (
            <div key={league.name} className="space-y-2">
              <button
                onClick={() => toggleSubmenu(`league-${league.name}`)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={league.logo || "/placeholder.svg"}
                    alt={`${league.name} Logo`}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {league.name}
                  </span>
                </div>
                {expandedMenus[`league-${league.name}`] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedMenus[`league-${league.name}`] && (
                <ul className="space-y-1 ml-4">
                  {league.items.map((item) => (
                    <li key={item.name}>
                      {item.submenu ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu(`${league.name}-${item.name}`)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                              isPathActive(item.href, item.submenu) && "bg-muted text-primary",
                            )}
                          >
                            <span>{item.name}</span>
                            {expandedMenus[`${league.name}-${item.name}`] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {expandedMenus[`${league.name}-${item.name}`] && (
                            <ul className="ml-4 mt-2 space-y-1">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                      pathname === subItem.href && "bg-muted text-primary",
                                    )}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                            pathname === item.href && "bg-muted text-primary",
                          )}
                        >
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </nav>

      {showFullUI && (
        <div className="border-t p-4">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ModeToggle />
                  <TeamChatButton />
                  {!loadingProfile && <NotificationsDropdown userId={session.user.id} />}
                </div>
              </div>

              {teamInfo && (
                <div className="flex items-center gap-2">
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
                  <span className="text-sm font-medium">{teamInfo.name}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {uniqueRoles.map((role) => (
                  <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs`}>
                    {role}
                  </Badge>
                ))}
              </div>

              {showErrorFallback ? (
                <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">
                  Retry
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                            alt={userProfile?.gamer_tag_id || "User"}
                            key={currentAvatarUrl}
                          />
                          <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <p className="text-sm font-medium leading-none">{userProfile?.gamer_tag_id || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">{session?.user?.email}</p>
                        </div>
                      </div>
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
            <div className="space-y-2">
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
