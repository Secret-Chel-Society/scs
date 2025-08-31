"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchDetails } from "@/components/matches/match-details"
import { AlertCircle, Upload, Edit, RefreshCw, ArrowLeft, Trophy, Target, Zap, Star, Users, GamepadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { EaMatchImportModal } from "@/components/matches/ea-match-import-modal"
import { EditScoreModal } from "@/components/matches/edit-score-modal"
import { EaMatchStatistics } from "@/components/matches/ea-match-statistics"
import { MatchLineups } from "@/components/matches/match-lineups"
import { MatchHighlightsWrapper } from "@/components/matches/match-highlights-wrapper"
import { ComprehensiveMatchView } from "@/components/matches/comprehensive-match-view"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [openScoreModal, setOpenScoreModal] = useState(false)
  const [teamEaClubId, setTeamEaClubId] = useState<string | null>(null)
  const [statsSaved, setStatsSaved] = useState(false)
  const [forceRefreshing, setForceRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchTeamEaClubId = async (teamId: string) => {
    try {
      const { data, error } = await supabase.from("teams").select("ea_club_id").eq("id", teamId).single()

      if (error) {
        console.error("Error fetching team EA club ID:", error)
        return
      }

      setTeamEaClubId(data?.ea_club_id || null)
    } catch (error) {
      console.error("Error fetching team EA club ID:", error)
    }
  }

  const fetchMatchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      setStatsSaved(false)

      // Fetch the match details first
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(
          `
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          ea_match_id,
          overtime,
          match_date,
          status,
          season_name,
          period_scores,
          has_overtime,
          home_team:teams!home_team_id(id, name, logo_url, ea_club_id),
          away_team:teams!away_team_id(id, name, logo_url, ea_club_id)
        `,
        )
        .eq("id", matchId)
        .single()

      if (matchError) {
        console.error("Error fetching match:", matchError)
        throw new Error(`Error fetching match: ${matchError.message}`)
      }

      setMatch(matchData)

      // If forceRefresh is true, skip the database check and fetch directly from EA
      if (forceRefresh) {
        console.log("Force refresh requested, fetching directly from EA")
        // await fetchDirectlyFromEA(matchData);
        return
      }
    } catch (err) {
      console.error("Error in fetchMatchData:", err)
      setError(err.message || "Failed to load match data")
    } finally {
      setLoading(false)
      setForceRefreshing(false)
    }
  }

  useEffect(() => {
    if (matchId) {
      fetchMatchData()
    }
  }, [matchId])

  useEffect(() => {
    if (match?.home_team_id) {
      fetchTeamEaClubId(match.home_team_id)
    }
  }, [match?.home_team_id])

  const handleForceRefresh = async () => {
    setForceRefreshing(true)
    await fetchMatchData(true)
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/matches" className="text-purple-300 hover:text-purple-200">
              Back to Matches
            </Link>
          </div>
          <div className="animate-pulse">
            <Skeleton className="h-64 w-full rounded-2xl bg-white/10 mb-8" />
            <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/matches" className="text-purple-300 hover:text-purple-200">
              Back to Matches
            </Link>
          </div>
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Match Not Found</h2>
              <p className="text-red-300 mb-4">{error || "The match you are looking for does not exist."}</p>
              <Button 
                onClick={() => router.push("/matches")} 
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Matches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isCompleted = match.status === "Completed"
  const isInProgress = match.status === "In Progress"
  const isScheduled = match.status === "Scheduled"

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
          {/* Navigation */}
          <motion.div 
            className="flex items-center gap-2 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowLeft className="h-5 w-5 text-purple-300" />
            <Link href="/matches" className="text-purple-300 hover:text-purple-200 transition-colors">
              Back to Matches
            </Link>
          </motion.div>

          {/* Match Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Home Team */}
                  <div className="text-center flex-1">
                    <motion.div 
                      className="relative h-32 w-32 mx-auto mb-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {match.home_team.logo_url ? (
                        <Image
                          src={match.home_team.logo_url}
                          alt={match.home_team.name}
                          fill
                          className="object-contain drop-shadow-2xl"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-200 font-bold text-4xl">
                            {match.home_team.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">{match.home_team.name}</h2>
                    <div className="text-4xl font-bold text-blue-200">
                      {match.home_score !== null ? match.home_score : "-"}
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="text-center flex-1">
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Badge 
                        className={`text-lg px-4 py-2 ${
                          isCompleted 
                            ? "bg-green-500/20 border-green-400/50 text-green-200"
                            : isInProgress
                            ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                            : "bg-yellow-500/20 border-yellow-400/50 text-yellow-200"
                        } backdrop-blur-sm`}
                      >
                        {match.status}
                      </Badge>
                    </motion.div>
                    
                    <div className="text-6xl font-bold text-purple-300 mb-4">VS</div>
                    
                    <div className="text-purple-300 mb-2">
                      {new Date(match.match_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    
                    <div className="text-purple-300">
                      {new Date(match.match_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* Admin Actions */}
                    {session && (
                      <motion.div 
                        className="flex flex-wrap justify-center gap-2 mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenModal(true)}
                          className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Stats
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenScoreModal(true)}
                          className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Score
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleForceRefresh}
                          disabled={forceRefreshing}
                          className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-white/20"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${forceRefreshing ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="text-center flex-1">
                    <motion.div 
                      className="relative h-32 w-32 mx-auto mb-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {match.away_team.logo_url ? (
                        <Image
                          src={match.away_team.logo_url}
                          alt={match.away_team.name}
                          fill
                          className="object-contain drop-shadow-2xl"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center">
                          <span className="text-red-200 font-bold text-4xl">
                            {match.away_team.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">{match.away_team.name}</h2>
                    <div className="text-4xl font-bold text-red-200">
                      {match.away_score !== null ? match.away_score : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Match Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="statistics" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger 
                  value="lineups" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Lineups
                </TabsTrigger>
                <TabsTrigger 
                  value="highlights" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/20 data-[state=active]:to-amber-500/20 data-[state=active]:text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Highlights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <ComprehensiveMatchView match={match} isAdmin={session?.user?.id ? true : false} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statistics" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <EaMatchStatistics matchId={matchId} key={refreshKey} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineups" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <MatchLineups matchId={matchId} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="highlights" className="mt-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6">
                    <MatchHighlightsWrapper matchId={matchId} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <EaMatchImportModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        matchId={matchId}
        teamEaClubId={teamEaClubId}
        onSuccess={() => {
          setOpenModal(false)
          fetchMatchData()
          toast({
            title: "Success",
            description: "Match statistics imported successfully!",
          })
        }}
      />

      <EditScoreModal
        isOpen={openScoreModal}
        onClose={() => setOpenScoreModal(false)}
        match={match}
        onSuccess={() => {
          setOpenScoreModal(false)
          fetchMatchData()
          toast({
            title: "Success",
            description: "Match score updated successfully!",
          })
        }}
      />

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
