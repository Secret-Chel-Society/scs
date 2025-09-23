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
  Crown,
  Flame,
  Shield,
  Rocket,
  Zap,
  Target,
  TrendingUp,
  Award,
  Medal,
  Star,
  ArrowRight,
  Lock,
  Eye,
  Cog,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Loading Admin Dashboard...</p>
            </div>
          </div>
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
      category: "user",
      color: "ice-blue"
    },
    {
      title: "Complete User Deletion",
      description: "Completely remove users from all systems",
      icon: <Trash2 className="h-6 w-6" />,
      href: "/admin/complete-user-deletion",
      category: "user",
      color: "goal-red"
    },
    {
      title: "Banned Users Management",
      description: "View and manage banned users, ban/unban functionality",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/banned-users",
      category: "user",
      color: "goal-red"
    },
    {
      title: "Team Management",
      description: "Manage teams and rosters",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/teams",
      category: "team",
      color: "assist-green"
    },
    {
      title: "Schedule Management",
      description: "Manage game schedule and results",
      icon: <Calendar className="h-6 w-6" />,
      href: "/admin/schedule",
      category: "game",
      color: "rink-blue"
    },
    {
      title: "Update Current Season",
      description: "Change the active season for registrations",
      icon: <Clock className="h-6 w-6" />,
      href: "/admin/update-current-season",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Season Registrations",
      description: "Manage player season registrations",
      icon: <ClipboardList className="h-6 w-6" />,
      href: "/admin/registrations",
      category: "user",
      color: "ice-blue"
    },
    {
      title: "Team Availability",
      description: "View player availability and games played by week",
      icon: <Calendar className="h-6 w-6" />,
      href: "/admin/team-avail",
      category: "team",
      color: "assist-green"
    },
    {
      title: "Bidding Recap",
      description: "View comprehensive bidding statistics and player bid history",
      icon: <DollarSign className="h-6 w-6" />,
      href: "/admin/bidding-recap",
      category: "finance",
      color: "goal-red"
    },
    {
      title: "Daily Recap",
      description: "Generate nightly recap for all teams based on recent matches",
      icon: <Newspaper className="h-6 w-6" />,
      href: "/admin/daily-recap",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Manage Tokens",
      description: "Manage player tokens, redeemables, and redemption requests",
      icon: <Coins className="h-6 w-6" />,
      href: "/admin/tokens",
      category: "finance",
      color: "goal-red"
    },
    {
      title: "News Management",
      description: "Manage news articles and announcements",
      icon: <Newspaper className="h-6 w-6" />,
      href: "/admin/news",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Statistics Management",
      description: "Manage player and team statistics",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/admin/statistics",
      category: "data",
      color: "assist-green"
    },
    {
      title: "EA Stats",
      description: "View EA Sports NHL player statistics",
      icon: <GameController className="h-6 w-6" />,
      href: "/admin/ea-stats",
      category: "data",
      color: "assist-green"
    },
    {
      title: "EA Matches",
      description: "View EA Sports NHL match history",
      icon: <Activity className="h-6 w-6" />,
      href: "/admin/ea-matches",
      category: "data",
      color: "assist-green"
    },
    {
      title: "Awards Management",
      description: "Manage season awards and achievements",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/awards",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Photo Gallery",
      description: "Manage photos and media",
      icon: <ImageIcon className="h-6 w-6" />,
      href: "/admin/photos",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Team Logos",
      description: "Manage team logos and branding",
      icon: <ImageIcon className="h-6 w-6" />,
      href: "/admin/team-logos",
      category: "team",
      color: "assist-green"
    },
    {
      title: "Email Verification",
      description: "Manage email verification",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/email-verification",
      category: "security",
      color: "hockey-silver"
    },
    {
      title: "Password Reset",
      description: "Reset user passwords directly",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/password-reset",
      category: "security",
      color: "hockey-silver"
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/settings",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "User Diagnostics",
      description: "Diagnose and fix issues with user accounts, verification, and registration.",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/user-diagnostics",
      category: "user",
      color: "ice-blue"
    },
    {
      title: "User Account Manager",
      description: "Search, manage, and fix user account issues across all systems",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/user-account-manager",
      category: "user",
      color: "ice-blue"
    },
    {
      title: "SCS Bot",
      description: "Manage Discord bot integration, roles, and Twitch streaming",
      icon: <Bot className="h-6 w-6" />,
      href: "/admin/scs-bot",
      category: "integration",
      color: "rink-blue"
    },
    {
      title: "Setup Bot Config",
      description: "Initialize and configure Discord bot settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/setup-bot-config",
      category: "integration",
      color: "rink-blue"
    },
    {
      title: "Reset User Password",
      description: "Reset a user's password by email address.",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/reset-user-password",
      category: "security",
      color: "hockey-silver"
    },
    {
      title: "Auth to Database Sync",
      description: "Sync users from Supabase Auth to database tables",
      icon: <RefreshCw className="h-6 w-6" />,
      href: "/admin/sync-auth-database",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Orphaned Auth Users",
      description: "Find and fix users from old auth system that exist in Auth but not in database",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/orphaned-auth-users",
      category: "user",
      color: "ice-blue"
    },
    {
      title: "Sync Missing Users",
      description: "Sync missing users between auth and database",
      icon: <RefreshCw className="h-6 w-6" />,
      href: "/admin/sync-missing-users",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Fix User Constraints",
      description: "Fix console and gamer tag constraint violations for user sync",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/fix-user-constraints",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Fix Console Values",
      description: "Fix invalid console values for users that failed to sync",
      icon: <GameController className="h-6 w-6" />,
      href: "/admin/fix-console-values",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Role Sync Fix",
      description: "Fix role synchronization between user_roles and players tables",
      icon: <Shield className="h-6 w-6" />,
      href: "/admin/role-sync",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "Discord Debug",
      description: "Debug Discord bot integration and role assignments",
      icon: <Bot className="h-6 w-6" />,
      href: "/admin/discord-debug",
      category: "integration",
      color: "rink-blue"
    },
    {
      title: "Forum Management",
      description: "Manage forum categories and posts",
      icon: <MessageSquare className="h-6 w-6" />,
      href: "/admin/forum",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Featured Games",
      description: "Manage featured games on homepage",
      icon: <Trophy className="h-6 w-6" />,
      href: "/admin/featured-games",
      category: "content",
      color: "rink-blue"
    },
    {
      title: "Player Mappings",
      description: "Manage EA player to user mappings",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/player-mappings",
      category: "data",
      color: "assist-green"
    },
    {
      title: "Database Structure",
      description: "Explore database tables and structure",
      icon: <Database className="h-6 w-6" />,
      href: "/admin/database-structure",
      category: "system",
      color: "hockey-silver"
    },
    {
      title: "RBAC Debug",
      description: "Debug role-based access control",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/admin/rbac-debug",
      category: "security",
      color: "hockey-silver"
    },
  ]

  const categories = {
    user: { name: "User Management", icon: <Users className="h-5 w-5" />, color: "ice-blue" },
    team: { name: "Team Operations", icon: <Trophy className="h-5 w-5" />, color: "assist-green" },
    game: { name: "Game Management", icon: <GameController className="h-5 w-5" />, color: "rink-blue" },
    system: { name: "System Tools", icon: <Settings className="h-5 w-5" />, color: "hockey-silver" },
    finance: { name: "Financial Tools", icon: <DollarSign className="h-5 w-5" />, color: "goal-red" },
    content: { name: "Content Management", icon: <Newspaper className="h-5 w-5" />, color: "rink-blue" },
    data: { name: "Data & Statistics", icon: <BarChart3 className="h-5 w-5" />, color: "assist-green" },
    security: { name: "Security & Access", icon: <Shield className="h-5 w-5" />, color: "hockey-silver" },
    integration: { name: "Integrations", icon: <Bot className="h-5 w-5" />, color: "rink-blue" },
  }

  const groupedLinks = adminLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = []
    }
    acc[link.category].push(link)
    return acc
  }, {} as Record<string, typeof adminLinks>)

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'ice-blue': 'from-ice-blue-500 to-rink-blue-600',
      'rink-blue': 'from-rink-blue-500 to-ice-blue-600',
      'assist-green': 'from-assist-green-500 to-assist-green-600',
      'goal-red': 'from-goal-red-500 to-goal-red-600',
      'hockey-silver': 'from-hockey-silver-500 to-hockey-silver-600'
    }
    return colorMap[color] || 'from-ice-blue-500 to-rink-blue-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              Admin Dashboard
            </h1>
            <p className="hockey-subtitle mx-auto mb-8">
              Complete control center for managing SCS operations, users, teams, and system configurations
            </p>
            
            {/* Admin Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white px-6 py-3 rounded-full shadow-lg shadow-assist-green-500/25 border-2 border-white dark:border-hockey-silver-800">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Administrator Access Granted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Category-based Admin Tools */}
        <div className="space-y-12">
          {Object.entries(groupedLinks).map(([categoryKey, links]) => {
            const category = categories[categoryKey as keyof typeof categories]
            return (
              <div key={categoryKey} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(category.color)} rounded-xl flex items-center justify-center shadow-lg`}>
                    <div className="text-white">
                      {category.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      {category.name}
                    </h2>
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      {links.length} tool{links.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {links.map((link, index) => (
                    <Link key={index} href={link.href} className="block group">
                      <Card className="hockey-card hockey-card-hover h-full group-hover:scale-105 transition-all duration-300 cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 relative">
                          <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400 transition-colors duration-200">
                            {link.title}
                          </CardTitle>
                          <div className={`text-white bg-gradient-to-r ${getColorClasses(link.color)} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {link.icon}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base leading-relaxed mb-4">
                            {link.description}
                          </CardDescription>
                          
                          {/* Action Indicator */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 font-medium group-hover:text-ice-blue-700 dark:group-hover:text-ice-blue-300 transition-colors duration-200">
                              <span>Access Tool</span>
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </div>
                            
                            {/* Category Badge */}
                            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getColorClasses(link.color)} bg-opacity-10 text-${link.color}-700 dark:text-${link.color}-300 border border-${link.color}-200 dark:border-${link.color}-700`}>
                              {category.name}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* System Diagnostics Section */}
        <div className="mt-20">
          <Card className="hockey-card hockey-card-hover group">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800/30 dark:to-ice-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <CardTitle className="flex items-center gap-3 text-2xl relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-ice-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                System Diagnostics & Monitoring
              </CardTitle>
              <CardDescription className="text-lg relative z-10">
                Real-time system health monitoring and diagnostic tools for administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <AdminDiagnostics />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
