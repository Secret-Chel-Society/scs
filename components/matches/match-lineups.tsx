"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, Users, Trophy, Shield, Target, Zap, Activity, TrendingUp, BarChart3, Award, BookOpen, FileText, Globe, Camera, Image as ImageIcon, Play, Pause, SkipForward, SkipBack, Clock, Calendar, Star, Medal, Crown } from "lucide-react"
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
      <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                Lineups
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                Lineups Error
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="hockey-alert-warning p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-goal-red-600 dark:text-goal-red-400" />
              <div>
                <h3 className="font-semibold text-goal-red-800 dark:text-goal-red-200 text-lg">Error Loading Lineups</h3>
                <p className="text-goal-red-600 dark:text-goal-red-400">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if lineups exist
  const hasHomeLineup = homeLineup && homeLineup.players && homeLineup.players.length > 0
  const hasAwayLineup = awayLineup && awayLineup.players && awayLineup.players.length > 0

  if (!hasHomeLineup && !hasAwayLineup) {
    return (
      <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                Lineups
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="hockey-alert p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 text-lg">No Lineups Available</h3>
                <p className="text-ice-blue-600 dark:text-ice-blue-400">Lineups for this match have not been submitted yet.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button asChild className="hockey-button hover:scale-105 transition-all duration-200">
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
      return <div className="text-center text-hockey-silver-500 dark:text-hockey-silver-500 text-sm p-3 hockey-alert">-</div>
    }

    return (
      <div className="text-center p-3 hockey-alert hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="font-semibold text-sm text-hockey-silver-800 dark:text-hockey-silver-200 mb-1">
          {player.players.users.gamer_tag_id}
        </div>
        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 bg-ice-blue-100 dark:bg-ice-blue-900/30 px-2 py-1 rounded-full">
          {formatPosition(player.position)}
        </div>
      </div>
    )
  }

  // Helper function to render position comparison
  const renderPositionComparison = (position: string, homePlayers: Player[], awayPlayers: Player[]) => {
    const maxPlayers = Math.max(homePlayers.length, awayPlayers.length)

    if (maxPlayers === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-hockey-silver-800 dark:text-hockey-silver-200 text-center">{position}</h3>
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
          {/* Mobile: Stack vertically, Desktop: Grid layout */}
          <div className="sm:col-span-1">
            <div className="text-sm font-medium text-hockey-silver-600 dark:text-hockey-silver-400 mb-3 sm:hidden text-center">{homeTeam.name}</div>
            <div className="space-y-2">
              {Array.from({ length: maxPlayers }).map((_, index) => (
                <div key={`home-${position}-${index}`}>{renderPlayer(homePlayers[index])}</div>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex sm:col-span-1 items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              vs
            </div>
          </div>

          <div className="sm:col-span-1">
            <div className="text-sm font-medium text-hockey-silver-600 dark:text-hockey-silver-400 mb-3 sm:hidden text-center">{awayTeam.name}</div>
            <div className="space-y-2">
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
    <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
              Lineups
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center p-6 hockey-alert hover:scale-105 transition-all duration-300">
            {homeTeam.logo_url && (
              <div className="mb-4">
                <Image
                  src={homeTeam.logo_url || "/placeholder.svg"}
                  alt={homeTeam.name}
                  width={60}
                  height={60}
                  className="w-[60px] h-[60px] rounded-full border-2 border-ice-blue-200 dark:border-ice-blue-700"
                />
              </div>
            )}
            <h3 className="font-semibold text-lg text-center text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">{homeTeam.name}</h3>
            {!hasHomeLineup && (
              <div className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500 bg-goal-red-100 dark:bg-goal-red-900/30 px-3 py-1 rounded-full">
                No lineup submitted
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              VS
            </div>
          </div>
          <div className="flex flex-col items-center p-6 hockey-alert hover:scale-105 transition-all duration-300">
            {awayTeam.logo_url && (
              <div className="mb-4">
                <Image
                  src={awayTeam.logo_url || "/placeholder.svg"}
                  alt={awayTeam.name}
                  width={60}
                  height={60}
                  className="w-[60px] h-[60px] rounded-full border-2 border-ice-blue-200 dark:border-ice-blue-700"
                />
              </div>
            )}
            <h3 className="font-semibold text-lg text-center text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">{awayTeam.name}</h3>
            {!hasAwayLineup && (
              <div className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500 bg-goal-red-100 dark:bg-goal-red-900/30 px-3 py-1 rounded-full">
                No lineup submitted
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <div className="bg-gradient-to-r from-assist-green-50 to-goal-red-50 dark:from-assist-green-900/30 dark:to-goal-red-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Forwards</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {renderPositionComparison("Left Wing", homeLeftWings, awayLeftWings)}
              {renderPositionComparison("Center", homeCenters, awayCenters)}
              {renderPositionComparison("Right Wing", homeRightWings, awayRightWings)}
            </div>
          </div>

          <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <div className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Defense</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {renderPositionComparison("Left Defense", homeLeftDefense, awayLeftDefense)}
              {renderPositionComparison("Right Defense", homeRightDefense, awayRightDefense)}
            </div>
          </div>

          <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <div className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Goalies</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {renderPositionComparison("Goalie", homeGoalies, awayGoalies)}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild className="hockey-button hover:scale-105 transition-all duration-200">
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
