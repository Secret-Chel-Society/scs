"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Award, Star, Crown, Medal, Target, Users, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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
          gamer_tag_id,
          team_id,
          teams:team_id (name, logo_url),
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
        gamer_tag_id: award.gamer_tag_id,
        team_id: award.team_id,
        team_name: award.teams?.name || null,
        team_logo: award.teams?.logo_url || null,
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
      }))

      setPlayerAwards(formattedPlayerAwards || [])

      // Fetch seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("system_settings")
        .select("seasons")
        .single()

      if (seasonsError) throw seasonsError

      if (seasonsData?.seasons) {
        setSeasons(seasonsData.seasons)
      }
    } catch (error: any) {
      console.error("Error fetching awards:", error)
      toast({
        title: "Error",
        description: "Failed to load awards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter awards based on selected season and year
  const filteredTeamAwards = teamAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number.toString() === selectedSeason
    const yearMatch = selectedYear === "all" || award.year.toString() === selectedYear
    return seasonMatch && yearMatch
  })

  const filteredPlayerAwards = playerAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number.toString() === selectedSeason
    const yearMatch = selectedYear === "all" || award.year.toString() === selectedYear
    return seasonMatch && yearMatch
  })

  // Group awards by type
  const teamAwardsByType = filteredTeamAwards.reduce((acc, award) => {
    if (!acc[award.award_type]) {
      acc[award.award_type] = []
    }
    acc[award.award_type].push(award)
    return acc
  }, {} as Record<string, TeamAward[]>)

  const playerAwardsByType = filteredPlayerAwards.reduce((acc, award) => {
    if (!acc[award.award_type]) {
      acc[award.award_type] = []
    }
    acc[award.award_type].push(award)
    return acc
  }, {} as Record<string, PlayerAward[]>)

  // Helper function to get season name
  const getSeasonName = (seasonNumber: number) => {
    const season = seasons.find((s) => s.number === seasonNumber)
    return season?.name || `Season ${seasonNumber}`
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="space-y-8">
            <div className="text-center mb-12">
              <Skeleton className="h-16 w-80 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                SCS Awards
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Celebrate excellence and achievement in the Secret Chel Society
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Filters Section */}
          <Card className="border-primary/20 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Award Filters</CardTitle>
                  <CardDescription className="text-white/70">Filter awards by season and year</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.number?.toString() || season.id.toString()}>
                          {season.name || `Season ${season.number || season.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Awards Tabs */}
          <Tabs defaultValue="team-awards" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <TabsTrigger 
                value="team-awards" 
                className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
              >
                <Crown className="h-5 w-5 mr-2" />
                Team Awards
              </TabsTrigger>
              <TabsTrigger 
                value="player-awards" 
                className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
              >
                <Star className="h-5 w-5 mr-2" />
                Player Awards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team-awards" className="space-y-8 mt-8">
              {Object.entries(teamAwardsByType).length > 0 ? (
                Object.entries(teamAwardsByType).map(([awardType, awards], typeIndex) => (
                  <motion.div
                    key={awardType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: typeIndex * 0.1 }}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          awardType === "SCS Cup" 
                            ? "bg-yellow-500/20" 
                            : "bg-blue-500/20"
                        }`}>
                          {awardType === "SCS Cup" ? (
                            <Trophy className="h-8 w-8 text-yellow-500" />
                          ) : (
                            <Award className="h-8 w-8 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{awardType}</h2>
                          <p className="text-white/70">Team achievements and championships</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {awards.map((award, awardIndex) => (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: awardIndex * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group"
                          >
                            <Link href={`/teams/${award.team_id}`}>
                              <Card className={`overflow-hidden h-full hover:shadow-2xl transition-all duration-300 border-2 ${
                                awardType === "SCS Cup" 
                                  ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 hover:border-yellow-500/50" 
                                  : "border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/5 hover:border-blue-500/50"
                              }`}>
                                <CardContent className="p-6">
                                  <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-4 group-hover:scale-110 transition-transform duration-300">
                                      {award.team_logo ? (
                                        <div className="relative h-28 w-28">
                                          <Image
                                            src={award.team_logo}
                                            alt={award.team_name}
                                            fill
                                            className="object-contain"
                                            sizes="112px"
                                          />
                                        </div>
                                      ) : (
                                        <div className="h-28 w-28 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center border-2 border-primary/30">
                                          <span className="text-primary font-bold text-4xl">
                                            {award.team_name.substring(0, 2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-3">{award.team_name}</h3>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                                        {getSeasonName(award.season_number)}
                                      </Badge>
                                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                                        {award.year}
                                      </Badge>
                                    </div>
                                    
                                    {award.description && (
                                      <p className="text-sm text-white/70 leading-relaxed">{award.description}</p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
                      <Trophy className="h-16 w-16 mx-auto mb-4 text-white/50" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Team Awards Found</h3>
                      <p className="text-white/70">
                        No team awards found for the selected filters.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="player-awards" className="space-y-8 mt-8">
              {Object.entries(playerAwardsByType).length > 0 ? (
                Object.entries(playerAwardsByType).map(([awardType, awards], typeIndex) => (
                  <motion.div
                    key={awardType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: typeIndex * 0.1 }}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                          <Star className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{awardType}</h2>
                          <p className="text-white/70">Individual player achievements</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {awards.map((award, awardIndex) => (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: awardIndex * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group"
                          >
                            <Link href={`/players/${award.player_id}`}>
                              <Card className="overflow-hidden h-full hover:shadow-2xl transition-all duration-300 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50">
                                <CardContent className="p-6">
                                  <div className="flex flex-col items-center text-center">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="text-3xl font-bold text-primary">{award.gamer_tag_id}</div>
                                      {award.team_logo && (
                                        <div className="relative h-8 w-8 group-hover:scale-110 transition-transform duration-300">
                                          <Image
                                            src={award.team_logo}
                                            alt={award.team_name || ""}
                                            fill
                                            className="object-contain"
                                            sizes="32px"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                                        {getSeasonName(award.season_number)}
                                      </Badge>
                                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                                        {award.year}
                                      </Badge>
                                    </div>
                                    
                                    {award.team_name && (
                                      <div className="text-sm text-white/70 mb-3">
                                        Team: <span className="text-primary font-semibold">{award.team_name}</span>
                                      </div>
                                    )}
                                    
                                    {award.description && (
                                      <p className="text-sm text-white/70 leading-relaxed">{award.description}</p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
                      <Star className="h-16 w-16 mx-auto mb-4 text-white/50" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Player Awards Found</h3>
                      <p className="text-white/70">
                        No player awards found for the selected filters.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
