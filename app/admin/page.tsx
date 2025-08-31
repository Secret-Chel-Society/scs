"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
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
  Crown,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  UserCog,
  Key,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-pulse">
                <Crown className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white/70">Loading Admin Dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const adminCategories = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: <Users className="h-6 w-6" />,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      links: [
        {
          title: "User Management",
          description: "Manage user accounts and roles",
          href: "/admin/users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Complete User Deletion",
          description: "Completely remove users from all systems",
          href: "/admin/complete-user-deletion",
          icon: <Trash2 className="h-4 w-4" />,
        },
        {
          title: "Banned Users Management",
          description: "View and manage banned users, ban/unban functionality",
          href: "/admin/banned-users",
          icon: <AlertTriangle className="h-4 w-4" />,
        },
        {
          title: "User Diagnostics",
          description: "Diagnose and fix issues with user accounts",
          href: "/admin/user-diagnostics",
          icon: <Stethoscope className="h-4 w-4" />,
        },
        {
          title: "User Account Manager",
          description: "Search, manage, and fix user account issues",
          href: "/admin/user-account-manager",
          icon: <UserCog className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Team & Game Management",
      description: "Manage teams, schedules, and game operations",
      icon: <Trophy className="h-6 w-6" />,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      links: [
        {
          title: "Team Management",
          description: "Manage teams and rosters",
          href: "/admin/teams",
          icon: <Trophy className="h-4 w-4" />,
        },
        {
          title: "Schedule Management",
          description: "Manage game schedule and results",
          href: "/admin/schedule",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          title: "Team Availability",
          description: "View player availability and games played by week",
          href: "/admin/team-avail",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          title: "Featured Games",
          description: "Manage featured games on homepage",
          href: "/admin/featured-games",
          icon: <Target className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Season & Registration",
      description: "Manage seasons, registrations, and player data",
      icon: <ClipboardList className="h-6 w-6" />,
      color: "from-purple-500 to-violet-500",
      bgColor: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-500/30",
      links: [
        {
          title: "Update Current Season",
          description: "Change the active season for registrations",
          href: "/admin/update-current-season",
          icon: <Clock className="h-4 w-4" />,
        },
        {
          title: "Season Registrations",
          description: "Manage player season registrations",
          href: "/admin/registrations",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Player Mappings",
          description: "Manage EA player to user mappings",
          href: "/admin/player-mappings",
          icon: <Users className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Financial & Tokens",
      description: "Manage bidding, tokens, and financial systems",
      icon: <Coins className="h-6 w-6" />,
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-500/20 to-orange-500/20",
      borderColor: "border-yellow-500/30",
      links: [
        {
          title: "Bidding Recap",
          description: "View comprehensive bidding statistics",
          href: "/admin/bidding-recap",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Manage Tokens",
          description: "Manage player tokens and redemption requests",
          href: "/admin/tokens",
          icon: <Coins className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Content & Media",
      description: "Manage news, photos, and media content",
      icon: <Newspaper className="h-6 w-6" />,
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-500/20 to-rose-500/20",
      borderColor: "border-pink-500/30",
      links: [
        {
          title: "News Management",
          description: "Manage news articles and announcements",
          href: "/admin/news",
          icon: <Newspaper className="h-4 w-4" />,
        },
        {
          title: "Photo Gallery",
          description: "Manage photos and media",
          href: "/admin/photos",
          icon: <ImageIcon className="h-4 w-4" />,
        },
        {
          title: "Team Logos",
          description: "Manage team logos and branding",
          href: "/admin/team-logos",
          icon: <ImageIcon className="h-4 w-4" />,
        },
        {
          title: "Daily Recap",
          description: "Generate nightly recap for all teams",
          href: "/admin/daily-recap",
          icon: <Newspaper className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Statistics & Analytics",
      description: "Manage statistics, EA data, and analytics",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "from-indigo-500 to-blue-500",
      bgColor: "from-indigo-500/20 to-blue-500/20",
      borderColor: "border-indigo-500/30",
      links: [
        {
          title: "Statistics Management",
          description: "Manage player and team statistics",
          href: "/admin/statistics",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "EA Stats",
          description: "View EA Sports NHL player statistics",
          href: "/admin/ea-stats",
          icon: <GameController className="h-4 w-4" />,
        },
        {
          title: "EA Matches",
          description: "View EA Sports NHL match history",
          href: "/admin/ea-matches",
          icon: <Activity className="h-4 w-4" />,
        },
        {
          title: "Awards Management",
          description: "Manage season awards and achievements",
          href: "/admin/awards",
          icon: <Trophy className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Security & Access",
      description: "Manage security, verification, and access control",
      icon: <ShieldCheck className="h-6 w-6" />,
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-500/20 to-pink-500/20",
      borderColor: "border-red-500/30",
      links: [
        {
          title: "Email Verification",
          description: "Manage email verification",
          href: "/admin/email-verification",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          title: "Password Reset",
          description: "Reset user passwords directly",
          href: "/admin/password-reset",
          icon: <Key className="h-4 w-4" />,
        },
        {
          title: "Reset User Password",
          description: "Reset a user's password by email address",
          href: "/admin/reset-user-password",
          icon: <Key className="h-4 w-4" />,
        },
        {
          title: "RBAC Debug",
          description: "Debug role-based access control",
          href: "/admin/rbac-debug",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "System & Integration",
      description: "Manage system settings, bots, and integrations",
      icon: <Settings className="h-6 w-6" />,
      color: "from-gray-500 to-slate-500",
      bgColor: "from-gray-500/20 to-slate-500/20",
      borderColor: "border-gray-500/30",
      links: [
        {
          title: "System Settings",
          description: "Configure system settings",
          href: "/admin/settings",
          icon: <Settings className="h-4 w-4" />,
        },
        {
          title: "SCS Bot",
          description: "Manage Discord bot integration",
          href: "/admin/scs-bot",
          icon: <Bot className="h-4 w-4" />,
        },
        {
          title: "Setup Bot Config",
          description: "Initialize Discord bot settings",
          href: "/admin/setup-bot-config",
          icon: <Settings className="h-4 w-4" />,
        },
        {
          title: "Forum Management",
          description: "Manage forum categories and posts",
          href: "/admin/forum",
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          title: "Database Structure",
          description: "Explore database tables and structure",
          href: "/admin/database-structure",
          icon: <Database className="h-4 w-4" />,
        },
      ]
    },
    {
      title: "Data Sync & Migration",
      description: "Sync data, run migrations, and fix issues",
      icon: <RefreshCw className="h-6 w-6" />,
      color: "from-teal-500 to-cyan-500",
      bgColor: "from-teal-500/20 to-cyan-500/20",
      borderColor: "border-teal-500/30",
      links: [
        {
          title: "Auth to Database Sync",
          description: "Sync users from Supabase Auth to database",
          href: "/admin/sync-auth-database",
          icon: <RefreshCw className="h-4 w-4" />,
        },
        {
          title: "Sync Missing Users",
          description: "Sync missing users between auth and database",
          href: "/admin/sync-missing-users",
          icon: <RefreshCw className="h-4 w-4" />,
        },
        {
          title: "Orphaned Auth Users",
          description: "Find and fix orphaned auth users",
          href: "/admin/orphaned-auth-users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Fix User Constraints",
          description: "Fix console and gamer tag constraints",
          href: "/admin/fix-user-constraints",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          title: "Fix Console Values",
          description: "Fix invalid console values",
          href: "/admin/fix-console-values",
          icon: <GameController className="h-4 w-4" />,
        },
        {
          title: "Fix Waiver Tables",
          description: "Fix waiver priority and claims tables",
          href: "/admin/fix-waiver-tables",
          icon: <Database className="h-4 w-4" />,
        },
        {
          title: "Discord Debug",
          description: "Debug Discord bot integration",
          href: "/admin/discord-debug",
          icon: <Bot className="h-4 w-4" />,
        },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Crown className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-white/70 mt-1">Manage the SCS league system and operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Admin Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {adminCategories.map((category, index) => (
            <Card 
              key={index} 
              className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 bg-gradient-to-r ${category.bgColor} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`text-white ${category.icon.props.className}`} />
                  </div>
                  <CardTitle className="text-xl text-white">{category.title}</CardTitle>
                </div>
                <CardDescription className="text-white/70">{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.links.map((link, linkIndex) => (
                  <Link key={linkIndex} href={link.href} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors duration-200 group/link">
                      <div className={`p-1.5 bg-gradient-to-r ${category.bgColor} rounded-md group-hover/link:scale-110 transition-transform duration-200`}>
                        <div className="text-white">{link.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white group-hover/link:text-blue-300 transition-colors">
                          {link.title}
                        </div>
                        <div className="text-sm text-white/60 line-clamp-2">
                          {link.description}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover/link:opacity-100 transition-opacity duration-200">
                        <Zap className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Diagnostics */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">System Diagnostics</h2>
          </div>
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <AdminDiagnostics />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
