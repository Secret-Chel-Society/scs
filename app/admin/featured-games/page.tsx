"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Check, X, Star, StarOff, AlertCircle, RefreshCw, Trophy, Calendar, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

      // Run the migration to ensure the featured column exists
      await runMigration()

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

  // Run migration to ensure featured column exists
  const runMigration = async () => {
    setMigrationStatus("pending")
    setMigrationError(null)
    try {
      // Run SQL to add featured column if it doesn't exist
      const { error } = await supabase.rpc("run_sql", {
        sql: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;",
      })

      if (error) {
        console.error("Migration error:", error)
        setMigrationStatus("error")
        setMigrationError(error.message)
        return false
      }

      // Refresh the schema cache by forcing a query
      await supabase.from("matches").select("id").limit(1)

      setMigrationStatus("success")
      return true
    } catch (error: any) {
      console.error("Error running migration:", error)
      setMigrationStatus("error")
      setMigrationError(error.message)
      return false
    }
  }

  // Retry migration and reload
  const retryMigration = async () => {
    const success = await runMigration()
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

  // Toggle featured status
  const toggleFeatured = async (matchId: string, currentStatus: boolean) => {
    setUpdatingId(matchId)
    try {
      // First manually verify if the column exists
      const { data: columnCheck, error: columnError } = await supabase
        .from("matches")
        .select("featured")
        .eq("id", matchId)
        .limit(1)

      if (columnError && columnError.message.includes("does not exist")) {
        // Column doesn't exist, try to add it using direct SQL
        const { error: alterError } = await supabase
          .from("matches")
          .select("id")
          .limit(1)
          .then(() => {
            // If we can select, try to add the column using a different approach
            return supabase.rpc("exec_sql", {
              sql_query: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;"
            })
          })

        if (alterError) {
          // If that fails, show migration message
          toast({
            title: "Migration Required",
            description: "The 'featured' column needs to be added to the matches table. Please run the migration first.",
            variant: "destructive",
          })
          return
        }

        // Give the database a moment to update
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Update the featured status directly
      const { error: updateError } = await supabase
        .from("matches")
        .update({ featured: !currentStatus })
        .eq("id", matchId)

      if (updateError) {
        throw new Error(`Failed to update: ${updateError.message}`)
      }

      toast({
        title: currentStatus ? "Match unfeatured" : "Match featured",
        description: currentStatus
          ? "The match has been removed from featured matches."
          : "The match has been added to featured matches.",
      })

      // Refresh matches after a short delay to allow for database updates
      setTimeout(() => fetchMatches(), 500)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (migrationStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              Featured Games Management
            </h1>
            <p className="text-white/70 text-lg">
              Manage which games are featured on the home page
            </p>
          </div>

          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Database Error</AlertTitle>
            <AlertDescription className="text-red-300/80">
              {migrationError || "Failed to create or access the 'featured' column in the matches table."}
              <div className="mt-2">
                <Button 
                  onClick={retryMigration} 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Migration
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const featuredMatches = matches.filter(match => match.featured)
  const regularMatches = matches.filter(match => !match.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            Featured Games Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage which games are featured on the home page
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              About Featured Games
            </CardTitle>
            <CardDescription className="text-white/70">
              Featured games will be displayed prominently on the home page. You can feature multiple games, and they will
              be shown in order of their scheduled date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/20">
                <Calendar className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-white font-medium">Total Matches</div>
                  <div className="text-white/70 text-sm">{matches.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/20">
                <Star className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="text-white font-medium">Featured</div>
                  <div className="text-white/70 text-sm">{featuredMatches.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/20">
                <Users className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-white font-medium">Regular</div>
                  <div className="text-white/70 text-sm">{regularMatches.length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {matches.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-white">No Matches Found</h3>
              <p className="text-white/70">No matches are available to feature at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                All Matches
              </CardTitle>
              <CardDescription className="text-white/70">
                Click the star button to feature or unfeature a match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-white/20 rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Home Team</TableHead>
                      <TableHead className="text-white">Away Team</TableHead>
                      <TableHead className="text-white">Score</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Featured</TableHead>
                      <TableHead className="text-right text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow 
                        key={match.id} 
                        className={`border-white/20 hover:bg-slate-800/30 ${match.featured ? "bg-yellow-500/10" : ""}`}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white">{format(new Date(match[dateColumnName]), "MMM d, yyyy")}</span>
                            <span className="text-sm text-white/70">
                              {format(new Date(match[dateColumnName]), "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{match.home_team?.name || "Unknown Team"}</TableCell>
                        <TableCell className="text-white">{match.away_team?.name || "Unknown Team"}</TableCell>
                        <TableCell>
                          {match.home_score !== null && match.away_score !== null ? (
                            <Badge variant="outline" className="bg-slate-700/50 border-white/20 text-white font-mono">
                              {match.home_score} - {match.away_score}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                              TBD
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              match.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : match.status === 'scheduled'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {match.featured ? (
                            <Check className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <X className="h-5 w-5 text-white/50" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={match.featured ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleFeatured(match.id, !!match.featured)}
                            disabled={updatingId === match.id}
                            className={match.featured 
                              ? "bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50" 
                              : "bg-yellow-500 hover:bg-yellow-600 text-white"
                            }
                          >
                            {updatingId === match.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
