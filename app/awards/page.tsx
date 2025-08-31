"use client"

import React, { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Award, Star, Crown, Medal, Zap, Target, TrendingUp } from "lucide-react"
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
        .from("seasons")
        .select("id, name, season_number")
        .order("season_number", { ascending: false })

      if (seasonsError) throw seasonsError

      const formattedSeasons = seasonsData.map((season) => ({
        id: season.id,
        name: season.name,
        number: season.season_number,
      }))

      setSeasons(formattedSeasons || [])
    } catch (error) {
      console.error("Error fetching awards data:", error)
      toast({
        title: "Error",
        description: "Failed to load awards data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTeamAwards = teamAwards.filter((award) => {
    if (selectedSeason !== "all" && award.season_number !== parseInt(selectedSeason)) return false
    if (selectedYear !== "all" && award.year !== parseInt(selectedYear)) return false
    return true
  })

  const filteredPlayerAwards = playerAwards.filter((award) => {
    if (selectedSeason !== "all" && award.season_number !== parseInt(selectedSeason)) return false
    if (selectedYear !== "all" && award.year !== parseInt(selectedYear)) return false
    return true
  })

  const getAwardIcon = (awardType: string) => {
    switch (awardType.toLowerCase()) {
      case "champion":
      case "championship":
        return <Crown className="h-6 w-6 text-yellow-400" />
      case "mvp":
      case "most valuable player":
        return <Star className="h-6 w-6 text-yellow-400" />
      case "runner up":
      case "finalist":
        return <Medal className="h-6 w-6 text-gray-400" />
      case "third place":
      case "bronze":
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <Trophy className="h-6 w-6 text-purple-400" />
    }
  }

  const getAwardColor = (awardType: string) => {
    switch (awardType.toLowerCase()) {
      case "champion":
      case "championship":
        return "from-yellow-500/20 to-amber-500/20 border-yellow-400/30"
      case "mvp":
      case "most valuable player":
        return "from-purple-500/20 to-pink-500/20 border-purple-400/30"
      case "runner up":
      case "finalist":
        return "from-gray-500/20 to-slate-500/20 border-gray-400/30"
      case "third place":
      case "bronze":
        return "from-amber-500/20 to-orange-500/20 border-amber-400/30"
      default:
        return "from-blue-500/20 to-indigo-500/20 border-blue-400/30"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <Skeleton className="h-64 w-full rounded-2xl bg-white/10 mb-8" />
            <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              League Awards
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Celebrating excellence and achievement in NHL 26
            </p>
          </motion.div>

          {/* Awards Statistics */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">{teamAwards.length + playerAwards.length}</div>
              <div className="text-yellow-300">Total Awards</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-200 mb-2">{teamAwards.length}</div>
              <div className="text-purple-300">Team Awards</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">{playerAwards.length}</div>
              <div className="text-blue-300">Player Awards</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-200 mb-2">{availableYears.length}</div>
              <div className="text-green-300">Seasons</div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-300" />
                    <span className="text-purple-300 font-medium">Filters:</span>
                  </div>
                  
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-purple-400/30 text-white">
                      <SelectValue placeholder="All Seasons" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      <SelectItem value="all">All Seasons</SelectItem>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.number?.toString() || ""}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-purple-400/30 text-white">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Tabs defaultValue="team" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="team" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Team Awards
                </TabsTrigger>
                <TabsTrigger 
                  value="player" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Player Awards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="team" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    {filteredTeamAwards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTeamAwards.map((award, index) => (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="group"
                          >
                            <Card className={`bg-gradient-to-br ${getAwardColor(award.award_type)} backdrop-blur-sm border hover:scale-105 transition-all duration-300`}>
                              <CardContent className="p-6 text-center">
                                <div className="flex justify-center mb-4">
                                  {getAwardIcon(award.award_type)}
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2">{award.award_type}</h3>
                                
                                <div className="flex justify-center mb-4">
                                  {award.team_logo ? (
                                    <div className="relative h-16 w-16">
                                      <Image
                                        src={award.team_logo}
                                        alt={award.team_name}
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-16 w-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                                      <span className="text-purple-200 font-bold text-lg">
                                        {award.team_name.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <h4 className="text-lg font-semibold text-white mb-2">{award.team_name}</h4>
                                
                                <div className="text-sm text-purple-300 mb-2">
                                  Season {award.season_number} • {award.year}
                                </div>
                                
                                {award.description && (
                                  <p className="text-sm text-purple-300">{award.description}</p>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                        <h3 className="text-xl font-bold text-white mb-2">No Team Awards Found</h3>
                        <p className="text-purple-300">Try adjusting your filters to see more results.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="player" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    {filteredPlayerAwards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlayerAwards.map((award, index) => (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="group"
                          >
                            <Card className={`bg-gradient-to-br ${getAwardColor(award.award_type)} backdrop-blur-sm border hover:scale-105 transition-all duration-300`}>
                              <CardContent className="p-6 text-center">
                                <div className="flex justify-center mb-4">
                                  {getAwardIcon(award.award_type)}
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2">{award.award_type}</h3>
                                
                                <div className="flex justify-center mb-4">
                                  {award.team_logo ? (
                                    <div className="relative h-16 w-16">
                                      <Image
                                        src={award.team_logo}
                                        alt={award.team_name || "Team"}
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                                      <span className="text-blue-200 font-bold text-lg">
                                        {award.team_name?.charAt(0) || "P"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <h4 className="text-lg font-semibold text-white mb-2">{award.gamer_tag_id}</h4>
                                
                                {award.team_name && (
                                  <p className="text-sm text-blue-300 mb-2">{award.team_name}</p>
                                )}
                                
                                <div className="text-sm text-blue-300 mb-2">
                                  Season {award.season_number} • {award.year}
                                </div>
                                
                                {award.description && (
                                  <p className="text-sm text-blue-300">{award.description}</p>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                        <h3 className="text-xl font-bold text-white mb-2">No Player Awards Found</h3>
                        <p className="text-blue-300">Try adjusting your filters to see more results.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
