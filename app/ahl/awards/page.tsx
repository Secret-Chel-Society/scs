"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Award, Star } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

interface TeamAward {
  id: string
  team_id: string
  team_name: string
  team_logo: string | null
  award_type: string
  season_number: number
  year: number
  description: string | null
}

interface PlayerAward {
  id: string
  player_id: string
  gamer_tag_id: string
  team_id: string | null
  team_name: string | null
  team_logo: string | null
  award_type: string
  season_number: number
  year: number
  description: string | null
}

interface Season {
  id: string | number
  name: string
  number?: number
}

export default function AHLAwardsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [teamAwards, setTeamAwards] = useState<TeamAward[]>([])
  const [playerAwards, setPlayerAwards] = useState<PlayerAward[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const availableYears = [...new Set([...teamAwards, ...playerAwards].map((award) => award.year))].sort((a, b) => b - a)

  useEffect(() => {
    fetchData()
  }, [supabase])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: teamAwardsData, error: teamAwardsError } = await supabase
        .from("ahl_team_awards")
        .select(`
          id,
          team_id,
          teams_ahl:team_id (name, logo_url),
          award_type,
          season_number,
          year,
          description
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (teamAwardsError) {
        console.log("AHL team awards table not found, using mock data")
        // Mock data for AHL team awards
        setTeamAwards([
          {
            id: "1",
            team_id: "ahl-team-1",
            team_name: "Springfield Thunderbirds",
            team_logo: null,
            award_type: "AHL Cup",
            season_number: 1,
            year: 2024,
            description: "Season 1 Champions",
          },
          {
            id: "2",
            team_id: "ahl-team-2",
            team_name: "Hartford Wolf Pack",
            team_logo: null,
            award_type: "President Trophy",
            season_number: 1,
            year: 2024,
            description: "Best Regular Season Record",
          },
        ])
      } else {
        const formattedTeamAwards = teamAwardsData.map((award) => ({
          id: award.id,
          team_id: award.team_id,
          team_name: award.teams_ahl?.name || "Unknown Team",
          team_logo: award.teams_ahl?.logo_url || null,
          award_type: award.award_type,
          season_number: award.season_number,
          year: award.year,
          description: award.description,
        }))
        setTeamAwards(formattedTeamAwards || [])
      }

      const { data: playerAwardsData, error: playerAwardsError } = await supabase
        .from("ahl_player_awards")
        .select(`
          id,
          player_id,
          ahl_players:player_id (
            users:user_id (gamer_tag_id),
            team_id,
            teams_ahl:team_id (name, logo_url)
          ),
          award_type,
          season_number,
          year,
          description
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (playerAwardsError) {
        console.log("AHL player awards table not found, using mock data")
        // Mock data for AHL player awards
        setPlayerAwards([
          {
            id: "1",
            player_id: "ahl-player-1",
            gamer_tag_id: "AHL_MVP_2024",
            team_id: "ahl-team-1",
            team_name: "Springfield Thunderbirds",
            team_logo: null,
            award_type: "MVP",
            season_number: 1,
            year: 2024,
            description: "Most Valuable Player",
          },
          {
            id: "2",
            player_id: "ahl-player-2",
            gamer_tag_id: "AHL_Rookie_Star",
            team_id: "ahl-team-2",
            team_name: "Hartford Wolf Pack",
            team_logo: null,
            award_type: "Rookie of the Year",
            season_number: 1,
            year: 2024,
            description: "Outstanding Rookie Performance",
          },
        ])
      } else {
        const formattedPlayerAwards = playerAwardsData.map((award) => ({
          id: award.id,
          player_id: award.player_id,
          gamer_tag_id: award.ahl_players?.users?.gamer_tag_id || "Unknown Player",
          team_id: award.ahl_players?.team_id || null,
          team_name: award.ahl_players?.teams_ahl?.name || null,
          team_logo: award.ahl_players?.teams_ahl?.logo_url || null,
          award_type: award.award_type,
          season_number: award.season_number,
          year: award.year,
          description: award.description,
        }))
        setPlayerAwards(formattedPlayerAwards || [])
      }

      // Fetch seasons
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name, number")
          .order("name")

        if (seasonsData && !seasonsError) {
          const processedSeasons = seasonsData
            .map((season) => {
              if (season.number !== undefined && season.number !== null) {
                return season
              }

              const nameMatch = season.name.match(/Season\s+(\d+)/i)
              const seasonNumber = nameMatch ? Number.parseInt(nameMatch[1], 10) : null

              return {
                ...season,
                number: seasonNumber,
              }
            })
            .sort((a, b) => (a.number || 0) - (b.number || 0))

          console.log("Processed seasons for AHL awards page:", processedSeasons)
          setSeasons(processedSeasons)
        } else {
          const defaultSeasons = [
            { id: "1", name: "Season 1", number: 1 },
            { id: "2", name: "Season 2", number: 2 },
            { id: "3", name: "Season 3", number: 3 },
          ]
          console.log("Using default seasons:", defaultSeasons)
          setSeasons(defaultSeasons)
        }
      } catch (error) {
        console.error("Error fetching seasons:", error)
        const defaultSeasons = [
          { id: "1", name: "Season 1", number: 1 },
          { id: "2", name: "Season 2", number: 2 },
          { id: "3", name: "Season 3", number: 3 },
        ]
        console.log("Using default seasons due to error:", defaultSeasons)
        setSeasons(defaultSeasons)
      }
    } catch (error: any) {
      console.error("Error fetching AHL awards data:", error)
      toast({
        title: "Error loading AHL awards",
        description: error.message || "Failed to load AHL awards data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter awards based on selected season and year
  const filteredTeamAwards = teamAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number === Number.parseInt(selectedSeason)
    const yearMatch = selectedYear === "all" || award.year === Number.parseInt(selectedYear)
    return seasonMatch && yearMatch
  })

  const filteredPlayerAwards = playerAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number === Number.parseInt(selectedSeason)
    const yearMatch = selectedYear === "all" || award.year === Number.parseInt(selectedYear)
    return seasonMatch && yearMatch
  })

  // Group team awards by type
  const teamAwardsByType = filteredTeamAwards.reduce(
    (acc, award) => {
      if (!acc[award.award_type]) {
        acc[award.award_type] = []
      }
      acc[award.award_type].push(award)
      return acc
    },
    {} as Record<string, TeamAward[]>,
  )

  // Group player awards by type
  const playerAwardsByType = filteredPlayerAwards.reduce(
    (acc, award) => {
      if (!acc[award.award_type]) {
        acc[award.award_type] = []
      }
      acc[award.award_type].push(award)
      return acc
    },
    {} as Record<string, PlayerAward[]>,
  )

  // Function to get season name by number
  const getSeasonName = (seasonNumber: number): string => {
    const season = seasons.find((s) => s.number === seasonNumber)
    return season ? season.name : `Season ${seasonNumber}`
  }

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 opacity-5 bg-no-repeat bg-center bg-contain pointer-events-none"
        style={{
          backgroundImage:
            "url('https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png')",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">AHL Awards</h1>
              <p className="text-muted-foreground">Celebrating excellence in the American Hockey League</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seasons</SelectItem>
                  {seasons.length > 0
                    ? seasons.map((season) => (
                        <SelectItem key={season.id} value={String(season.number)}>
                          {season.name}
                        </SelectItem>
                      ))
                    : [1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          Season {num}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="team-awards">
            <TabsList className="mb-6">
              <TabsTrigger value="team-awards">Team Awards</TabsTrigger>
              <TabsTrigger value="player-awards">Player Awards</TabsTrigger>
            </TabsList>

            <TabsContent value="team-awards">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(teamAwardsByType).length > 0 ? (
                    Object.entries(teamAwardsByType).map(([awardType, awards]) => (
                      <div key={awardType} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          {awardType === "AHL Cup" ? (
                            <Trophy className="h-6 w-6 text-yellow-500" />
                          ) : (
                            <Award className="h-6 w-6 text-blue-500" />
                          )}
                          {awardType}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {awards.map((award) => (
                            <motion.div
                              key={award.id}
                              whileHover={{ y: -5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Link href={`/ahl/teams/${award.team_id}`}>
                                <Card
                                  className={`overflow-hidden h-full hover:border-primary transition-colors ${
                                    awardType === "AHL Cup" ? "border-yellow-200 dark:border-yellow-900" : ""
                                  }`}
                                >
                                  <CardContent className="p-6">
                                    <div className="flex flex-col items-center">
                                      <div className="relative h-24 w-24 mb-4">
                                        {award.team_logo ? (
                                          <Image
                                            src={award.team_logo || "/placeholder.svg"}
                                            alt={award.team_name}
                                            fill
                                            className="object-contain"
                                          />
                                        ) : (
                                          <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center text-3xl font-bold">
                                            {award.team_name.substring(0, 2)}
                                          </div>
                                        )}
                                      </div>
                                      <h3 className="text-xl font-bold text-center mb-2">{award.team_name}</h3>
                                      <div className="text-sm text-muted-foreground text-center mb-4">
                                        {getSeasonName(award.season_number)} • {award.year}
                                      </div>
                                      {award.description && <p className="text-sm text-center">{award.description}</p>}
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No AHL team awards found for the selected filters.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="player-awards">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(playerAwardsByType).length > 0 ? (
                    Object.entries(playerAwardsByType).map(([awardType, awards]) => (
                      <div key={awardType} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Star className="h-6 w-6 text-yellow-500" />
                          {awardType}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {awards.map((award) => (
                            <motion.div
                              key={award.id}
                              whileHover={{ y: -5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Link href={`/ahl/players/${award.player_id}`}>
                                <Card className="overflow-hidden h-full hover:border-primary transition-colors">
                                  <CardContent className="p-6">
                                    <div className="flex flex-col items-center">
                                      <div className="flex items-center gap-3 mb-4">
                                        <div className="text-2xl font-bold">{award.gamer_tag_id}</div>
                                        {award.team_logo && (
                                          <div className="relative h-6 w-6">
                                            <Image
                                              src={award.team_logo || "/placeholder.svg"}
                                              alt={award.team_name || ""}
                                              fill
                                              className="object-contain"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground text-center mb-4">
                                        {getSeasonName(award.season_number)} • {award.year}
                                      </div>
                                      {award.team_name && (
                                        <div className="text-sm text-center mb-2">Team: {award.team_name}</div>
                                      )}
                                      {award.description && <p className="text-sm text-center">{award.description}</p>}
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No AHL player awards found for the selected filters.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
