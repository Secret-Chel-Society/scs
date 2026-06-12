"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Trophy,
  Calendar,
  Settings,
  ImageIcon,
  BarChart3,
  ShieldCheck,
  Newspaper,
  Database,
  PaintRoller as GameController,
  Activity,
  ClipboardList,
  Bot,
  RefreshCw,
  MessageSquare,
  Trash2,
  Clock,
  DollarSign,
  Coins,
  UserPlus,
  Search,
  UserX,
  UserCog,
  ChevronDown,
  ChevronUp,
  Star,
  Wrench,
} from "lucide-react"
import AdminDiagnostics from "@/components/admin/admin-diagnostics"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AdminLink {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

interface AdminSection {
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  links: AdminLink[]
}

export default function AdminDashboardPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    nhl: true,
    ahl: true,
    allstar: true,
    ecl: true,
    general: true,
    users: true,
    system: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    async function checkAuthorization() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .in("role", ["Admin", "Site Owner"])

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  // Organized by league sections
  const adminSections: AdminSection[] = [
    {
      title: "NHL Management",
      description: "Teams, schedules, draft, and logos for the NHL league",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: <Trophy className="h-5 w-5" />,
      links: [
        {
          title: "Team Management",
          description: "Manage NHL teams and rosters",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/teams",
        },
        {
          title: "Schedule Management",
          description: "Manage NHL game schedule and results",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/schedule",
        },
        {
          title: "NHL Draft Management",
          description: "Manage NHL draft settings, order, and status",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/nhl-draft-management",
        },
        {
          title: "Team Logos",
          description: "Manage NHL team logos and branding",
          icon: <ImageIcon className="h-5 w-5" />,
          href: "/admin/team-logos",
        },
        {
          title: "Daily Recap",
          description: "Generate nightly recap for NHL teams",
          icon: <Newspaper className="h-5 w-5" />,
          href: "/admin/daily-recap",
        },
        {
          title: "Featured Games",
          description: "Manage featured NHL games on homepage",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/featured-games",
        },
      ],
    },
    {
      title: "AHL Management",
      description: "Teams, schedules, draft, and logos for the AHL league",
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      icon: <Trophy className="h-5 w-5" />,
      links: [
        {
          title: "AHL Teams Management",
          description: "Manage AHL teams and rosters",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/ahl-teams-management",
        },
        {
          title: "AHL Schedule Management",
          description: "Manage AHL game schedule and results",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/ahl-schedule-management",
        },
        {
          title: "AHL Draft Management",
          description: "Manage AHL draft settings, order, and status",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/ahl-draft-management",
        },
        {
          title: "AHL Team Logos",
          description: "Manage AHL team logos and branding",
          icon: <ImageIcon className="h-5 w-5" />,
          href: "/admin/ahl-team-logos",
        },
      ],
    },
    {
      title: "All-Star Management",
      description: "Teams and schedules for All-Star events",
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      icon: <Star className="h-5 w-5" />,
      links: [
        {
          title: "Allstar Team Management",
          description: "Manage MGALLSTAR teams and rosters",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/allstar-teams",
        },
        {
          title: "Allstar Schedule Management",
          description: "Manage MGALLSTAR game schedule and results",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/allstar-schedule",
        },
      ],
    },
    {
      title: "ECL Management",
      description: "Teams, schedules, logos, and recaps for the ECL league",
      color: "text-teal-600",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/30",
      icon: <Trophy className="h-5 w-5" />,
      links: [
        {
          title: "ECL Team Management",
          description: "Manage ECL teams and rosters",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/ecl-teams",
        },
        {
          title: "ECL Schedule Management",
          description: "Manage ECL game schedule and results",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/ecl-schedule",
        },
        {
          title: "ECL Team Logos",
          description: "Manage ECL team logos and branding",
          icon: <ImageIcon className="h-5 w-5" />,
          href: "/admin/ecl-team-logos",
        },
        {
          title: "ECL Daily Recap",
          description: "Generate daily recaps for ECL matches",
          icon: <Newspaper className="h-5 w-5" />,
          href: "/admin/ecl-daily-recap",
        },
      ],
    },
    {
      title: "League-Wide Operations",
      description: "Shared management across all leagues",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      icon: <Settings className="h-5 w-5" />,
      links: [
        {
          title: "Divisions & Conferences",
          description: "Manage team divisions and conferences for NHL and AHL",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/divisions-conferences",
        },
        {
          title: "Draft Picks Management",
          description: "Manage tradeable draft picks for NHL and AHL teams",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/draft-picks-management",
        },
        {
          title: "Weeks Management",
          description: "Manage week definitions for statistics filtering",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/weeks-management",
        },
        {
          title: "Update Current Season",
          description: "Change the active season for registrations",
          icon: <Clock className="h-5 w-5" />,
          href: "/admin/update-current-season",
        },
        {
          title: "Season Registrations",
          description: "Manage player season registrations",
          icon: <ClipboardList className="h-5 w-5" />,
          href: "/admin/registrations",
        },
        {
          title: "Team Availability",
          description: "View player availability and games played by week",
          icon: <Calendar className="h-5 w-5" />,
          href: "/admin/team-avail",
        },
        {
          title: "Bidding Recap",
          description: "View comprehensive bidding statistics and player bid history",
          icon: <DollarSign className="h-5 w-5" />,
          href: "/admin/bidding-recap",
        },
        {
          title: "Fine Management",
          description: "Issue and manage team fines for rule violations",
          icon: <DollarSign className="h-5 w-5" />,
          href: "/admin/fines",
        },
        {
          title: "Team of the Week",
          description: "Manage TOTW player cards for the homepage",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/team-of-the-week",
        },
        {
          title: "Awards Management",
          description: "Manage season awards and achievements",
          icon: <Trophy className="h-5 w-5" />,
          href: "/admin/awards",
        },
        {
          title: "Statistics Management",
          description: "Manage player and team statistics",
          icon: <BarChart3 className="h-5 w-5" />,
          href: "/admin/statistics",
        },
        {
          title: "EA Stats",
          description: "View EA Sports NHL player statistics",
          icon: <GameController className="h-5 w-5" />,
          href: "/admin/ea-stats",
        },
        {
          title: "EA Matches",
          description: "View EA Sports NHL match history",
          icon: <Activity className="h-5 w-5" />,
          href: "/admin/ea-matches",
        },
        {
          title: "Player Mappings",
          description: "Manage EA player to user mappings",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/player-mappings",
        },
        {
          title: "News Management",
          description: "Manage news articles and announcements",
          icon: <Newspaper className="h-5 w-5" />,
          href: "/admin/news",
        },
        {
          title: "Forum Management",
          description: "Manage forum categories and posts",
          icon: <MessageSquare className="h-5 w-5" />,
          href: "/admin/forum",
        },
        {
          title: "Manage Tokens",
          description: "Manage player tokens, redeemables, and redemption requests",
          icon: <Coins className="h-5 w-5" />,
          href: "/admin/tokens",
        },
      ],
    },
    {
      title: "User & Role Management",
      description: "User accounts, roles, bans, and activity",
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      icon: <Users className="h-5 w-5" />,
      links: [
        {
          title: "User Management",
          description: "Manage user accounts and roles",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/users",
        },
        {
          title: "Role Offers",
          description: "Assign Owner, GM, and AGM roles with automatic salary",
          icon: <UserCog className="h-5 w-5" />,
          href: "/admin/role-offers",
        },
        {
          title: "Player Releases",
          description: "Review and process player release requests from teams",
          icon: <UserX className="h-5 w-5" />,
          href: "/admin/player-releases",
        },
        {
          title: "Banned Users Management",
          description: "View and manage banned users, ban/unban functionality",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/banned-users",
        },
        {
          title: "Complete User Deletion",
          description: "Completely remove users from all systems",
          icon: <Trash2 className="h-5 w-5" />,
          href: "/admin/complete-user-deletion",
        },
        {
          title: "Activity Log",
          description: "View all admin and management actions across the league",
          icon: <Activity className="h-5 w-5" />,
          href: "/admin/activity-log",
        },
        {
          title: "User Account Manager",
          description: "Search, manage, and fix user account issues across all systems",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/user-account-manager",
        },
        {
          title: "User Diagnostics",
          description: "Diagnose and fix issues with user accounts, verification, and registration",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/user-diagnostics",
        },
      ],
    },
    {
      title: "System & Technical",
      description: "Database, auth, bot config, and debugging tools",
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      icon: <Wrench className="h-5 w-5" />,
      links: [
        {
          title: "System Settings",
          description: "Configure system settings",
          icon: <Settings className="h-5 w-5" />,
          href: "/admin/settings",
        },
        {
          title: "MGHL Bot",
          description: "Manage Discord bot integration, roles, and Twitch streaming",
          icon: <Bot className="h-5 w-5" />,
          href: "/admin/lmshl-bot",
        },
        {
          title: "Setup Bot Config",
          description: "Initialize and configure Discord bot settings",
          icon: <Settings className="h-5 w-5" />,
          href: "/admin/setup-bot-config",
        },
        {
          title: "Discord Debug",
          description: "Debug Discord bot integration and role assignments",
          icon: <Bot className="h-5 w-5" />,
          href: "/admin/discord-debug",
        },
        {
          title: "Email Verification",
          description: "Manage email verification",
          icon: <ShieldCheck className="h-5 w-5" />,
          href: "/admin/email-verification",
        },
        {
          title: "Password Reset",
          description: "Reset user passwords directly",
          icon: <ShieldCheck className="h-5 w-5" />,
          href: "/admin/password-reset",
        },
        {
          title: "Reset User Password",
          description: "Reset a user&apos;s password by email address",
          icon: <ShieldCheck className="h-5 w-5" />,
          href: "/admin/reset-user-password",
        },
        {
          title: "Auth to Database Sync",
          description: "Sync users from Supabase Auth to database tables",
          icon: <RefreshCw className="h-5 w-5" />,
          href: "/admin/sync-auth-database",
        },
        {
          title: "Orphaned Auth Users",
          description: "Find and fix users that exist in Auth but not in database",
          icon: <Users className="h-5 w-5" />,
          href: "/admin/orphaned-auth-users",
        },
        {
          title: "Sync Missing Users",
          description: "Sync missing users between auth and database",
          icon: <RefreshCw className="h-5 w-5" />,
          href: "/admin/sync-missing-users",
        },
        {
          title: "Fix User Constraints",
          description: "Fix console and gamer tag constraint violations for user sync",
          icon: <ShieldCheck className="h-5 w-5" />,
          href: "/admin/fix-user-constraints",
        },
        {
          title: "Fix Console Values",
          description: "Fix invalid console values for users that failed to sync",
          icon: <GameController className="h-5 w-5" />,
          href: "/admin/fix-console-values",
        },
        {
          title: "Fix Waiver Tables",
          description: "Fix waiver priority and claims tables structure",
          icon: <Database className="h-5 w-5" />,
          href: "/admin/fix-waiver-tables",
        },
        {
          title: "Check Auth User",
          description: "Check if a user exists in all required database tables and Auth",
          icon: <Search className="h-5 w-5" />,
          href: "/admin/check-auth-user",
        },
        {
          title: "Repair Auth Users",
          description: "Fix users who have database records but are missing from Supabase Auth",
          icon: <UserPlus className="h-5 w-5" />,
          href: "/admin/repair-auth-users",
        },
        {
          title: "Database Structure",
          description: "Explore database tables and structure",
          icon: <Database className="h-5 w-5" />,
          href: "/admin/database-structure",
        },
        {
          title: "RBAC Debug",
          description: "Debug role-based access control",
          icon: <ShieldCheck className="h-5 w-5" />,
          href: "/admin/rbac-debug",
        },
      ],
    },
  ]

  const sectionKeys = ["nhl", "ahl", "allstar", "ecl", "general", "users", "system"]

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allExpanded = Object.values(expandedSections).every((v) => v)
              const newState: Record<string, boolean> = {}
              sectionKeys.forEach((key) => {
                newState[key] = !allExpanded
              })
              setExpandedSections(newState)
            }}
            className="text-xs"
          >
            {Object.values(expandedSections).every((v) => v) ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {adminSections.map((section, sectionIndex) => {
          const sectionKey = sectionKeys[sectionIndex]
          const isExpanded = expandedSections[sectionKey]

          return (
            <div
              key={section.title}
              className={cn("rounded-lg border", section.borderColor, section.bgColor)}
            >
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-background/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-md", section.bgColor, section.color)}>
                    {section.icon}
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-semibold", section.color)}>{section.title}</h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    {section.links.length} items
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {section.links.map((link) => (
                      <Link key={link.href} href={link.href} className="block">
                        <Card className="h-full hover:bg-background/80 transition-colors border-background/50 hover:border-foreground/20">
                          <CardHeader className="flex flex-row items-start gap-3 p-3 pb-2">
                            <div className={cn("p-1.5 rounded", section.bgColor, section.color)}>
                              {link.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium leading-tight">
                                {link.title}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <CardDescription className="text-xs line-clamp-2">
                              {link.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">System Diagnostics</h2>
        <AdminDiagnostics />
      </div>
    </div>
  )
}
