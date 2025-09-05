"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Check, X, Star, StarOff, AlertCircle, RefreshCw, Trophy, Medal, Target, Zap, Shield, Database, Activity, TrendingUp, Users, Settings, BarChart3, Clock, Calendar, FileText, BookOpen, Globe, Publish, AlertTriangle, CheckCircle, Edit, Save, Award, Crown, Gamepad2, Play, Pause, Stop, Eye, EyeOff, Filter, Search, Download, Upload, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminFeaturedGamesPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dateColumnName, setDateColumnName] = useState<string>("match_date")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<"pending" | "success" | "error" | null>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  // Check if user is admin
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

      // Determine the date column name
      await checkMatchesTableStructure()

      // Check if the featured column exists
      await checkFeaturedColumn()

      // Fetch matches
      await fetchMatches()
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

  // Check matches table structure to determine date column name
  const checkMatchesTableStructure = async () => {
    try {
      // Try to get a single match to check the structure
      const { data, error } = await supabase.from("matches").select("*").limit(1)

      if (error) {
        console.error("Error checking matches table:", error)
        return
      }

      // Check if the table has a date or match_date column
      if (data && data.length > 0) {
        const match = data[0]
        if ("date" in match) {
          setDateColumnName("date")
        } else if ("match_date" in match) {
          setDateColumnName("match_date")
        }
      }
    } catch (error) {
      console.error("Error checking matches table structure:", error)
    }
  }

  useEffect(() => {
    checkAuthorization()
  }, [supabase, session, toast, router])

  // Set up real-time subscription for matches table
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: 'featured=is.not.null'
        },
        (payload) => {
          console.log('Real-time update received:', payload)
          // Update the local state with the new data
          setMatches(prevMatches => 
            prevMatches.map(match => 
              match.id === payload.new.id 
                ? { ...match, featured: payload.new.featured }
                : match
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin])

  // Check if featured column exists and test permissions
  const checkFeaturedColumn = async () => {
    setMigrationStatus("pending")
    setMigrationError(null)
    try {
      // Test if we can query the featured column
      const { data, error } = await supabase
        .from("matches")
        .select("id, featured")
        .limit(1)

      if (error) {
        console.error("Column check error:", error)
        setMigrationStatus("error")
        setMigrationError(`The 'featured' column doesn't exist: ${error.message}`)
        return false
      }

      // Test if we can update the featured column (permission check)
      if (data && data.length > 0) {
        const testMatch = data[0]
        const { error: updateTestError } = await supabase
          .from("matches")
          .update({ featured: testMatch.featured }) // Set to same value to test permissions
          .eq("id", testMatch.id)

        if (updateTestError) {
          console.error("Update permission test failed:", updateTestError)
          setMigrationStatus("error")
          setMigrationError(`Update permissions issue: ${updateTestError.message}`)
          return false
        }
      }

      setMigrationStatus("success")
      return true
    } catch (error: any) {
      console.error("Column check failed:", error)
      setMigrationStatus("error")
      setMigrationError(error.message)
      return false
    }
  }

  // Retry column check and reload
  const retryMigration = async () => {
    const success = await checkFeaturedColumn()
    if (success) {
      await fetchMatches()
    }
  }

  // Fetch matches
  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          ${dateColumnName},
          status,
          featured,
          home_team:teams!home_team_id(id, name, logo_url),
          away_team:teams!away_team_id(id, name, logo_url)
        `)
        .order(dateColumnName, { ascending: true })

      if (error) {
        if (error.message.includes("column") && error.message.includes("featured")) {
          // Column doesn't exist - set error state
          setMigrationStatus("error")
          setMigrationError(`The 'featured' column doesn't exist: ${error.message}`)
          return
        }
        throw error
      }
      setMatches(data || [])
    } catch (error: any) {
      console.error("Error fetching matches:", error)
      toast({
        title: "Error",
        description: "Failed to load matches: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Toggle featured status with immediate UI update
  const toggleFeatured = async (matchId: string, currentStatus: boolean) => {
    setUpdatingId(matchId)
    
    // Immediately update the local state for instant UI feedback
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === matchId 
          ? { ...match, featured: !currentStatus }
          : match
      )
    )

    try {
      console.log(`Updating match ${matchId} featured status from ${currentStatus} to ${!currentStatus}`)
      
      // Update the featured status using standard Supabase update
      const { data, error: updateError } = await supabase
        .from("matches")
        .update({ featured: !currentStatus })
        .eq("id", matchId)
        .select()

      if (updateError) {
        console.error('Update error:', updateError)
        // Revert the local state if the update failed
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match.id === matchId 
              ? { ...match, featured: currentStatus }
              : match
          )
        )
        throw new Error(`Failed to update: ${updateError.message}`)
      }

      console.log('Update successful:', data)

      toast({
        title: currentStatus ? "Match unfeatured" : "Match featured",
        description: currentStatus
          ? "The match has been removed from featured matches."
          : "The match has been added to featured matches.",
      })

      // Optional: Refresh matches to ensure data consistency (but UI is already updated)
      // Uncomment the line below if you want to refresh from database after update
      // setTimeout(() => fetchMatches(), 1000)
    } catch (error: any) {
      console.error("Error toggling featured status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-200 to-rink-blue-200 dark:from-ice-blue-800 dark:to-rink-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Gamepad2 className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
              Loading Featured Games
            </h3>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
              Initializing featured games management interface...
            </p>
            <div className="mt-6">
              <div className="animate-spin h-8 w-8 border-4 border-ice-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (migrationStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h1 className="hockey-title mb-6">Featured Games Management</h1>
          </div>
          
          <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden max-w-2xl mx-auto">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-goal-red-200 to-assist-green-200 dark:from-goal-red-800 dark:to-assist-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-goal-red-600 dark:text-goal-red-400" />
              </div>
              <h3 className="text-xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                Database Error
              </h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">
                {migrationError || "Failed to create or access the 'featured' column in the matches table."}
              </p>
              <Button 
                onClick={retryMigration} 
                className="btn-championship hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Migration
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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
              Featured Games Management
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Manage featured games and highlight important matches for the league. 
              Control which games are prominently displayed on the home page to showcase key matchups.
            </p>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {matches.length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Total Games
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    {matches.filter(m => m.featured).length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Featured Games
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    Live
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Management
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    Homepage
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Visibility
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
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
            Featured Games Control Center
          </h2>
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto">
            Manage which games are featured on the home page. Featured games will be displayed prominently 
            and shown in order of their scheduled date to highlight key matchups.
          </p>
        </div>

        {/* Enhanced Alert */}
        <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">About Featured Games</h3>
                <p className="text-ice-blue-100">
                  Featured games will be displayed prominently on the home page. You can feature multiple games, and they will
                  be shown in order of their scheduled date.
                </p>
              </div>
            </div>
          </div>
        </div>

      {matches.length === 0 ? (
        <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-200 to-rink-blue-200 dark:from-ice-blue-800 dark:to-rink-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
              No Matches Found
            </h3>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
              There are currently no matches available to feature.
            </p>
          </div>
        </div>
      ) : (
        <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <div className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Featured Games Management</h3>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-hockey-silver-50 dark:bg-hockey-silver-800">
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Date</TableHead>
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Home Team</TableHead>
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Away Team</TableHead>
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Score</TableHead>
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Status</TableHead>
                <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Featured</TableHead>
                <TableHead className="text-right text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match, index) => (
                <TableRow 
                  key={match.id} 
                  className={`${match.featured ? "bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20" : ""} ${index % 2 === 0 ? "bg-white dark:bg-hockey-silver-900" : "bg-hockey-silver-50 dark:bg-hockey-silver-800"} hover:bg-hockey-silver-100 dark:hover:bg-hockey-silver-700 transition-colors duration-200`}
                >
                  <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(match[dateColumnName]), "MMM d, yyyy")}</span>
                      <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        {format(new Date(match[dateColumnName]), "h:mm a")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                    {match.home_team?.name || "Unknown Team"}
                  </TableCell>
                  <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                    {match.away_team?.name || "Unknown Team"}
                  </TableCell>
                  <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">
                    {match.home_score !== null && match.away_score !== null
                      ? `${match.home_score} - ${match.away_score}`
                      : "TBD"}
                  </TableCell>
                  <TableCell>
                    <div className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                      match.status === 'completed' 
                        ? 'bg-assist-green-100 text-assist-green-800 dark:bg-assist-green-900 dark:text-assist-green-200'
                        : match.status === 'live'
                        ? 'bg-goal-red-100 text-goal-red-800 dark:bg-goal-red-900 dark:text-goal-red-200'
                        : 'bg-hockey-silver-100 text-hockey-silver-800 dark:bg-hockey-silver-700 dark:text-hockey-silver-200'
                    }`}>
                      {match.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    {match.featured ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-assist-green-600" />
                        <span className="text-sm text-assist-green-600 font-medium">Featured</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="h-5 w-5 text-hockey-silver-400" />
                        <span className="text-sm text-hockey-silver-400">Not Featured</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={match.featured ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFeatured(match.id, !!match.featured)}
                      disabled={updatingId === match.id}
                      className={`${
                        match.featured 
                          ? "border-2 border-hockey-silver-300 dark:border-hockey-silver-600 hover:border-hockey-silver-400 dark:hover:border-hockey-silver-500 text-hockey-silver-700 dark:text-hockey-silver-300" 
                          : "btn-championship"
                      } hover:scale-105 transition-all duration-200`}
                    >
                      {updatingId === match.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : match.featured ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Feature
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </div>
    </div>
  )
}
