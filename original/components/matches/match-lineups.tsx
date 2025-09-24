"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MatchLineupsProps {
  matchId: string
  homeTeam: any
  awayTeam: any
}

interface Player {
  id: string
  team_id: string
  position: string
  line_number: number
  is_starter: boolean
  player_id: string
  players: {
    id: string
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
    }
  }
}

interface Lineup {
  id: string
  match_id: string
  team_id: string
  players: Player[]
}

export function MatchLineups({ matchId, homeTeam, awayTeam }: MatchLineupsProps) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [homeLineup, setHomeLineup] = useState<Lineup | null>(null)
  const [awayLineup, setAwayLineup] = useState<Lineup | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLineups = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch lineups with player data for this match
        const { data: lineupsData, error: lineupsError } = await supabase
          .from("lineups")
          .select(`
          id,
          team_id,
          match_id,
          position,
          line_number,
          is_starter,
          player_id,
          players:player_id(
            id,
            users:user_id(
              id,
              gamer_tag_id,
              primary_position,
              secondary_position
            )
          )
        `)
          .eq("match_id", matchId)

        if (lineupsError) {
          throw new Error(`Error fetching lineups: ${lineupsError.message}`)
        }

        if (!lineupsData || lineupsData.length === 0) {
          // No lineups found
          setHomeLineup(null)
          setAwayLineup(null)
          return
        }

        // Group lineups by team
        const homeLineupPlayers = lineupsData.filter((lineup) => lineup.team_id === homeTeam.id)
        const awayLineupPlayers = lineupsData.filter((lineup) => lineup.team_id === awayTeam.id)

        // Create structured lineup objects
        if (homeLineupPlayers.length > 0) {
          setHomeLineup({
            id: homeTeam.id,
            match_id: matchId,
            team_id: homeTeam.id,
            players: homeLineupPlayers,
          })
        } else {
          setHomeLineup(null)
        }

        if (awayLineupPlayers.length > 0) {
          setAwayLineup({
            id: awayTeam.id,
            match_id: matchId,
            team_id: awayTeam.id,
            players: awayLineupPlayers,
          })
        } else {
          setAwayLineup(null)
        }
      } catch (err) {
        console.error("Error fetching lineups:", err)
        setError(err.message || "Failed to load lineups")
      } finally {
        setLoading(false)
      }
    }

    if (matchId && homeTeam && awayTeam) {
      fetchLineups()
    }
  }, [matchId, homeTeam, awayTeam, supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lineups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lineups</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Check if lineups exist
  const hasHomeLineup = homeLineup && homeLineup.players && homeLineup.players.length > 0
  const hasAwayLineup = awayLineup && awayLineup.players && awayLineup.players.length > 0

  if (!hasHomeLineup && !hasAwayLineup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lineups</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Lineups Available</AlertTitle>
            <AlertDescription>Lineups for this match have not been submitted yet.</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link href={`/matches/${matchId}/lineups`} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View Full Lineups Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group players by position
  const getPlayersByPosition = (lineup: Lineup | null, position: string) => {
    if (!lineup || !lineup.players) return []
    return lineup.players.filter((player) => player.position === position)
  }

  // Forward positions
  const homeLeftWings = getPlayersByPosition(homeLineup, "LW")
  const homeCenters = getPlayersByPosition(homeLineup, "C")
  const homeRightWings = getPlayersByPosition(homeLineup, "RW")

  const awayLeftWings = getPlayersByPosition(awayLineup, "LW")
  const awayCenters = getPlayersByPosition(awayLineup, "C")
  const awayRightWings = getPlayersByPosition(awayLineup, "RW")

  // Defense positions
  const homeLeftDefense = getPlayersByPosition(homeLineup, "LD")
  const homeRightDefense = getPlayersByPosition(homeLineup, "RD")

  const awayLeftDefense = getPlayersByPosition(awayLineup, "LD")
  const awayRightDefense = getPlayersByPosition(awayLineup, "RD")

  // Goalies
  const homeGoalies = getPlayersByPosition(homeLineup, "G")
  const awayGoalies = getPlayersByPosition(awayLineup, "G")

  // Helper function to render player
  const renderPlayer = (player: Player | undefined) => {
    if (!player || !player.players || !player.players.users) {
      return <div className="text-center text-muted-foreground text-xs sm:text-sm">-</div>
    }

    return (
      <div className="text-center p-2 bg-muted/30 rounded">
        <div className="font-medium text-xs sm:text-sm">{player.players.users.gamer_tag_id}</div>
        <div className="text-xs text-muted-foreground">{formatPosition(player.position)}</div>
      </div>
    )
  }

  // Helper function to render position comparison
  const renderPositionComparison = (position: string, homePlayers: Player[], awayPlayers: Player[]) => {
    const maxPlayers = Math.max(homePlayers.length, awayPlayers.length)

    if (maxPlayers === 0) return null

    return (
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-lg font-semibold mb-2">{position}</h3>
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
          {/* Mobile: Stack vertically, Desktop: Grid layout */}
          <div className="sm:col-span-1">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:hidden">{homeTeam.name}</div>
            <div className="space-y-1">
              {Array.from({ length: maxPlayers }).map((_, index) => (
                <div key={`home-${position}-${index}`}>{renderPlayer(homePlayers[index])}</div>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex sm:col-span-1 items-center justify-center">
            <div className="text-center font-semibold">vs</div>
          </div>

          <div className="sm:col-span-1">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:hidden">{awayTeam.name}</div>
            <div className="space-y-1">
              {Array.from({ length: maxPlayers }).map((_, index) => (
                <div key={`away-${position}-${index}`}>{renderPlayer(awayPlayers[index])}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Lineups</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col items-center">
            {homeTeam.logo_url && (
              <div className="mb-2">
                <Image
                  src={homeTeam.logo_url || "/placeholder.svg"}
                  alt={homeTeam.name}
                  width={50}
                  height={50}
                  className="sm:w-[60px] sm:h-[60px] rounded-full"
                />
              </div>
            )}
            <h3 className="font-semibold text-base sm:text-lg text-center">{homeTeam.name}</h3>
            {!hasHomeLineup && <div className="text-xs sm:text-sm text-muted-foreground mt-1">No lineup submitted</div>}
          </div>
          <div className="hidden sm:flex items-center justify-center">
            <div className="text-xl font-bold">VS</div>
          </div>
          <div className="flex flex-col items-center">
            {awayTeam.logo_url && (
              <div className="mb-2">
                <Image
                  src={awayTeam.logo_url || "/placeholder.svg"}
                  alt={awayTeam.name}
                  width={50}
                  height={50}
                  className="sm:w-[60px] sm:h-[60px] rounded-full"
                />
              </div>
            )}
            <h3 className="font-semibold text-base sm:text-lg text-center">{awayTeam.name}</h3>
            {!hasAwayLineup && <div className="text-xs sm:text-sm text-muted-foreground mt-1">No lineup submitted</div>}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Forwards</h2>
            <div className="space-y-3 sm:space-y-4">
              {renderPositionComparison("Left Wing", homeLeftWings, awayLeftWings)}
              {renderPositionComparison("Center", homeCenters, awayCenters)}
              {renderPositionComparison("Right Wing", homeRightWings, awayRightWings)}
            </div>
          </div>

          <div className="border-t pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Defense</h2>
            <div className="space-y-3 sm:space-y-4">
              {renderPositionComparison("Left Defense", homeLeftDefense, awayLeftDefense)}
              {renderPositionComparison("Right Defense", homeRightDefense, awayRightDefense)}
            </div>
          </div>

          <div className="border-t pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Goalies</h2>
            <div className="space-y-3 sm:space-y-4">{renderPositionComparison("Goalie", homeGoalies, awayGoalies)}</div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href={`/matches/${matchId}/lineups`} className="flex items-center gap-2 text-xs sm:text-sm">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              View Full Lineups Page
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const formatPosition = (position: string) => {
  switch (position) {
    case "LW":
      return "Left Wing"
    case "C":
      return "Center"
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
