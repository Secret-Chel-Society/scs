"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Medal, Star, Award } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface PlayerAwardsProps {
  playerId: string
}

interface Season {
  id: string | number
  name: string
  number?: number
}

export function PlayerAwards({ playerId }: PlayerAwardsProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [playerAwards, setPlayerAwards] = useState<any[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tableColumns, setTableColumns] = useState<string[]>([])

  useEffect(() => {
    async function fetchPlayerAwards() {
      try {
        setLoading(true)
        setError(null)

        // First, let's get the table structure
        const { data: structureData, error: structureError } = await supabase.from("player_awards").select("*").limit(1)

        if (structureError) {
          console.error("Error fetching table structure:", structureError)
          throw structureError
        }

        // Extract column names from the first row
        if (structureData && structureData.length > 0) {
          const columns = Object.keys(structureData[0])
          setTableColumns(columns)
          console.log("Table columns:", columns)
        }

        // Fetch seasons to get the correct mapping
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name, number")
          .order("name")

        if (seasonsError) {
          console.error("Error fetching seasons:", seasonsError)
        } else {
          // Process seasons to ensure they have correct numbers
          const processedSeasons = seasonsData
            .map((season) => {
              // If season already has a number, use it
              if (season.number !== undefined && season.number !== null) {
                return season
              }

              // Otherwise extract number from name
              const nameMatch = season.name.match(/Season\s+(\d+)/i)
              const seasonNumber = nameMatch ? Number.parseInt(nameMatch[1], 10) : null

              return {
                ...season,
                number: seasonNumber,
              }
            })
            .sort((a, b) => (a.number || 0) - (b.number || 0)) // Sort by number

          console.log("Processed seasons for player awards:", processedSeasons)
          setSeasons(processedSeasons)
        }

        // Now fetch this player's awards with a simple query
        const { data: awardsData, error: awardsError } = await supabase
          .from("player_awards")
          .select("*")
          .eq("player_id", playerId)
          .order("created_at", { ascending: false })

        if (awardsError) {
          console.error("Error fetching player awards:", awardsError)
          throw awardsError
        }

        console.log("Player awards data:", awardsData)

        // Log each award's season number for debugging
        if (awardsData) {
          awardsData.forEach((award) => {
            console.log(
              `Award ${award.id}: season_number=${award.season_number}, season=${award.season}, season_id=${award.season_id}`,
            )
          })
        }

        setPlayerAwards(awardsData || [])
      } catch (error: any) {
        console.error("Error fetching player awards:", error)
        setError(error.message || "Failed to load player awards")
        toast({
          title: "Error loading awards",
          description: error.message || "Failed to load player awards",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchPlayerAwards()
    }
  }, [supabase, playerId, toast])

  // Function to get the award type (safely)
  const getAwardType = (award: any): string => {
    // Try different possible column names for award type
    if (award.award_type) return award.award_type
    if (award.type) return award.type
    if (award.award_name) return award.award_name
    if (award.name) return award.name
    if (award.title) return award.title
    return "Award"
  }

  // Function to get the award name (safely)
  const getAwardName = (award: any): string => {
    if (award.award_name) return award.award_name
    if (award.name) return award.name
    if (award.title) return award.title
    return getAwardType(award)
  }

  // Group awards by type
  const awardsByType = playerAwards.reduce(
    (acc, award) => {
      const type = getAwardType(award)
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(award)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Function to get season name by number
  const getSeasonName = (award: any): string => {
    // Try different possible column names for season
    const seasonNumber = award.season_number ?? award.season ?? award.season_id ?? null

    if (seasonNumber !== undefined && seasonNumber !== null) {
      // Convert to number to ensure consistent handling
      const seasonNum = Number(seasonNumber)

      // Find the season with matching number field
      const season = seasons.find((s) => s.number === seasonNum)
      if (season) {
        return season.name
      }

      // Log the season number for debugging
      console.log(`Award ${award.id}: Using season number ${seasonNum}, but no matching season found`)

      return `Season ${seasonNum}`
    }

    return "Unknown Season"
  }

  // Function to get the appropriate icon for an award type
  const getAwardIcon = (awardType: string) => {
    const type = awardType.toLowerCase()
    if (type.includes("mvp")) {
      return <Star className="h-5 w-5 text-yellow-500" />
    } else if (type.includes("scoring") || type.includes("points")) {
      return <Award className="h-5 w-5 text-blue-500" />
    } else if (type.includes("rookie")) {
      return <Medal className="h-5 w-5 text-green-500" />
    } else {
      return <Trophy className="h-5 w-5 text-primary" />
    }
  }

  // Function to get the year (safely)
  const getAwardYear = (award: any): string => {
    return award.year || award.season_year || ""
  }

  // Function to get the description (safely)
  const getAwardDescription = (award: any): string | null => {
    return award.description || award.details || null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Awards</CardTitle>
          <CardDescription>Loading awards...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Awards</CardTitle>
          <CardDescription>Error loading awards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            {tableColumns.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Available columns: {tableColumns.join(", ")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Awards</CardTitle>
        <CardDescription>Achievements and recognition</CardDescription>
      </CardHeader>
      <CardContent>
        {playerAwards.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(awardsByType).map(([awardType, awards]) => (
              <div key={awardType} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {getAwardIcon(awardType)}
                  {awardType}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {awards.map((award, index) => (
                    <Card key={award.id || index} className="overflow-hidden hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{getAwardName(award)}</h4>
                            <span className="text-sm text-muted-foreground">{getAwardYear(award)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{getSeasonName(award)}</div>
                          {getAwardDescription(award) && <p className="text-sm mt-2">{getAwardDescription(award)}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No awards found for this player.</p>
            {tableColumns.length > 0 && (
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Available columns: {tableColumns.join(", ")}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
