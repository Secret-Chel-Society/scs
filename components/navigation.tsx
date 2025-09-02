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
  Gamepad2,
  Target,
  Crown,
  Shield,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  const navigation = [
    {
      name: "SCS",
      subtitle: "Secret Chel Society",
      items: [
        { name: "Home", href: "/", icon: Home, color: "from-blue-500 to-cyan-500" },
        { name: "Teams", href: "/teams", icon: Users, color: "from-green-500 to-emerald-500" },
        { name: "Standings", href: "/standings", icon: Trophy, color: "from-yellow-500 to-amber-500" },
        { name: "Stats", href: "/statistics", icon: BarChart3, color: "from-purple-500 to-pink-500" },
        { name: "Matches", href: "/matches", icon: Calendar, color: "from-indigo-500 to-blue-500" },
        { name: "Awards", href: "/awards", icon: Award, color: "from-orange-500 to-red-500" },
        {
          name: "Free Agency",
          href: "/free-agency",
          icon: DollarSign,
          color: "from-emerald-500 to-teal-500",
          submenu: [
            { name: "Free Agency", href: "/free-agency" },
            { name: "Bidding Recap", href: "/free-agency/bidding-recap" },
          ],
        },
        {
          name: "News",
          href: "/news",
          icon: Newspaper,
          color: "from-rose-500 to-pink-500",
          submenu: [
            { name: "News", href: "/news" },
            { name: "Daily Recap", href: "/news/daily-recap" },
          ],
        },
        { name: "Forum", href: "/forum", icon: MessageSquare, color: "from-violet-500 to-purple-500" },
        { name: "Season Registration", href: "/register/season", icon: UserPlus, color: "from-green-500 to-emerald-500" },
        {
          name: "ELO System",
          href: "/elo/rankings",
          icon: Target,
          color: "from-red-500 to-pink-500",
          submenu: [
            { name: "ELO Rankings", href: "/elo/rankings" },
            { name: "ELO Statistics", href: "/elo/statistics" },
            { name: "ELO Matches", href: "/elo/matches" },
            { name: "ELO Leaderboard", href: "/elo/leaderboard" },
            { name: "ELO History", href: "/elo/history" },
          ],
        },
      ]
    },
    {
      name: "ADMIN",
      subtitle: "Administrative Tools",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: Settings, color: "from-gray-500 to-slate-500" },
        { name: "User Management", href: "/admin/users", icon: Users, color: "from-blue-500 to-cyan-500" },
        { name: "Team Management", href: "/admin/teams", icon: Shield, color: "from-green-500 to-emerald-500" },
        { name: "Match Management", href: "/admin/matches", icon: Calendar, color: "from-orange-500 to-red-500" },
        { name: "System Settings", href: "/admin/settings", icon: Settings, color: "from-purple-500 to-pink-500" },
      ]
    }
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner": return "bg-gradient-to-r from-purple-500 to-pink-500"
      case "GM": return "bg-gradient-to-r from-red-500 to-orange-500"
      case "AGM": return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "Player": return "bg-gradient-to-r from-green-500 to-emerald-500"
      case "Admin": return "bg-gradient-to-r from-amber-500 to-yellow-500"
      default: return "bg-gradient-to-r from-gray-500 to-slate-500"
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
      {/* Mobile menu button */}
      <button
        className="fixed top-2 left-2 z-50 lg:hidden h-10 w-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 hover:from-blue-500/30 hover:to-purple-500/30 rounded-md flex items-center justify-center"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        isMobileOpen ? "block" : "hidden"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          {/* Mobile Header */}
          <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm">
            <Link href="/" onClick={() => setIsMobileOpen(false)}>
              <Image
                src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png"
                alt="SCS Logo"
                width={120}
                height={40}
                className="h-6 w-auto object-contain"
                priority
              />
            </Link>
            <button
              className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {navigation.map((section, sectionIndex) => (
                <div key={section.name} className="animate-slide-in" style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                  {/* Section Header */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white mb-1">{section.name}</h3>
                    <p className="text-sm text-white/60">{section.subtitle}</p>
                  </div>
                  
                  {/* Section Items */}
                  <div className="space-y-2">
                    {section.items.map((item, index) => {
                      const Icon = item.icon
                      const isActive = item.href === "/" 
                        ? pathname === "/" 
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                      const hasSubmenu = item.submenu && item.submenu.length > 0
                      const isExpanded = expandedMenus[item.name]

                      return (
                        <div key={item.name} className="animate-slide-in" style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}>
                          <div className="flex items-center">
                            <Link
                              href={item.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 flex-1",
                                isActive 
                                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                  : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                              )}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              <span>{item.name}</span>
                            </Link>
                            {hasSubmenu && (
                              <button
                                className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center"
                                onClick={() => toggleSubmenu(item.name)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>

                          {hasSubmenu && isExpanded && (
                            <div className="mt-1 ml-8 space-y-1 animate-slide-in" style={{ animationDelay: "200ms" }}>
                              {item.submenu.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => setIsMobileOpen(false)}
                                  className={cn(
                                    "block px-3 py-2 rounded-md text-sm transition-all duration-200",
                                    pathname === subItem.href
                                      ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                                      : "text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm"
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
                  </div>
                </div>
              ))}


            </div>

            {/* Mobile User Section */}
            <div className="mt-8 pt-6 border-t border-white/20 animate-slide-in" style={{ animationDelay: "1000ms" }}>
              {session ? (
                <div className="space-y-4">
                  {/* Team Info */}
                  {teamInfo && (
                    <Link 
                      href={`/teams/${teamInfo.id}`} 
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-colors border border-white/20"
                    >
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex-shrink-0">
                        {teamInfo.logo_url ? (
                          <Image
                            src={teamInfo.logo_url}
                            alt={teamInfo.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">{teamInfo.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{teamInfo.name}</p>
                        <p className="text-sm text-white/70">Your Team</p>
                      </div>
                    </Link>
                  )}

                  {/* Role Badges */}
                  {getUniqueRoleBadges().length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getUniqueRoleBadges().map((role) => (
                        <Badge key={role} className={`${getRoleBadgeColor(role)} text-white border-0`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                    <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-white/20">
                      <AvatarImage
                        src={userProfile?.avatar_url || "/placeholder.svg?height=48&width=48"}
                        alt={userProfile?.gamer_tag_id || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {userProfile?.gamer_tag_id || "User"}
                      </p>
                      <p className="text-sm text-white/70">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/login" onClick={() => setIsMobileOpen(false)} className="w-full h-12 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileOpen(false)} className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md flex items-center justify-center">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-50 h-screen w-56 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-r border-white/20 flex flex-col">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-center p-4 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm flex-shrink-0">
          <Link href="/">
            <Image
              src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png"
              alt="SCS Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Scrollable Navigation Container */}
        <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/5 hover:scrollbar-thumb-white/40 transition-all duration-200">
            <div className="space-y-6">
              {navigation.map((section, sectionIndex) => (
                <div key={section.name} className="animate-slide-in" style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                  {/* Section Header */}
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-white mb-1">{section.name}</h3>
                    <p className="text-xs text-white/60">{section.subtitle}</p>
                  </div>
                  
                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item, index) => {
                      const Icon = item.icon
                      const isActive = item.href === "/" 
                        ? pathname === "/" 
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                      const hasSubmenu = item.submenu && item.submenu.length > 0
                      const isExpanded = expandedMenus[item.name]

                      return (
                        <li key={item.name} className="animate-slide-in" style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}>
                          <div className="flex items-center">
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
                                isActive 
                                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                  : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                              )}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                            {hasSubmenu && (
                              <button
                                className="h-8 w-8 flex-shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center"
                                onClick={() => toggleSubmenu(item.name)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>

                          {hasSubmenu && isExpanded && (
                            <ul className="mt-1 ml-6 space-y-1 animate-slide-in" style={{ animationDelay: "200ms" }}>
                              {item.submenu.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      "block px-3 py-2 rounded-md text-sm transition-all duration-200",
                                      pathname === subItem.href
                                        ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                                        : "text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                                    )}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* User Section - Fixed at bottom */}
          <div className="relative z-10 border-t border-white/20 p-4 space-y-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm flex-shrink-0">
            {session ? (
              <>
                {/* Team Info */}
                {teamInfo && (
                  <Link 
                    href={`/teams/${teamInfo.id}`} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-colors border border-white/20"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex-shrink-0">
                      {teamInfo.logo_url ? (
                        <Image
                          src={teamInfo.logo_url}
                          alt={teamInfo.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">{teamInfo.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-white">{teamInfo.name}</p>
                      <p className="text-xs text-white/70">Your Team</p>
                    </div>
                  </Link>
                )}

                {/* Role Badges */}
                {getUniqueRoleBadges().length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {getUniqueRoleBadges().map((role) => (
                      <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs border-0`}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white/20">
                    <AvatarImage
                      src={userProfile?.avatar_url || "/placeholder.svg?height=40&width=40"}
                      alt={userProfile?.gamer_tag_id || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {userProfile?.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate text-white">
                      {userProfile?.gamer_tag_id || "User"}
                    </p>
                    <p className="text-xs leading-none text-white/70 truncate mt-1">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Sign Out Button */}
                <Button
                  onClick={handleSignOut}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <Link href="/login" className="w-full h-10 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                  Log in
                </Link>
                <Link href="/register" className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md flex items-center justify-center">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:active {
          background: rgba(255, 255, 255, 0.5);
        }
        .scrollbar-track-white\/5::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .scrollbar-thumb-white\/30::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }
        .scrollbar-thumb-white\/40::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.4);
        }
        
        /* Firefox scrollbar styles */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </>
  )
}
