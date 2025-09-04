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

export default function AwardsPage() {
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
      // Fetch team awards
      const { data: teamAwardsData, error: teamAwardsError } = await supabase
        .from("team_awards")
        .select(`
          id,
          team_id,
          teams:team_id (name, logo_url),
          award_type,
          season_number,
          year,
          description
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (teamAwardsError) throw teamAwardsError

      const formattedTeamAwards = teamAwardsData.map((award) => ({
        id: award.id,
        team_id: award.team_id,
        team_name: award.teams?.name || "Unknown Team",
        team_logo: award.teams?.logo_url || null,
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
      }))

      setTeamAwards(formattedTeamAwards || [])

      // Fetch player awards with team info
      const { data: playerAwardsData, error: playerAwardsError } = await supabase
        .from("player_awards")
        .select(`
          id,
          player_id,
          players:player_id (
            users:user_id (gamer_tag_id),
            team_id,
            teams:team_id (name, logo_url)
          ),
          award_type,
          season_number,
          year,
          description
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (playerAwardsError) throw playerAwardsError

      const formattedPlayerAwards = playerAwardsData.map((award) => ({
        id: award.id,
        player_id: award.player_id,
        gamer_tag_id: award.players?.users?.gamer_tag_id || "Unknown Player",
        team_id: award.players?.team_id || null,
        team_name: award.players?.teams?.name || null,
        team_logo: award.players?.teams?.logo_url || null,
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
      }))

      setPlayerAwards(formattedPlayerAwards || [])

      // Fetch seasons
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name, number")
          .order("name")

        if (seasonsData && !seasonsError) {
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

          console.log("Processed seasons for awards page:", processedSeasons)
          setSeasons(processedSeasons)
        } else {
          // Fallback to default seasons if table doesn't exist
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
        // Fallback to default seasons
        const defaultSeasons = [
          { id: "1", name: "Season 1", number: 1 },
          { id: "2", name: "Season 2", number: 2 },
          { id: "3", name: "Season 3", number: 3 },
        ]
        console.log("Using default seasons due to error:", defaultSeasons)
        setSeasons(defaultSeasons)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error loading awards",
        description: error.message || "Failed to load awards data",
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
    // Find the season with matching number field
    const season = seasons.find((s) => s.number === seasonNumber)
    return season ? season.name : `Season ${seasonNumber}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-amber-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              League Awards
            </h1>
            <p className="hockey-subtitle mx-auto mb-8">
              Celebrating excellence and outstanding achievements in the Secret Chel Society
            </p>
            
            {/* Awards Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-full shadow-lg shadow-amber-500/25 border-2 border-white dark:border-hockey-silver-800">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Honoring Champions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-hockey-silver-800 dark:text-hockey-silver-200">Award Categories</h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Filter and explore all league achievements</p>
            </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="hockey-input w-[180px]">
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
              <SelectTrigger className="hockey-input w-[180px]">
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
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-md gap-3 p-2 bg-gradient-to-r from-ice-blue-100/80 to-rink-blue-100/80 dark:from-ice-blue-900/40 dark:to-rink-blue-900/40 rounded-2xl border-2 border-ice-blue-200/60 dark:border-rink-blue-700/60 shadow-xl backdrop-blur-sm">
              <TabsTrigger 
                value="team-awards" 
                className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
              >
                <Trophy className="h-5 w-5" />
                Team Awards
              </TabsTrigger>
              <TabsTrigger 
                value="player-awards" 
                className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
              >
                <Star className="h-5 w-5" />
                Player Awards
              </TabsTrigger>
            </TabsList>
          </div>

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
                        {awardType === "SCS Cup" ? (
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
                            <Link href={`/teams/${award.team_id}`}>
                              <Card
                                className={`hockey-card hockey-card-hover h-full group ${
                                  awardType === "SCS Cup" ? "border-amber-200/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-900/20 dark:to-yellow-900/20" : ""
                                }`}
                              >
                                <CardContent className="p-8">
                                  <div className="flex flex-col items-center">
                                    <div className="relative h-28 w-28 mb-6 group-hover:scale-110 transition-transform duration-300">
                                      {award.team_logo ? (
                                        <Image
                                          src={award.team_logo || "/placeholder.svg"}
                                          alt={award.team_name}
                                          fill
                                          className="object-contain drop-shadow-lg"
                                        />
                                      ) : (
                                        <div className="h-28 w-28 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-2xl flex items-center justify-center text-4xl font-bold text-ice-blue-700 dark:text-ice-blue-300 shadow-lg">
                                          {award.team_name.substring(0, 2)}
                                        </div>
                                      )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-center mb-3 text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400 transition-colors duration-300">{award.team_name}</h3>
                                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 text-center mb-4 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full">
                                      {getSeasonName(award.season_number)} • {award.year}
                                    </div>
                                    {award.description && <p className="text-sm text-center text-hockey-silver-600 dark:text-hockey-silver-400 italic">{award.description}</p>}
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
                    <p className="text-muted-foreground">No team awards found for the selected filters.</p>
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
                            <Link href={`/players/${award.player_id}`}>
                              <Card className="hockey-card hockey-card-hover h-full group">
                                <CardContent className="p-8">
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-4 mb-6 group-hover:scale-105 transition-transform duration-300">
                                      <div className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 group-hover:text-ice-blue-600 dark:group-hover:text-ice-blue-400 transition-colors duration-300">{award.gamer_tag_id}</div>
                                      {award.team_logo && (
                                        <div className="relative h-8 w-8">
                                          <Image
                                            src={award.team_logo || "/placeholder.svg"}
                                            alt={award.team_name || ""}
                                            fill
                                            className="object-contain drop-shadow-md"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 text-center mb-4 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full">
                                      {getSeasonName(award.season_number)} • {award.year}
                                    </div>
                                    {award.team_name && (
                                      <div className="text-sm text-center mb-3 text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Team: {award.team_name}</div>
                                    )}
                                    {award.description && <p className="text-sm text-center text-hockey-silver-600 dark:text-hockey-silver-400 italic">{award.description}</p>}
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
                    <p className="text-muted-foreground">No player awards found for the selected filters.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
