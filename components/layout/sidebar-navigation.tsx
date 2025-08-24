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
  ChevronRight
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

  const navigation = [
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="flex items-center" onClick={onToggle}>
              <Image
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                alt="MGHL Logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
            <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const hasSubmenu = item.submenu && item.submenu.length > 0
                const isExpanded = expandedMenus[item.name]

                return (
                  <li key={item.name}>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={onToggle}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1",
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                        {hasSubmenu && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                        <ul className="mt-1 ml-6 space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                onClick={onToggle}
                                className={cn(
                                  "block px-3 py-2 rounded-md text-sm transition-colors",
                                  pathname === subItem.href
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              })}

              {session && (
                <li>
                  <Link
                    href="/register/season"
                    onClick={onToggle}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === "/register/season"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <UserPlus className="h-4 w-4" />
                    Season Registration
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* User Section */}
          {showFullUI && (
            <div className="border-t p-4">
              {session ? (
                <div className="space-y-3">
                  {/* Team Info */}
                  {teamInfo && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/teams/${teamInfo.id}`} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
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
                            <span className="text-sm font-medium truncate">{teamInfo.name}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{teamInfo.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Role Badges */}
                  <div className="flex flex-wrap gap-1">
                    {uniqueRoles.map((role) => (
                      <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs`}>
                        {role}
                      </Badge>
                    ))}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                        alt={userProfile?.gamer_tag_id || "User"}
                        key={currentAvatarUrl}
                      />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <button onClick={navigateToProfile} className="text-left group hover:cursor-pointer">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors truncate">
                          {userProfile?.gamer_tag_id || "User"}
                        </p>
                      </button>
                      <p className="text-xs leading-none text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <TeamChatButton />
                    <NotificationsDropdown userId={session.user.id} />
                    <ModeToggle />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" forceMount>
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <button onClick={navigateToProfile} className="flex items-center w-full text-left">
                              View My Profile
                            </button>
                          </DropdownMenuItem>
                          {hasManagementRole() && (
                            <DropdownMenuItem asChild>
                              <Link href="/management">Management Panel</Link>
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
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={onToggle}>Log in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={onToggle}>Sign up</Link>
                  </Button>
                  <div className="flex justify-center">
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
