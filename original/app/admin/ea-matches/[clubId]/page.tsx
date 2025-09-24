"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Match {
  matchId: string
  timestamp: string
  clubs: {
    [key: string]: {
      clubId: string
      name: string
      goals: number
    }
  }
  winnerClubId: string
}

export default function EATeamMatchesPage({ params }: { params: { clubId: string } }) {
  const { clubId } = params
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [teamName, setTeamName] = useState<string>("")
  const [refreshing, setRefreshing] = useState(false)
  const [matchType, setMatchType] = useState<string>("club_private")

  useEffect(() => {
    async function checkAuthorizationAndLoadData() {
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
        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Get team name from database
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("name")
          .eq("ea_club_id", clubId)
          .single()

        if (!teamError && teamData) {
          setTeamName(teamData.name)
        }

        // Load EA team matches
        await loadEATeamMatches()
      } catch (error: any) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorizationAndLoadData()
  }, [clubId, supabase, session, toast, router])

  const loadEATeamMatches = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/ea/team-matches?clubId=${clubId}&matchType=${matchType}`)

      if (!response.ok) {
        throw new Error(`EA API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data)) {
        setMatches(data)
      } else {
        setMatches([])
        toast({
          title: "No matches found",
          description: "No matches found for this team",
        })
      }
    } catch (error: any) {
      console.error("Error loading EA team matches:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load EA team matches",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const goBack = () => {
    router.push("/admin/teams")
  }

  const handleMatchTypeChange = (value: string) => {
    setMatchType(value)
    // Reload matches with new match type
    loadEATeamMatches()
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <h1 className="text-3xl font-bold">
            {teamName ? `${teamName} - EA Matches` : `EA Team Matches (ID: ${clubId})`}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={matchType} onValueChange={handleMatchTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Match Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="club_private">Private Matches</SelectItem>
              <SelectItem value="club_public">Public Matches</SelectItem>
              <SelectItem value="club_league">League Matches</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadEATeamMatches} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Matches
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
          <CardDescription>Match history from EA Sports NHL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Match ID</TableHead>
                  <TableHead>Home Team</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Away Team</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No matches found for this team.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => {
                    const clubIds = Object.keys(match.clubs)
                    const homeClub = match.clubs[clubIds[0]]
                    const awayClub = match.clubs[clubIds[1]]
                    const isWinner = match.winnerClubId === clubId

                    return (
                      <TableRow key={match.matchId}>
                        <TableCell>{formatDate(match.timestamp)}</TableCell>
                        <TableCell>{match.matchId}</TableCell>
                        <TableCell className="font-medium">{homeClub.name}</TableCell>
                        <TableCell className="text-center">
                          {homeClub.goals} - {awayClub.goals}
                        </TableCell>
                        <TableCell className="font-medium">{awayClub.name}</TableCell>
                        <TableCell>
                          <span className={isWinner ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                            {isWinner ? "Win" : "Loss"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
