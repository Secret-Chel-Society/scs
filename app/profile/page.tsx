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
  Settings as SettingsIcon
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
            <div className="w-24 h-24 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="hockey-title mb-6">
              {displayName}
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Player Profile & Statistics
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Overview */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Position
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {position}
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Primary Position
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>

            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Team
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    {teamLogo && (
                      <div className="h-8 w-8 relative">
                        <Image src={teamLogo || "/placeholder.svg"} alt={teamName} fill className="object-contain" />
                      </div>
                    )}
                    <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                      {teamName}
                    </div>
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {teamName === "Free Agent" ? "No Team" : "Current Team"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>

            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Salary
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    ${salary.toLocaleString()}
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {salary > 0 ? "Current Contract" : "No Contract"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => router.push("/settings")} 
              className="hockey-button hover:scale-105 transition-all duration-200"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              onClick={() => router.push("/dashboard")} 
              variant="outline"
              className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}