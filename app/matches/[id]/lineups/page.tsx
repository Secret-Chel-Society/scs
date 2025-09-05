"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { TeamLogo } from "@/components/team-logo"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

interface Player {
  id: string
  users: {
    gamer_tag_id: string
    primary_position: string
    secondary_position: string | null
  }
}

interface LineupPlayer {
  id: string
  position: string
  line_number: number
  is_starter: boolean
  player_id: string
  players: Player
}

interface Lineup {
  team_id: string
  players: LineupPlayer[]
}

export default function MatchLineupsPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [match, setMatch] = useState<any>(null)
  const [homeLineup, setHomeLineup] = useState<Lineup | null>(null)
  const [awayLineup, setAwayLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(true)
  const matchId = params?.id as string

  // Fetch match and lineup data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Get match details
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            id,
            match_date,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            home_team:teams!home_team_id(id, name, logo_url),
            away_team:teams!away_team_id(id, name, logo_url)
          `)
          .eq("id", matchId)
          .single()

        if (matchError) {
          console.error("Error fetching match:", matchError)
          throw matchError
        }

        setMatch(matchData)

        // Get lineups
        try {
          const { data: lineupsData, error: lineupsError } = await supabase
            .from("lineups")
            .select(`
              id,
              team_id,
              position,
              line_number,
              is_starter,
              player_id,
              players:player_id(
                id,
                users:user_id(
                  gamer_tag_id,
                  primary_position,
                  secondary_position
                )
              )
            `)
            .eq("match_id", matchId)
            .order("position", { ascending: true })

          if (lineupsError) {
            console.error("Error fetching lineups:", lineupsError)
            throw lineupsError
          }

          // Group lineups by team
          const homeTeamLineups = lineupsData.filter((lineup) => lineup.team_id === matchData.home_team_id)
          const awayTeamLineups = lineupsData.filter((lineup) => lineup.team_id === matchData.away_team_id)

          setHomeLineup({
            team_id: matchData.home_team_id,
            players: homeTeamLineups,
          })

          setAwayLineup({
            team_id: matchData.away_team_id,
            players: awayTeamLineups,
          })
        } catch (error) {
          console.error("Error fetching lineups:", error)
          toast({
            title: "Error loading lineups",
            description: "There was an error loading the team lineups.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error in fetchData:", error)
        toast({
          title: "Error loading match",
          description: error.message || "Failed to load match details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchData()
    }
  }, [supabase, toast, matchId])

  // Format position name
  const formatPosition = (position: string) => {
    switch (position) {
      case "C":
        return "Center"
      case "LW":
        return "Left Wing"
      case "RW":
        return "Right Wing"
      case "LD":
        return "Left Defense"
      case "RD":
        return "Right Defense"
      case "G":
        return "Goalie"
      default:
        return position
    }
  }

  // Render lineup
  const renderLineup = (lineup: Lineup | null, teamName: string, logoUrl: string | null) => {
    if (!lineup || lineup.players.length === 0) {
      return (
        <div className="text-center py-6 text-hockey-silver-600 dark:text-hockey-silver-400">No lineup has been submitted for {teamName} yet.</div>
      )
    }

    // Group players by position type
    const forwards = lineup.players.filter((p) => ["C", "LW", "RW"].includes(p.position))
    const defense = lineup.players.filter((p) => ["LD", "RD"].includes(p.position))
    const goalies = lineup.players.filter((p) => p.position === "G")

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <TeamLogo logoUrl={logoUrl} teamName={teamName} size="small" />
          <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">{teamName} Lineup</h3>
        </div>

        {/* Forwards */}
        <div>
          <h4 className="text-sm font-medium text-hockey-silver-600 dark:text-hockey-silver-400 mb-2">Forwards</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {forwards.map((player) => (
              <Card key={player.id} className="hockey-alert hover:scale-105 transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{player.players.users.gamer_tag_id}</div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{formatPosition(player.position)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {player.position}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {forwards.length === 0 && (
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 col-span-3">No forwards in lineup</div>
            )}
          </div>
        </div>

        {/* Defense */}
        <div>
          <h4 className="text-sm font-medium text-hockey-silver-600 dark:text-hockey-silver-400 mb-2">Defense</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defense.map((player) => (
              <Card key={player.id} className="hockey-alert hover:scale-105 transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{player.players.users.gamer_tag_id}</div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{formatPosition(player.position)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {player.position}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {defense.length === 0 && (
              <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 col-span-2">No defensemen in lineup</div>
            )}
          </div>
        </div>

        {/* Goalies */}
        <div>
          <h4 className="text-sm font-medium text-hockey-silver-600 dark:text-hockey-silver-400 mb-2">Goalies</h4>
          <div className="grid grid-cols-1 gap-3">
            {goalies.map((player) => (
              <Card key={player.id} className="hockey-alert hover:scale-105 transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{player.players.users.gamer_tag_id}</div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{formatPosition(player.position)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-assist-green-500 to-goal-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {player.position}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {goalies.length === 0 && <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">No goalies in lineup</div>}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="mb-6">The match you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push("/matches")}>Back to Matches</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="hockey-title-enhanced mb-2">Team Lineups</h1>
              <p className="hockey-subtitle-enhanced">
                {match.home_team.name} vs {match.away_team.name}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/matches/${matchId}`)}
              className="hockey-hover-lift"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Match
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">Home Team</CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Players in the lineup for this match</CardDescription>
              </CardHeader>
              <CardContent className="p-6">{renderLineup(homeLineup, match.home_team.name, match.home_team.logo_url)}</CardContent>
            </Card>

            <Card className="hockey-enhanced-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">Away Team</CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Players in the lineup for this match</CardDescription>
              </CardHeader>
              <CardContent className="p-6">{renderLineup(awayLineup, match.away_team.name, match.away_team.logo_url)}</CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
