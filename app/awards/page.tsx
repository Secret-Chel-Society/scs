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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
      {/* Enhanced Hero Section */}
      <div className="clean-header relative py-20 px-4">
        <div className="container mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="clean-title mb-6">
              League Awards & Recognition
            </h1>
            <p className="clean-subtitle mb-8">
              Celebrating excellence, achievements, and outstanding performances in the Secret Chel Society
            </p>

            {/* Enhanced Awards Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group"
              >
                <div className="clean-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="clean-icon-container-emerald mb-4 group-hover:shadow-xl group-hover:shadow-emerald-500/25 transition-all duration-300">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    {teamAwards.length}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    Team Awards
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
                className="group"
              >
                <div className="clean-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="clean-icon-container mb-4 group-hover:shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                    {playerAwards.length}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Player Awards
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.6 }}
                className="group"
              >
                <div className="clean-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="clean-icon-container-red mb-4 group-hover:shadow-xl group-hover:shadow-red-500/25 transition-all duration-300">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-red-700 dark:text-red-300 mb-2">
                    {availableYears.length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Award Years
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {/* Enhanced Filters Section */}
        <div className="mb-8 clean-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Awards Gallery</h2>
              <p className="text-slate-600 dark:text-slate-400">Filter awards by season and year</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="w-48">
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
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Year" />
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
          </div>
        </div>

        <Tabs defaultValue="team-awards">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-lg gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
              <TabsTrigger 
                value="team-awards" 
                className="px-8 py-4 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold min-h-[60px]"
              >
                <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="flex-1 text-center font-medium text-sm">Team Awards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="player-awards" 
                className="px-8 py-4 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold min-h-[60px]"
              >
                <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <span className="flex-1 text-center font-medium text-sm">Player Awards</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="team-awards">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(teamAwardsByType).map(([awardType, awards]) => (
                  <div key={awardType}>
                    <h3 className="text-xl font-bold mb-4 text-hockey-silver-800 dark:text-hockey-silver-200">{awardType}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {awards.map((award) => (
                        <motion.div
                          key={award.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                        >
                          <Link href={`/teams/${award.team_id}`}>
                            <Card
                              className={`hockey-card hockey-card-hover overflow-hidden h-full ${
                                awardType === "SCS Cup" ? "border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10" : ""
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
                                        className="object-contain rounded-lg"
                                      />
                                    ) : (
                                      <div className="w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-800/20 flex items-center justify-center text-xl font-bold text-ice-blue-700 dark:text-ice-blue-300 rounded-lg border-2 border-ice-blue-200 dark:border-rink-blue-700">
                                        {award.team_name.substring(0, 2)}
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold mb-2 text-hockey-silver-800 dark:text-hockey-silver-200 text-center">
                                    {award.team_name}
                                  </h3>
                                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-3 text-center">
                                    {getSeasonName(award.season_number)} • {award.year}
                                  </div>
                                  {award.description && (
                                    <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-400 text-center">
                                      {award.description}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(teamAwardsByType).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No team awards found for the selected filters.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="player-awards">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(playerAwardsByType).map(([awardType, awards]) => (
                  <div key={awardType}>
                    <h3 className="text-xl font-bold mb-4 text-hockey-silver-800 dark:text-hockey-silver-200">{awardType}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {awards.map((award) => (
                        <motion.div
                          key={award.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                        >
                          <Link href={`/players/${award.player_id}`}>
                            <Card className="hockey-card hockey-card-hover overflow-hidden h-full">
                              <CardContent className="p-6">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{award.gamer_tag_id}</div>
                                    {award.team_logo && (
                                      <div className="relative h-8 w-8">
                                        <Image
                                          src={award.team_logo || "/placeholder.svg"}
                                          alt={award.team_name || ""}
                                          fill
                                          className="object-contain rounded"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-2">
                                    {award.team_name && `${award.team_name} • `}
                                    {getSeasonName(award.season_number)} • {award.year}
                                  </div>
                                  {award.description && (
                                    <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-400 text-center">
                                      {award.description}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(playerAwardsByType).length === 0 && (
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