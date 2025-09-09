"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Menu, X, User, Settings, LogOut, Building, ShieldCheck, Wrench, Map } from "lucide-react"
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

export default function SideNavigation() {
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

  // All data fetching and helper functions remain unchanged.
  // ... (fetchUserData, handleSignOut, getInitials, etc. from your original code)
  // --- Start of Unchanged Logic ---

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
      if (!document.hidden && session?.user?.id) fetchUserData()
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "avatar_updated" && session?.user?.id) fetchUserData()
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
      }
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      if (error instanceof Error && error.message.includes("Auth session missing")) {
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

  const getProfileUrl = () => {
    if (playerId) return `/players/${playerId}`
    if (session?.user?.id) return `/players/${session.user.id}`
    return "/profile"
  }

  const navigateToProfile = () => {
    router.push(getProfileUrl())
    closeMenu()
  }

  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  // --- End of Unchanged Logic ---

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
      name: "ELO",
      href: "/elo/rankings",
      submenu: [
        { name: "ELO Rankings", href: "/elo/rankings" },
        { name: "ELO Statistics", href: "/elo/statistics" },
        { name: "ELO Matches", href: "/elo/matches" },
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
  
  if (session) {
    baseNavigation.push({ name: "Season Registration", href: "/register/season" })
  }

  const navigation = baseNavigation
  const showFullUI = !isLoading

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={closeMenu}>
          <Image
            src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//SCS.png"
            alt="SCS Logo"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </div>
      
      {/* Main Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="grid items-start gap-2 px-4 text-sm font-medium">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-ice-blue-600 dark:hover:text-ice-blue-400 ${
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-ice-blue-100 dark:bg-ice-blue-900/30 text-ice-blue-600 dark:text-ice-blue-400"
                    : "text-muted-foreground"
                }`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
              {item.submenu && (
                <ul className="ml-7 mt-1 border-l border-muted-foreground/20 pl-4">
                  {item.submenu.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.href}
                        className={`block rounded-lg py-2 pl-2 pr-3 transition-all hover:text-ice-blue-600 dark:hover:text-ice-blue-400 text-sm ${
                          pathname === subItem.href ? "text-ice-blue-600 dark:text-ice-blue-400" : "text-hockey-silver-600 dark:text-hockey-silver-400"
                        }`}
                        onClick={closeMenu}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom User Section */}
      <div className="mt-auto border-t p-4">
        {showFullUI && (
          <>
            {session ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <TeamChatButton />
                    <NotificationsDropdown userId={session.user.id} />
                    <ModeToggle />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex h-auto w-full items-center justify-start gap-3 p-2">
                       <Avatar className="h-9 w-9 border">
                         <AvatarImage
                           src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                           alt={userProfile?.gamer_tag_id || "User"}
                           key={currentAvatarUrl}
                         />
                         <AvatarFallback>{getInitials()}</AvatarFallback>
                       </Avatar>
                       <div className="flex flex-col items-start">
                         <span className="font-semibold text-sm">{userProfile?.gamer_tag_id || "User"}</span>
                         <span className="text-xs text-muted-foreground">{playerRole || "No Role"}</span>
                       </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mb-2" align="start" side="top" forceMount>
                     <DropdownMenuLabel className="font-normal">
                       <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userProfile?.gamer_tag_id || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                       </div>
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuGroup>
                        <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" /> View My Profile
                        </DropdownMenuItem>
                        {hasManagementRole() && (
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/management"><Building className="mr-2 h-4 w-4" /> Management</Link>
                            </DropdownMenuItem>
                        )}
                        {isAdmin && (
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                        </DropdownMenuItem>
                     </DropdownMenuGroup>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
               <div className="grid gap-2">
                 <Button variant="outline" asChild><Link href="/login">Log in</Link></Button>
                 <Button asChild><Link href="/register">Sign up</Link></Button>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:border-r md:bg-background">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
        <Button size="icon" variant="outline" className="md:hidden" onClick={toggleMenu}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex-1" /> {/* Spacer */}
        <ModeToggle />
        {session && <NotificationsDropdown userId={session.user.id} />}
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={closeMenu}>
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
          >
            <NavContent />
            <Button size="icon" variant="ghost" className="absolute top-3 right-3" onClick={closeMenu}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close Menu</span>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
