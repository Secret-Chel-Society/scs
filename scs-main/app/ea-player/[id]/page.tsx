"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"

export default function EAPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const eaPlayerId = params.id as string
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [mappedPlayerId, setMappedPlayerId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setLoading(true)

        // First, check if this EA player ID is mapped to a MGHL player
        const { data: mappingData, error: mappingError } = await supabase
          .from("ea_player_mappings")
          .select("player_id")
          .eq("ea_player_id", eaPlayerId)
          .single()

        if (!mappingError && mappingData && mappingData.player_id) {
          // If we have a mapping, redirect to the player page
          setMappedPlayerId(mappingData.player_id)
          router.push(`/players/${mappingData.player_id}`)
          return
        }

        // If no mapping exists, fetch EA player stats
        const { data: playerStats, error: statsError } = await supabase
          .from("ea_player_stats")
          .select("*")
          .eq("player_id", eaPlayerId)

        if (statsError) {
          throw statsError
        }

        if (!playerStats || playerStats.length === 0) {
          setError("No player data found for this EA player ID")
          setLoading(false)
          return
        }

        // Group stats by player
        const playerName = playerStats[0].player_name

        // Aggregate stats
        const aggregatedStats = playerStats.reduce(
          (acc, stat) => {
            return {
              player_name: stat.player_name,
              position: stat.position,
              team_id: stat.team_id,
              games_played: acc.games_played + 1,
              goals: (acc.goals || 0) + (stat.goals || 0),
              assists: (acc.assists || 0) + (stat.assists || 0),
              plus_minus: (acc.plus_minus || 0) + (stat.plus_minus || 0),
              pim: (acc.pim || 0) + (stat.pim || 0),
              shots: (acc.shots || 0) + (stat.shots || 0),
              hits: (acc.hits || 0) + (stat.hits || 0),
              blocks: (acc.blocks || 0) + (stat.blocks || 0),
              takeaways: (acc.takeaways || 0) + (stat.takeaways || 0),
              giveaways: (acc.giveaways || 0) + (stat.giveaways || 0),
              matches: [...(acc.matches || []), stat],
            }
          },
          {
            player_name: "",
            position: "",
            team_id: null,
            games_played: 0,
            goals: 0,
            assists: 0,
            plus_minus: 0,
            pim: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            takeaways: 0,
            giveaways: 0,
            matches: [],
          },
        )

        // Get team info if available
        if (aggregatedStats.team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("name, logo_url")
            .eq("id", aggregatedStats.team_id)
            .single()

          if (teamData) {
            aggregatedStats.team_name = teamData.name
            aggregatedStats.team_logo = teamData.logo_url
          }
        }

        setPlayerData(aggregatedStats)
      } catch (error: any) {
        console.error("Error fetching EA player data:", error)
        setError(error.message || "Failed to load player data")
      } finally {
        setLoading(false)
      }
    }

    if (eaPlayerId) {
      fetchPlayerData()
    }
  }, [eaPlayerId, supabase, router])

  if (mappedPlayerId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Skeleton className="h-64 w-full max-w-md rounded-lg" />
        </div>
        <div className="text-center mt-4">Redirecting to player profile...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
            Back to Statistics
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Player Not Found</h1>
            <p className="text-muted-foreground">No data available for this EA player ID.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Format position display
  let displayPosition = playerData.position
  if (playerData.position === "0") displayPosition = "G"
  else if (playerData.position === "1") displayPosition = "RD"
  else if (playerData.position === "2") displayPosition = "LD"
  else if (playerData.position === "3") displayPosition = "RW"
  else if (playerData.position === "4") displayPosition = "LW"
  else if (playerData.position === "5") displayPosition = "C"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <ArrowLeft className="h-5 w-5" />
        <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
          Back to Statistics
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{playerData.player_name}</CardTitle>
          <CardDescription>
            {displayPosition} {playerData.team_name && `| ${playerData.team_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.games_played}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.goals}</div>
              <div className="text-sm text-muted-foreground">Goals</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.assists}</div>
              <div className="text-sm text-muted-foreground">Assists</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.goals + playerData.assists}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.plus_minus}</div>
              <div className="text-sm text-muted-foreground">+/-</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.pim}</div>
              <div className="text-sm text-muted-foreground">PIM</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.shots}</div>
              <div className="text-sm text-muted-foreground">Shots</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">
                {playerData.shots > 0 ? ((playerData.goals / playerData.shots) * 100).toFixed(1) : "0.0"}%
              </div>
              <div className="text-sm text-muted-foreground">Shooting %</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.hits}</div>
              <div className="text-sm text-muted-foreground">Hits</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.blocks}</div>
              <div className="text-sm text-muted-foreground">Blocks</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.takeaways}</div>
              <div className="text-sm text-muted-foreground">Takeaways</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{playerData.giveaways}</div>
              <div className="text-sm text-muted-foreground">Giveaways</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>EA Sports Player</CardTitle>
          <CardDescription>
            This player is from EA Sports NHL and is not yet linked to an MGHL player profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>EA Player ID: {eaPlayerId}</p>
            <p className="mt-4">
              If you are an admin, you can link this EA player to an MGHL player in the admin panel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
