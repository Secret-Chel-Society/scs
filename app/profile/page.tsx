"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Trophy, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Shield, 
  Star, 
  Medal, 
  Crown, 
  Target, 
  Zap, 
  Activity, 
  TrendingUp, 
  Award, 
  BookOpen, 
  FileText, 
  Globe, 
  Camera, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Clock, 
  Settings, 
  Database, 
  Users,
  Edit,
  Eye,
  Settings as SettingsIcon,
  DollarSign,
  LayoutDashboard
} from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    async function loadUserProfile() {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // If no session, redirect to login
          router.push("/login")
          return
        }

        setUser(session.user)

        // Load additional user data
        const { data: profileData, error } = await supabase
          .from("players")
          .select(`
            *,
            team:teams(*),
            user:users(*)
          `)
          .eq("user_id", session.user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error("Error loading profile:", error)
        } else {
          setUserData(profileData)
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [router, supabase])

  // Show loading state while checking session and loading data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = userData?.gamer_tag_id || user.email?.split("@")[0] || "Player"
  const teamName = userData?.team?.name || "Free Agent"
  const teamLogo = userData?.team?.logo_url
  const position = userData?.primary_position || "N/A"
  const salary = userData?.salary || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-ice-blue-500 via-rink-blue-600 to-ice-blue-700 rounded-2xl shadow-lg flex items-center justify-center">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 dark:from-ice-blue-400 dark:to-rink-blue-500 bg-clip-text text-transparent">
                  {displayName}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                  Player Profile & Statistics
                </p>
              </div>
            </div>
            <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Profile Overview Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {position}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Primary Position
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  {teamLogo && (
                    <div className="h-5 w-5 sm:h-6 sm:w-6 relative">
                      <Image src={teamLogo || "/placeholder.svg"} alt={teamName} fill className="object-contain" />
                    </div>
                  )}
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {teamName}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {teamName === "Free Agent" ? "No Team" : "Current Team"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  ${salary.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {salary > 0 ? "Current Contract" : "No Contract"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Profile Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Player Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Gamer Tag</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{displayName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Position</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{position}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Team Status</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{teamName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Contract Value</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">${salary.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/30 dark:to-assist-green-800/30 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => router.push("/settings")} 
                    className="w-full bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white hover:scale-105 transition-all duration-200"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    onClick={() => router.push("/dashboard")} 
                    variant="outline"
                    className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push("/players/" + user?.id)} 
                    variant="outline"
                    className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}