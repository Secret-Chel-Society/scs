"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Check, X, Star, StarOff, AlertCircle, RefreshCw } from "lucide-react"

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
      const { data: columnCheck, error: columnError } = await supabase.rpc("run_sql", {
        sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'featured'",
      })

      if (columnError || !columnCheck || columnCheck.length === 0) {
        // Column doesn't exist, try to add it
        const { error: alterError } = await supabase.rpc("run_sql", {
          sql: "ALTER TABLE matches ADD COLUMN featured BOOLEAN DEFAULT FALSE;",
        })

        if (alterError) {
          throw new Error(`Could not add 'featured' column: ${alterError.message}`)
        }

        // Give the database a moment to update
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Use raw SQL update to avoid schema cache issues
      const updateSql = `UPDATE matches SET featured = ${!currentStatus} WHERE id = '${matchId}'`
      const { error: updateError } = await supabase.rpc("run_sql", { sql: updateSql })

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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (migrationStatus === "error") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Featured Games Management</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>
            {migrationError || "Failed to create or access the 'featured' column in the matches table."}
            <div className="mt-2">
              <Button onClick={retryMigration} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Migration
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Featured Games Management</h1>
      </div>

      <Alert className="mb-6">
        <AlertTitle>About Featured Games</AlertTitle>
        <AlertDescription>
          Featured games will be displayed prominently on the home page. You can feature multiple games, and they will
          be shown in order of their scheduled date.
        </AlertDescription>
      </Alert>

      {matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No matches found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Home Team</TableHead>
                <TableHead>Away Team</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} className={match.featured ? "bg-primary/5" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(new Date(match[dateColumnName]), "MMM d, yyyy")}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(match[dateColumnName]), "h:mm a")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{match.home_team?.name || "Unknown Team"}</TableCell>
                  <TableCell>{match.away_team?.name || "Unknown Team"}</TableCell>
                  <TableCell>
                    {match.home_score !== null && match.away_score !== null
                      ? `${match.home_score} - ${match.away_score}`
                      : "TBD"}
                  </TableCell>
                  <TableCell>
                    <div className="capitalize">{match.status}</div>
                  </TableCell>
                  <TableCell>
                    {match.featured ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={match.featured ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFeatured(match.id, !!match.featured)}
                      disabled={updatingId === match.id}
                    >
                      {updatingId === match.id ? (
                        "Updating..."
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
  )
}
