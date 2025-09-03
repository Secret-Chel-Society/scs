"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Star, 
  Medal, 
  Crown, 
  Zap,
  Activity,
  Gamepad2,
  Shield,
  Coins,
  Award,
  BarChart3,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Match {
  id: string
  match_date: string
  status: string
  home_team: {
    id: string
    name: string
    logo_url: string | null
  }
  away_team: {
    id: string
    name: string
    logo_url: string | null
  }
  home_score?: number
  away_score?: number
  venue?: string
  stream_url?: string
}

export default function MatchesPage() {
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/matches")
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      } else {
        throw new Error("Failed to fetch matches")
      }
    } catch (error) {
      toast({
        title: "Error loading matches",
        description: "Failed to load matches data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const upcomingMatches = matches.filter(match => match.status === "Scheduled")
  const completedMatches = matches.filter(match => match.status === "Completed")
  const liveMatches = matches.filter(match => match.status === "Live")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return <Badge className="badge-regular"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
      case "Live":
        return <Badge className="badge-playoff"><Play className="h-3 w-3 mr-1" />Live</Badge>
      case "Completed":
        return <Badge className="badge-champion"><CheckCircle className="h-3 w-3 mr-1" />Final</Badge>
      case "Cancelled":
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge className="badge-regular">{status}</Badge>
    }
  }

  const getMatchResult = (match: Match) => {
    if (match.status !== "Completed" || match.home_score === undefined || match.away_score === undefined) {
      return null;
    }
    
    if (match.home_score > match.away_score) {
      return { winner: "home", score: `${match.home_score}-${match.away_score}` };
    } else if (match.away_score > match.home_score) {
      return { winner: "away", score: `${match.away_score}-${match.home_score}` };
    } else {
      return { winner: "tie", score: `${match.home_score}-${match.away_score}` };
    }
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-green/20 via-hockey-blue/20 to-hockey-green/20 border-b border-hockey-green/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-green/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-green/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-blue/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">Match Schedule</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Follow all the action from the Secret Chel Society. View upcoming matches, 
              live scores, and completed game results.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-green to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Live Matches Banner */}
        {liveMatches.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="enhanced-card bg-gradient-to-r from-hockey-green/20 to-hockey-blue/20 border-hockey-green/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-lg">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Live Matches</h3>
                      <p className="text-muted-foreground">Games currently in progress</p>
                    </div>
                  </div>
                  <Badge className="badge-playoff text-lg px-4 py-2">
                    {liveMatches.length} Live
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Matches Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-blue data-[state=active]:to-hockey-purple data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming ({upcomingMatches.length})
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-green data-[state=active]:to-hockey-blue data-[state=active]:text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Live ({liveMatches.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-gold data-[state=active]:to-hockey-orange data-[state=active]:text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed ({completedMatches.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : upcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -8 }}
                        className="group"
                      >
                        <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                          <CardHeader className="enhanced-card-header">
                            <div className="flex items-center justify-between mb-4">
                              {getStatusBadge(match.status)}
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Match Date</div>
                                <div className="font-semibold">{formatMatchDate(match.match_date)}</div>
                                <div className="text-sm text-hockey-blue">{formatMatchTime(match.match_date)}</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            {/* Teams */}
                            <div className="space-y-4 mb-6">
                              {/* Away Team */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                    {match.away_team.logo_url ? (
                                      <img
                                        src={match.away_team.logo_url}
                                        alt={match.away_team.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg font-bold text-hockey-blue">
                                        {match.away_team.name.substring(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold">{match.away_team.name}</span>
                                </div>
                                <span className="text-2xl font-bold text-muted-foreground">@</span>
                              </div>

                              {/* VS Divider */}
                              <div className="flex items-center justify-center">
                                <div className="h-px bg-hockey-blue/30 flex-1" />
                                <span className="px-4 text-sm font-bold text-hockey-blue">VS</span>
                                <div className="h-px bg-hockey-blue/30 flex-1" />
                              </div>

                              {/* Home Team */}
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-muted-foreground">@</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">{match.home_team.name}</span>
                                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                    {match.home_team.logo_url ? (
                                      <img
                                        src={match.home_team.logo_url}
                                        alt={match.home_team.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg font-bold text-hockey-blue">
                                        {match.home_team.name.substring(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Match Details */}
                            <div className="space-y-3 text-sm">
                              {match.venue && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Target className="h-4 w-4" />
                                  <span>{match.venue}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-4 border-t border-hockey-blue/10">
                              <div className="flex gap-2">
                                <Button className="flex-1 btn-ice" size="sm">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Add to Calendar
                                </Button>
                                {match.stream_url && (
                                  <Button className="btn-championship" size="sm">
                                    <Play className="h-4 w-4 mr-2" />
                                    Watch
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="enhanced-card text-center p-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Upcoming Matches</h3>
                    <p className="text-muted-foreground mb-4">
                      Check back soon for the next round of competitive NHL 26 games!
                    </p>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="live">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : liveMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -8 }}
                        className="group"
                      >
                        <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300 border-hockey-green/30">
                          <CardHeader className="enhanced-card-header bg-gradient-to-r from-hockey-green/10 to-transparent">
                            <div className="flex items-center justify-between mb-4">
                              {getStatusBadge(match.status)}
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Live Now</div>
                                <div className="font-semibold text-hockey-green">In Progress</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            {/* Live Score */}
                            <div className="text-center mb-6">
                              <div className="text-4xl font-bold text-hockey-green mb-2">
                                {match.home_score || 0} - {match.away_score || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">Current Score</div>
                            </div>

                            {/* Teams */}
                            <div className="space-y-4 mb-6">
                              {/* Away Team */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                    {match.away_team.logo_url ? (
                                      <img
                                        src={match.away_team.logo_url}
                                        alt={match.away_team.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg font-bold text-hockey-blue">
                                        {match.away_team.name.substring(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold">{match.away_team.name}</span>
                                </div>
                                <span className="text-2xl font-bold text-muted-foreground">@</span>
                              </div>

                              {/* VS Divider */}
                              <div className="flex items-center justify-center">
                                <div className="h-px bg-hockey-green/30 flex-1" />
                                <span className="px-4 text-sm font-bold text-hockey-green">VS</span>
                                <div className="h-px bg-hockey-green/30 flex-1" />
                              </div>

                              {/* Home Team */}
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-muted-foreground">@</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">{match.home_team.name}</span>
                                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                    {match.home_team.logo_url ? (
                                      <img
                                        src={match.home_team.logo_url}
                                        alt={match.home_team.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg font-bold text-hockey-blue">
                                        {match.home_team.name.substring(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-4 border-t border-hockey-green/10">
                              <div className="flex gap-2">
                                <Button className="flex-1 btn-championship" size="sm">
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Live Stats
                                </Button>
                                {match.stream_url && (
                                  <Button className="btn-ice" size="sm">
                                    <Play className="h-4 w-4 mr-2" />
                                    Watch Live
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="enhanced-card text-center p-12">
                    <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Live Matches</h3>
                    <p className="text-muted-foreground mb-4">
                      Check the upcoming matches tab to see when the next games start!
                    </p>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="completed">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : completedMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedMatches.map((match, index) => {
                      const result = getMatchResult(match)
                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          whileHover={{ y: -8 }}
                          className="group"
                        >
                          <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                            <CardHeader className="enhanced-card-header">
                              <div className="flex items-center justify-between mb-4">
                                {getStatusBadge(match.status)}
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">Final Score</div>
                                  <div className="font-bold text-lg">{result?.score}</div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6">
                              {/* Final Score */}
                              <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-hockey-gold mb-2">
                                  {match.home_score} - {match.away_score}
                                </div>
                                <div className="text-sm text-muted-foreground">Final Score</div>
                              </div>

                              {/* Teams with Results */}
                              <div className="space-y-4 mb-6">
                                {/* Away Team */}
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                  result?.winner === "away" ? "bg-hockey-green/10 border border-hockey-green/20" : ""
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                      {match.away_team.logo_url ? (
                                        <img
                                          src={match.away_team.logo_url}
                                          alt={match.away_team.name}
                                          className="w-8 h-8 object-contain"
                                        />
                                      ) : (
                                        <span className="text-lg font-bold text-hockey-blue">
                                          {match.away_team.name.substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-semibold">{match.away_team.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold">{match.away_score}</div>
                                    {result?.winner === "away" && (
                                      <Badge className="badge-champion text-xs">W</Badge>
                                    )}
                                  </div>
                                </div>

                                {/* VS Divider */}
                                <div className="flex items-center justify-center">
                                  <div className="h-px bg-hockey-gold/30 flex-1" />
                                  <span className="px-4 text-sm font-bold text-hockey-gold">VS</span>
                                  <div className="h-px bg-hockey-gold/30 flex-1" />
                                </div>

                                {/* Home Team */}
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                  result?.winner === "home" ? "bg-hockey-green/10 border border-hockey-green/20" : ""
                                }`}>
                                  <div className="text-left">
                                    <div className="text-2xl font-bold">{match.home_score}</div>
                                    {result?.winner === "home" && (
                                      <Badge className="badge-champion text-xs">W</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold">{match.home_team.name}</span>
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                      {match.home_team.logo_url ? (
                                        <img
                                          src={match.home_team.logo_url}
                                          alt={match.home_team.name}
                                          className="w-8 h-8 object-contain"
                                        />
                                      ) : (
                                        <span className="text-lg font-bold text-hockey-blue">
                                          {match.home_team.name.substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Match Details */}
                              <div className="space-y-3 text-sm mb-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatMatchDate(match.match_date)}</span>
                                </div>
                                {match.venue && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Target className="h-4 w-4" />
                                    <span>{match.venue}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-6 pt-4 border-t border-hockey-blue/10">
                                <div className="flex gap-2">
                                  <Button className="flex-1 btn-ice" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Stats
                                  </Button>
                                  <Button className="btn-championship" size="sm">
                                    <Trophy className="h-4 w-4 mr-2" />
                                    Highlights
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="enhanced-card text-center p-12">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Completed Matches</h3>
                    <p className="text-muted-foreground mb-4">
                      Match results will appear here once games are completed.
                    </p>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Season Summary */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="enhanced-card">
            <CardHeader className="enhanced-card-header">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-hockey-purple to-hockey-blue rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Season Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-blue mb-2">{matches.length}</div>
                  <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-green mb-2">{upcomingMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-gold mb-2">{completedMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-purple mb-2">{liveMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Live Now</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
