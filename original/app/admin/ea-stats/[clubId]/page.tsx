"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react"

interface PlayerStats {
  name: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  pim: number
  hits: number
  giveaways: number
  takeaways: number
  shotsOnGoal: number
  shootingPct: number
  faceoffWinPct: number
  position: string
}

export default function EATeamStatsPage({ params }: { params: { clubId: string } }) {
  const { clubId } = params
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamName, setTeamName] = useState<string>("")

  useEffect(() => {
    loadTeamStats()
  }, [clubId])

  const loadTeamStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ea/team-stats?clubId=${clubId}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data)) {
        // Transform the data into a more usable format
        const formattedStats = data.map((player: any) => ({
          name: player.name || "Unknown Player",
          gamesPlayed: player.gamesPlayed || 0,
          goals: player.goals || 0,
          assists: player.assists || 0,
          points: (player.goals || 0) + (player.assists || 0),
          plusMinus: player.plusMinus || 0,
          pim: player.pim || 0,
          hits: player.hits || 0,
          giveaways: player.giveaways || 0,
          takeaways: player.takeaways || 0,
          shotsOnGoal: player.shotsOnGoal || 0,
          shootingPct: player.shootingPct || 0,
          faceoffWinPct: player.faceoffWinPct || 0,
          position: player.position || "Unknown",
        }))

        setPlayerStats(formattedStats)

        // Try to get team name
        const teamResponse = await fetch(`/api/ea/search-teams?clubId=${clubId}`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          if (teamData && teamData.length > 0) {
            setTeamName(teamData[0].name || `Club ID: ${clubId}`)
          } else {
            setTeamName(`Club ID: ${clubId}`)
          }
        } else {
          setTeamName(`Club ID: ${clubId}`)
        }
      } else {
        setPlayerStats([])
        toast({
          title: "No data found",
          description: "No player statistics found for this team",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error loading team stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load team statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    try {
      setRefreshing(true)
      await loadTeamStats()
      toast({
        title: "Stats refreshed",
        description: "Team statistics have been refreshed",
      })
    } catch (error) {
      console.error("Error refreshing stats:", error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">EA Team Stats: {teamName}</h1>
        </div>
        <Button onClick={refreshStats} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Stats
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>Statistics for players in this EA Sports NHL team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">GP</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">A</TableHead>
                  <TableHead className="text-center">PTS</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center">PIM</TableHead>
                  <TableHead className="text-center">Hits</TableHead>
                  <TableHead className="text-center">SOG</TableHead>
                  <TableHead className="text-center">S%</TableHead>
                  <TableHead className="text-center">FO%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                      No player statistics found for this team.
                    </TableCell>
                  </TableRow>
                ) : (
                  playerStats.map((player, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell className="text-center">{player.gamesPlayed}</TableCell>
                      <TableCell className="text-center">{player.goals}</TableCell>
                      <TableCell className="text-center">{player.assists}</TableCell>
                      <TableCell className="text-center">{player.points}</TableCell>
                      <TableCell className="text-center">{player.plusMinus}</TableCell>
                      <TableCell className="text-center">{player.pim}</TableCell>
                      <TableCell className="text-center">{player.hits}</TableCell>
                      <TableCell className="text-center">{player.shotsOnGoal}</TableCell>
                      <TableCell className="text-center">{player.shootingPct}%</TableCell>
                      <TableCell className="text-center">{player.faceoffWinPct}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
