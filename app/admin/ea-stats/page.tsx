"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Search, GamepadIcon as GameController, BarChart3, TrendingUp, Users, Target, Zap, Shield, Database, Trophy, Star, Medal, Crown, Activity } from "lucide-react"

export default function EAStatsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

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
            description: "You don't have permission to access this page.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        loadTeams()
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

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase.from("teams").select("*").order("name").not("ea_club_id", "is", null)

      if (error) {
        throw error
      }

      setTeams(data || [])
    } catch (error: any) {
      console.error("Error loading teams:", error)
      toast({
        title: "Error",
        description: "Failed to load teams with EA Club IDs",
        variant: "destructive",
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/ea/search-teams?clubName=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error("Failed to search EA teams")
      }

      const data = await response.json()

      if (data.clubs && data.clubs.length > 0) {
        // Navigate to the first result's stats page
        router.push(`/admin/ea-stats/${data.clubs[0].clubId}`)
      } else {
        toast({
          title: "No teams found",
          description: "No EA teams found with that name",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error searching EA teams:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while searching",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ice-blue-600 mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">Loading EA Stats</h1>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Analyzing EA Sports NHL performance data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
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
              EA Sports NHL Statistics
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Access comprehensive EA Sports NHL performance analytics and statistics for all registered teams. 
              Analyze player performance, team metrics, and competitive insights.
            </p>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    Analytics
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Performance
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    Trends
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Analysis
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    {teams.length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Active Teams
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <GameController className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    EA
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Integration
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Enhanced Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
              Team Statistics Center
            </h2>
            <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl mx-auto">
              Search for EA Sports teams or browse registered teams to view their detailed performance statistics and analytics.
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-hockey-silver-400 z-10" />
              <Input
                placeholder="Search EA team by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="hockey-search pl-12 pr-6 py-4 text-lg border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-championship hover:scale-105 transition-all duration-200"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teams.map((team, index) => (
            <Card 
              key={team.id} 
              className="hockey-card hockey-card-hover h-full overflow-hidden border-2 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-500 hover:scale-105"
            >
              <CardContent className="p-0">
                {/* Enhanced Team Header */}
                <div className="relative h-32 bg-gradient-to-br from-ice-blue-100 via-white to-rink-blue-100 dark:from-ice-blue-900/30 dark:via-hockey-silver-800 dark:to-rink-blue-900/30 flex items-center justify-center p-6 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-hockey-pattern opacity-10"></div>
                  
                  {/* Team Icon */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Team Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-hockey-silver-900/80 to-transparent p-4">
                    <h3 className="text-lg font-bold text-white text-center drop-shadow-lg">
                      {team.name}
                    </h3>
                  </div>
                </div>

                {/* Enhanced Team Info */}
                <div className="p-6 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-800 dark:to-ice-blue-900/20">
                  {/* EA Club ID Badge */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-lg border border-ice-blue-300 dark:border-ice-blue-600">
                      <Database className="h-4 w-4 text-ice-blue-600" />
                      <span className="text-sm font-mono text-ice-blue-800 dark:text-ice-blue-200">
                        {team.ea_club_id}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced View Stats Button */}
                  <div className="text-center">
                    <Button
                      onClick={() => router.push(`/admin/ea-stats/${team.ea_club_id}`)}
                      className="w-full btn-championship hover:scale-105 transition-all duration-200"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Stats
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-10 w-10 text-hockey-silver-500 dark:text-hockey-silver-400" />
                </div>
                <h3 className="text-2xl font-bold text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">
                  No EA Teams Found
                </h3>
                <p className="text-hockey-silver-500 dark:text-hockey-silver-500 text-lg mb-6">
                  No teams with EA Club IDs found. Add EA Club IDs to teams in the Team Management page to view their statistics.
                </p>
                <Button 
                  onClick={() => router.push('/admin/teams')}
                  className="btn-ice hover:scale-105 transition-all duration-200"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
