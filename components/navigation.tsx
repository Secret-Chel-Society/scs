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
  User
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { avatarSync } from "@/lib/avatar-sync"
import { cn } from "@/lib/utils"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [playerRole, setPlayerRole] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamManager, setIsTeamManager] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  
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
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchUserData()
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

  const hasManagementRole = () => {
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    return playerRole && managementRoles.includes(playerRole)
  }

  const navigation = [
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

  const uniqueRoles = getUniqueRoleBadges()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
              alt="MGHL Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigation.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.submenu ? (
                  <>
                    <NavigationMenuTrigger>{item.name}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  pathname === subItem.href && "bg-accent text-accent-foreground"
                                )}
                              >
                                <div className="text-sm font-medium leading-none">{subItem.name}</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                        pathname === item.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}

            {session && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/register/season"
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      pathname === "/register/season" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Season Registration
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Mobile Logo */}
          <div className="flex md:hidden">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                alt="MGHL Logo"
                width={100}
                height={32}
                className="h-6 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-2">
            {session ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <TeamChatButton />
                  <NotificationsDropdown userId={session.user.id} />
                </div>
                
                <ModeToggle />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={currentAvatarUrl || "/placeholder.svg?height=32&width=32"}
                          alt={userProfile?.gamer_tag_id || "User"}
                          key={currentAvatarUrl}
                        />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userProfile?.gamer_tag_id || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session?.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Role Badges */}
                    {uniqueRoles.length > 0 && (
                      <>
                        <div className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {uniqueRoles.map((role) => (
                              <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs`}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Team Info */}
                    {teamInfo && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/teams/${teamInfo.id}`} className="flex items-center">
                            <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border bg-background mr-2">
                              {teamInfo.logo_url ? (
                                <Image
                                  src={teamInfo.logo_url}
                                  alt={teamInfo.name}
                                  width={16}
                                  height={16}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold">{teamInfo.name.substring(0, 2)}</span>
                              )}
                            </div>
                            {teamInfo.name}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={getProfileUrl()}>
                          <User className="mr-2 h-4 w-4" />
                          View My Profile
                        </Link>
                      </DropdownMenuItem>
                      {hasManagementRole() && (
                        <DropdownMenuItem asChild>
                          <Link href="/management">
                            <Settings className="mr-2 h-4 w-4" />
                            Management Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Settings className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              League Settings
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <ModeToggle />
                <Button variant="ghost" asChild className="hidden md:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <div className="px-7">
                  <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <Image
                      src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
                      alt="MGHL Logo"
                      width={120}
                      height={40}
                      className="h-6 w-auto object-contain"
                      priority
                    />
                  </Link>
                </div>
                <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                  <div className="flex flex-col space-y-3">
                    {navigation.map((item) => (
                      <div key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-2 py-1 text-lg font-semibold",
                            pathname === item.href && "text-foreground"
                          )}
                        >
                          {item.name}
                        </Link>
                        {item.submenu && (
                          <div className="ml-4 mt-2 space-y-2">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  "block px-2 py-1 text-sm text-muted-foreground",
                                  pathname === subItem.href && "text-foreground"
                                )}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {session && (
                      <Link
                        href="/register/season"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "block px-2 py-1 text-lg font-semibold",
                          pathname === "/register/season" && "text-foreground"
                        )}
                      >
                        Season Registration
                      </Link>
                    )}

                    {session && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-2 mb-4">
                          <TeamChatButton />
                          <NotificationsDropdown userId={session.user.id} />
                        </div>
                      </div>
                    )}

                    {!session && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            Log in
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                            Sign up
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
