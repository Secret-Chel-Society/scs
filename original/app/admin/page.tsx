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
  GamepadIcon as GameController,
  Activity,
  ClipboardList,
  Bot,
  RefreshCw,
  MessageSquare,
  Trash2,
  Clock,
  DollarSign,
  Coins,
} from "lucide-react"
import AdminDiagnostics from "@/components/admin/admin-diagnostics"

export default function AdminDashboardPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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
          .eq("role", "Admin")

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

  const adminLinks = [
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/users",
    },
    {
      title: "Complete User Deletion",
      description: "Completely remove users from all systems",
      icon: <Trash2 className="h-6 w-6" />,
      href: "/admin/complete-user-deletion",
    },
    {
      title: "Banned Users Management",
      description: "View and manage banned users, ban/unban functionality",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/banned-users",
    },
    {
      title: "Team Management",
      description: "Manage teams and rosters",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/teams",
    },
    {
      title: "Schedule Management",
      description: "Manage game schedule and results",
      icon: <Calendar className="h-6 w-6" />,
      href: "/admin/schedule",
    },
    {
      title: "Update Current Season",
      description: "Change the active season for registrations",
      icon: <Clock className="h-6 w-6" />,
      href: "/admin/update-current-season",
    },
    {
      title: "Season Registrations",
      description: "Manage player season registrations",
      icon: <ClipboardList className="h-6 w-6" />,
      href: "/admin/registrations",
    },
    {
      title: "Team Availability",
      description: "View player availability and games played by week",
      icon: <Calendar className="h-6 w-6" />,
      href: "/admin/team-avail",
    },
    {
      title: "Bidding Recap",
      description: "View comprehensive bidding statistics and player bid history",
      icon: <DollarSign className="h-6 w-6" />,
      href: "/admin/bidding-recap",
    },
    {
      title: "Daily Recap",
      description: "Generate nightly recap for all teams based on recent matches",
      icon: <Newspaper className="h-6 w-6" />,
      href: "/admin/daily-recap",
    },
    {
      title: "Manage Tokens",
      description: "Manage player tokens, redeemables, and redemption requests",
      icon: <Coins className="h-6 w-6" />,
      href: "/admin/tokens",
    },
    {
      title: "News Management",
      description: "Manage news articles and announcements",
      icon: <Newspaper className="h-6 w-6" />,
      href: "/admin/news",
    },
    {
      title: "Statistics Management",
      description: "Manage player and team statistics",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/admin/statistics",
    },
    {
      title: "EA Stats",
      description: "View EA Sports NHL player statistics",
      icon: <GameController className="h-6 w-6" />,
      href: "/admin/ea-stats",
    },
    {
      title: "EA Matches",
      description: "View EA Sports NHL match history",
      icon: <Activity className="h-6 w-6" />,
      href: "/admin/ea-matches",
    },
    {
      title: "Awards Management",
      description: "Manage season awards and achievements",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/awards",
    },
    {
      title: "Photo Gallery",
      description: "Manage photos and media",
      icon: <ImageIcon className="h-6 w-6" />,
      href: "/admin/photos",
    },
    {
      title: "Team Logos",
      description: "Manage team logos and branding",
      icon: <ImageIcon className="h-6 w-6" />,
      href: "/admin/team-logos",
    },
    {
      title: "Email Verification",
      description: "Manage email verification",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/email-verification",
    },
    {
      title: "Password Reset",
      description: "Reset user passwords directly",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/password-reset",
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/settings",
    },
    {
      title: "User Diagnostics",
      description: "Diagnose and fix issues with user accounts, verification, and registration.",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/user-diagnostics",
    },
    {
      title: "User Account Manager",
      description: "Search, manage, and fix user account issues across all systems",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/user-account-manager",
    },
    {
      title: "MGHL Bot",
      description: "Manage Discord bot integration, roles, and Twitch streaming",
      icon: <Bot className="h-6 w-6" />,
      href: "/admin/mghl-bot",
    },
    {
      title: "Setup Bot Config",
      description: "Initialize and configure Discord bot settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/setup-bot-config",
    },
    {
      title: "Reset User Password",
      description: "Reset a user's password by email address.",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/reset-user-password",
    },
    {
      title: "Auth to Database Sync",
      description: "Sync users from Supabase Auth to database tables",
      icon: <RefreshCw className="h-6 w-6" />,
      href: "/admin/sync-auth-database",
    },
    {
      title: "Orphaned Auth Users",
      description: "Find and fix users from old auth system that exist in Auth but not in database",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/orphaned-auth-users",
    },
    {
      title: "Sync Missing Users",
      description: "Sync missing users between auth and database",
      icon: <RefreshCw className="h-6 w-6" />,
      href: "/admin/sync-missing-users",
    },
    {
      title: "Fix User Constraints",
      description: "Fix console and gamer tag constraint violations for user sync",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/fix-user-constraints",
    },
    {
      title: "Fix Console Values",
      description: "Fix invalid console values for users that failed to sync",
      icon: <GameController className="h-6 w-6" />,
      href: "/admin/fix-console-values",
    },
    {
      title: "Fix Waiver Tables",
      description: "Fix waiver priority and claims tables structure",
      icon: <Database className="h-6 w-6" />,
      href: "/admin/fix-waiver-tables",
    },
    {
      title: "Discord Debug",
      description: "Debug Discord bot integration and role assignments",
      icon: <Bot className="h-6 w-6" />,
      href: "/admin/discord-debug",
    },
    {
      title: "Forum Management",
      description: "Manage forum categories and posts",
      icon: <MessageSquare className="h-6 w-6" />,
      href: "/admin/forum",
    },
    {
      title: "Featured Games",
      description: "Manage featured games on homepage",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/featured-games",
    },
    {
      title: "Player Mappings",
      description: "Manage EA player to user mappings",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/player-mappings",
    },
    {
      title: "Database Structure",
      description: "Explore database tables and structure",
      icon: <Database className="h-6 w-6" />,
      href: "/admin/database-structure",
    },
    {
      title: "RBAC Debug",
      description: "Debug role-based access control",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/rbac-debug",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {adminLinks.map((link, index) => (
          <Link key={index} href={link.href} className="block">
            <Card className="h-full hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <div className="text-primary">{link.icon}</div>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">System Diagnostics</h2>
        <AdminDiagnostics />
      </div>
    </div>
  )
}
