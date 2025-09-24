// Midnight Studios INTl - All rights reserved
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import NewsCard from "@/components/news-card"
import UpcomingGames from "@/components/upcoming-games"
import CompletedGames from "@/components/completed-games"
import TeamStandings from "@/components/team-standings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import HeroCarousel from "@/components/hero-carousel"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  Star,
  GamepadIcon,
  Target,
  BarChart3,
  Gift,
  Shield,
  Clock,
  Award,
  Database,
  Coins,
  Crown,
  Activity,
  Gamepad2,
  Medal,
  BarChartIcon as ChartBar,
} from "lucide-react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = React.useRef(null)
  const isInView = useInView(ref)

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, isInView])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-ice-blue-500/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          animate={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          transition={{
            duration: Math.random() * 25 + 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Handle password reset redirects
  useEffect(() => {
    const code = searchParams.get("code")
    const type = searchParams.get("type")
    
    if (code && type === "recovery") {
      // Redirect to reset password page with the code
      router.push(`/reset-password?code=${code}&type=${type}`)
      return
    }
    
    if (code) {
      // If there's a code but no type, assume it's a password reset
      router.push(`/reset-password?code=${code}`)
      return
    }
  }, [searchParams, router])
  const [news, setNews] = useState([])
  const [upcomingGames, setUpcomingGames] = useState([])
  const [completedGames, setCompletedGames] = useState([])
  const [standings, setStandings] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
  })
  const [loading, setLoading] = useState({
    news: true,
    games: true,
    standings: true,
    featured: true,
  })
  const [heroImages, setHeroImages] = useState([
    {
      url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200",
      title: "Welcome to Secret Chel Society",
      subtitle: "The premier NHL 26 competitive gaming league with advanced stat tracking",
    },
    {
      url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200",
      title: "Season 1 Registration Open",
      subtitle: "Join the most competitive NHL 26 league and earn rewards through our token system",
    },
    {
      url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200",
      title: "Live Match Streaming",
      subtitle: "Watch professional NHL 26 matches with real-time statistics and commentary",
    },
  ])

  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 50])
  const y2 = useTransform(scrollY, [0, 300], [0, -50])

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("=== HOME PAGE DATA FETCHING STARTED ===")
        // Fetch carousel images
        try {
          console.log("Fetching carousel images...")
          const { data: carouselData, error: carouselError } = await supabase
            .from("carousel_images")
            .select("*")
            .order("order", { ascending: true })

          if (!carouselError && carouselData && carouselData.length > 0) {
            const validatedImages = carouselData.map((img) => ({
              ...img,
              url:
                img.url && typeof img.url === "string" && img.url.trim() !== ""
                  ? img.url
                  : `/https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200&query=${encodeURIComponent(img.title || "NHL 26 hockey league")}`,
            }))
            setHeroImages(validatedImages)
          }
        } catch (carouselError) {
          console.error("Error fetching carousel images:", carouselError)
        }

        // Fetch stats
        try {
          console.log("Fetching stats...")
          const [playersRes, teamsRes, matchesRes] = await Promise.all([
            supabase.from("users").select("id", { count: "exact" }),
            supabase
              .from("teams")
              .select("id", { count: "exact" })
              .eq("is_active", true), // Only active teams
            supabase.from("matches").select("id", { count: "exact" }),
          ])

          setStats({
            totalPlayers: playersRes.count || 0,
            totalTeams: teamsRes.count || 0,
            totalMatches: matchesRes.count || 0,
          })
        } catch (error) {
          console.error("Error fetching stats:", error)
        }

        // Fetch latest news
        console.log("Fetching news...")
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(3)

        if (newsError) throw newsError
        setNews(newsData || [])
        setLoading((prev) => ({ ...prev, news: false }))

        // Get current season (same logic as matches page)
        let currentSeason = null
        
        // Try to get active season from seasons table
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (!seasonsError && seasonsData && seasonsData.length > 0) {
          // Find active season
          const activeSeason = seasonsData.find((s) => s.is_active === true)
          if (activeSeason) {
            console.log("Found active season for home page:", activeSeason)
            currentSeason = activeSeason
          } else {
            // Default to first season
            console.log("No active season, using first season for home page:", seasonsData[0])
            currentSeason = seasonsData[0]
          }
        } else {
          // Try to get current season from system_settings
          const { data, error } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "current_season")
            .single()

          if (!error && data && data.value) {
            const seasonNumber = Number.parseInt(data.value.toString(), 10)
            if (!isNaN(seasonNumber)) {
              currentSeason = {
                id: seasonNumber.toString(),
                number: seasonNumber,
                name: `Season ${seasonNumber}`,
                is_active: true,
              }
              console.log("Using season from system_settings for home page:", currentSeason)
            }
          }
        }

        if (!currentSeason) {
          // Default to season 1
          currentSeason = {
            id: "1",
            number: 1,
            name: "Season 1",
            is_active: true,
          }
          console.log("Using default season for home page:", currentSeason)
        }

        // Fetch upcoming games using current season (like matches page)
        const { data: upcomingData, error: upcomingError } = await supabase
          .from("matches")
          .select(`
            id, 
            match_date, 
            status,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .eq("season_name", currentSeason.name)
          .eq("status", "Scheduled")
          .gte("match_date", new Date().toISOString())
          .order("match_date", { ascending: true })
          .limit(10)

        if (upcomingError) throw upcomingError
        setUpcomingGames(upcomingData || [])

        // Fetch completed games using current season (like matches page)
        const { data: completedData, error: completedError } = await supabase
          .from("matches")
          .select(`
            id, 
            match_date, 
            status,
            home_score,
            away_score,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .eq("season_name", currentSeason.name)
          .eq("status", "Completed")
          .order("match_date", { ascending: false })
          .limit(10)

        if (completedError) throw completedError
        setCompletedGames(completedData || [])

        // Fetch featured games from admin-selected matches
        console.log("Fetching admin-selected featured games...")
        try {
          const { data: featuredData, error: featuredError } = await supabase
            .from("matches")
            .select(`
              id, 
              match_date, 
              status,
              home_score,
              away_score,
              featured,
              home_team:home_team_id(id, name, logo_url),
              away_team:away_team_id(id, name, logo_url)
            `)
            .eq("featured", true)
            .order("match_date", { ascending: false })
            .limit(6)

          if (featuredError) {
            console.error("Error fetching featured games:", featuredError)
            // If featured column doesn't exist, fall back to recent completed matches
            console.log("Featured column not available, falling back to recent completed matches")
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("matches")
              .select(`
                id, 
                match_date, 
                status,
                home_score,
                away_score,
                home_team:home_team_id(id, name, logo_url),
                away_team:away_team_id(id, name, logo_url)
              `)
              .eq("status", "Completed")
              .order("match_date", { ascending: false })
              .limit(6)
            
            if (fallbackError) {
              console.error("Fallback featured games query also failed:", fallbackError)
              setFeaturedGames([])
            } else {
              console.log("Using fallback featured games data")
              setFeaturedGames(fallbackData || [])
            }
          } else {
            console.log(`Found ${featuredData?.length || 0} admin-selected featured games`)
            setFeaturedGames(featuredData || [])
          }
        } catch (featuredError) {
          console.error("Exception in featured games fetch:", featuredError)
          setFeaturedGames([])
        }
        
        setLoading((prev) => ({ ...prev, featured: false }))

        setLoading((prev) => ({ ...prev, games: false }))

        // Fetch team standings using the same logic as standings page
        try {
          console.log("=== STARTING STANDINGS FETCH ===")
          console.log("Fetching standings using standings page approach...")
          
          // Get all teams with conference information (same as standings page)
          const { data: teamsData, error: teamsError } = await supabase
            .from("teams")
            .select(`
              *,
              conferences!left(name)
            `)
            .eq("is_active", true)
            .order("name")

          if (teamsError) {
            throw teamsError
          }

          if (!teamsData || teamsData.length === 0) {
            console.log("No teams found")
            setStandings([])
            setLoading((prev) => ({ ...prev, standings: false }))
            return
          }

          console.log(`Found ${teamsData.length} teams:`, teamsData.slice(0, 2))

          // Get current season name (same as standings page)
          let currentSeasonName = "Season 1" // Default fallback
          
          try {
            const { data: activeSeason } = await supabase
              .from("seasons")
              .select("name")
              .eq("is_active", true)
              .single()
            
            if (activeSeason?.name) {
              currentSeasonName = activeSeason.name
            }
          } catch (seasonError) {
            console.log("Could not fetch active season, using default:", seasonError)
          }

          // Get all matches for the current season (same as standings page)
          const { data: matchesData, error: matchesError } = await supabase
            .from("matches")
            .select("*")
            .eq("season_name", currentSeasonName)
            .eq("status", "completed")

          if (matchesError) {
            console.error("Error fetching matches:", matchesError)
          } else {
            console.log(`Found ${matchesData?.length || 0} completed matches for season: ${currentSeasonName}`)
            if (matchesData && matchesData.length > 0) {
              console.log("Sample match data:", matchesData.slice(0, 2))
            }
          }

          // Calculate standings manually (same logic as standings page)
          const calculatedStandings = teamsData.map((team, index) => {
            let wins = 0
            let losses = 0
            let otl = 0
            let goalsFor = 0
            let goalsAgainst = 0

            // Calculate stats from matches
            matchesData?.forEach((match) => {
              if (match.home_team_id === team.id) {
                goalsFor += match.home_score || 0
                goalsAgainst += match.away_score || 0

                if (match.home_score > match.away_score) {
                  wins++
                } else if (match.home_score < match.away_score) {
                  if (match.overtime || match.has_overtime) {
                    otl++
                  } else {
                    losses++
                  }
                } else {
                  losses++ // Tie counts as loss
                }
              } else if (match.away_team_id === team.id) {
                goalsFor += match.away_score || 0
                goalsAgainst += match.home_score || 0

                if (match.away_score > match.home_score) {
                  wins++
                } else if (match.away_score < match.home_score) {
                  if (match.overtime || match.has_overtime) {
                    otl++
                  } else {
                    losses++
                  }
                } else {
                  losses++ // Tie counts as loss
                }
              }
            })

            const gamesPlayed = wins + losses + otl
            const points = wins * 2 + otl * 1 // 2 points for win, 1 for OTL
            const goalDifferential = goalsFor - goalsAgainst

            return {
              id: team.id,
              name: team.name,
              logo_url: team.logo_url,
              wins,
              losses,
              otl,
              games_played: gamesPlayed,
              points,
              goals_for: goalsFor,
              goals_against: goalsAgainst,
              goal_differential: goalDifferential,
              conference: team.conferences?.name || "Unknown",
              conference_id: team.conference_id,
            }
          })

          // Sort by points (descending), then by wins (descending), then by goal differential (descending)
          calculatedStandings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.wins !== a.wins) return b.wins - a.wins
            return b.goal_differential - a.goal_differential
          })

          console.log(`Calculated standings for ${calculatedStandings.length} teams`)
          console.log("Sample standings data:", calculatedStandings.slice(0, 2))
          setStandings(calculatedStandings)
          setLoading((prev) => ({ ...prev, standings: false }))
        } catch (error) {
          console.error("Error fetching standings:", error)
          // Don't show toast for standings error, just log it and continue
          console.log("Standings not available - continuing without standings data")
          setStandings([]) // Set empty array so component doesn't break
          setLoading((prev) => ({ ...prev, standings: false }))
        }
        
        console.log("=== HOME PAGE DATA FETCHING COMPLETED ===")
      } catch (error) {
        console.error("=== ERROR IN HOME PAGE DATA FETCHING ===", error)
        toast({
          title: "Error loading data",
          description: error.message || "Failed to load content. Please try again.",
          variant: "destructive",
        })
        setLoading({
          news: false,
          games: false,
          standings: false,
          featured: false,
        })
      }
    }

    fetchData()
  }, [supabase, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <BannedUserModal />
      
      {/* Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />
      </div>

      {/* League Statistics Section */}
      <motion.section
        className="py-20 px-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-ice-blue-800 dark:from-ice-blue-400 dark:via-rink-blue-400 dark:to-ice-blue-600 bg-clip-text text-transparent leading-tight tracking-tight mb-6">
              League Statistics
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              Real-time data from our advanced tracking system
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              label: "Active Players",
              value: stats.totalPlayers,
              color: "bg-blue-500",
            },
            {
              icon: Trophy,
              label: "Teams",
              value: stats.totalTeams,
              color: "bg-emerald-500",
            },
            {
              icon: Calendar,
              label: "Matches",
              value: stats.totalMatches,
              color: "bg-indigo-500",
            },
            {
              icon: TrendingUp,
              color: "bg-red-500",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-2 p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${stat.color} rounded-xl shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <AnimatedCounter end={stat.value} />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Games Section */}
      <motion.section
        className="py-20 px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-ice-blue-800 dark:from-ice-blue-400 dark:via-rink-blue-400 dark:to-ice-blue-600 bg-clip-text text-transparent leading-tight tracking-tight mb-6">
              Featured Games
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              Don't miss these highlighted matches from our competitive league
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-8"></div>
          </div>

        {loading.featured ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full h-32 rounded-2xl" />
                <Skeleton className="w-3/4 h-4 rounded-xl" />
                <Skeleton className="w-1/2 h-3 rounded-xl" />
              </div>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
              >
                <Link href={`/matches/${game.id}`}>
                  <Card className="h-full cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            Featured Match
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(game.match_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Home Team */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {game.home_team?.name?.charAt(0) || "H"}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                            {game.home_team?.name || "Home Team"}
                          </span>
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {game.home_score || 0}
                          </span>
                        </div>

                        {/* VS */}
                        <div className="text-center">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">VS</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {game.away_team?.name?.charAt(0) || "A"}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                            {game.away_team?.name || "Away Team"}
                          </span>
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {game.away_score || 0}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            game.status === 'Completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : game.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {game.status}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <Star className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  No Featured Games Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  Check back soon for highlighted matches from our competitive league.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </motion.section>

      {/* About SCS Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            About SCS
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover what makes the Secret Chel Society the premier destination for competitive NHL 26 gaming
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <GamepadIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Premier NHL 26 League
                  </h3>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    The Secret Chel Society (SCS) is the most competitive and professionally organized NHL 26
                    gaming league available today. We provide a complete hockey simulation experience with structured
                    seasons, playoffs, and championship tournaments that mirror real NHL operations.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    We provide a comprehensive hockey experience with multiple divisions and in-depth team management. 
                    Players can engage in a full range of league activities, 
                    from free agency to a complete statistical system that tracks every detail of on-ice performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-500 rounded-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Professional Community
                  </h3>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Connect with hundreds of dedicated NHL 26 players in a top-tier competitive environment. 
                    Our community consists of seasoned gamers and 
                    hockey enthusiasts who are passionate about strategic play and sportsmanship.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Competitive integrity is at the heart of our community. 
                    Our dedicated team of moderators enforces a robust rule set, 
                    fostering an environment where every match is played with sportsmanship and professionalism.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Why Choose SCS */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-12">
              <div className="max-w-4xl mx-auto">
                <div className="p-4 bg-red-500 rounded-full w-fit mx-auto mb-6">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                  Why Choose SCS?
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  Join thousands of players who have made SCS their home for competitive NHL 26 gaming. 
                  Experience the perfect blend of professional league management, cutting-edge technology, 
                  and a passionate community that shares your love for hockey.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Shield, label: "Fair Play", desc: "Strict anti-cheat measures" },
                    { icon: Clock, label: "24/7 Support", desc: "Always here to help" },
                    { icon: Star, label: "Excellence", desc: "Premium gaming experience" }
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="p-3 bg-red-500/20 rounded-lg w-fit mx-auto mb-3">
                        <item.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {item.label}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Advanced League Features Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Advanced League Features
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover the cutting-edge features that make SCS the most advanced NHL 26 league platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Custom API Statistics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Our proprietary API system provides detailed statistical tracking and analysis for every aspect of NHL 26 gameplay. 
                    It automatically records all key metrics, from goals and assists to advanced analytics like Corsi and Fenwick ratings.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <ChartBar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Real-time match statistics
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Advanced player analytics
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Historical performance data
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 rounded-lg">
                    <Coins className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Token Reward System
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Earn SCS tokens completely free by participating in matches, achieving milestones, and contributing
                    to the community. Redeem tokens for exclusive prizes, merchandise, and special league privileges.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-500/20 rounded-md">
                        <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Free prize redemption
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-500/20 rounded-md">
                        <Medal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Achievement rewards
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-500/20 rounded-md">
                        <Star className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Exclusive league perks
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Professional Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Complete team management system with salary caps, contract negotiations, and
                    claims, and draft systems that create an authentic NHL franchise experience.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-indigo-500/20 rounded-md">
                        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Advanced team management
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-indigo-500/20 rounded-md">
                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Scheduled seasons
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-indigo-500/20 rounded-md">
                        <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Championship playoffs
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Upcoming Matches Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Upcoming NHL 26 Matches
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Live-streamed competitive games with real-time statistics and professional commentary
          </p>
        </div>

        {loading.games ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-48 rounded-xl" />
            ))}
          </div>
        ) : upcomingGames.length > 0 ? (
          <UpcomingGames games={upcomingGames} />
        ) : (
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-blue-500 rounded-full w-fit mx-auto mb-6">
                <Calendar className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                No Upcoming Matches
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                Check back soon for the next round of competitive NHL 26 games with live streaming and real-time statistics!
              </p>
            </CardContent>
          </Card>
        )}
        </motion.section>


      {/* Match Results & Standings Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Match Results & Standings
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Track recent match outcomes and current league standings in real-time with comprehensive statistics
          </p>
        </div>

        <Tabs defaultValue="completed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-auto">
            <TabsTrigger value="completed" className="text-xs md:text-sm px-2 md:px-4 py-2">
              <span className="hidden md:inline">Recent Match Results</span>
              <span className="md:hidden">Results</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="text-xs md:text-sm px-2 md:px-4 py-2">
              <span className="hidden md:inline">League Standings</span>
              <span className="md:hidden">Standings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-6">
            {loading.games ? (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="w-full h-32 rounded-xl" />
                        <Skeleton className="w-3/4 h-4 rounded" />
                        <Skeleton className="w-1/2 h-3 rounded" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : completedGames.length > 0 ? (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        Recent Match Results
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Latest completed games with final scores and statistics
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CompletedGames games={completedGames} />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-center p-12">
                <CardContent className="pt-6">
                  <div className="p-4 bg-blue-500/20 rounded-full w-fit mx-auto mb-6">
                    <Trophy className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                    No Completed Matches Yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Matches will appear here once they're completed. Check back soon for the latest results!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            {console.log("Rendering standings tab - loading:", loading.standings, "standings count:", standings.length, "standings data:", standings.slice(0, 2))}
            {loading.standings ? (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <Skeleton className="w-full h-12 rounded-lg" />
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-16 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : standings.length > 0 ? (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        League Standings
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Current team rankings and playoff race positions
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                        Playoff Race Update
                      </h4>
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Top 8 teams qualify for playoffs. Current standings show {standings.slice(0, 8).length} teams in playoff positions.
                    </p>
                  </div>
                  <TeamStandings teams={standings} />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-center p-12">
                <CardContent className="pt-6">
                  <div className="p-4 bg-indigo-500/20 rounded-full w-fit mx-auto mb-6">
                    <Trophy className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                    Standings Not Available
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    League standings will appear here once the season begins. Check back soon for current rankings!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.section>

      {/* Join the Premier NHL 26 League */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="p-4 bg-red-500 rounded-full w-fit mx-auto mb-8">
              <Crown className="h-16 w-16 text-white" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
              Join the Premier NHL 26 League
            </h2>

            <div className="mb-8 max-w-4xl mx-auto">
              <p className="text-xl mb-4 leading-relaxed text-slate-600 dark:text-slate-400">
                Experience the most competitive NHL 26 gaming environment with professional-grade statistics tracking,
                free token rewards, and authentic hockey league management.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                No entry fees, no pay-to-win mechanics - just pure competitive hockey gaming with real rewards!
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <Button
                asChild
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-4"
              >
                <Link href="/register" className="flex items-center gap-3">
                  <Zap className="h-6 w-6" />
                  Register for Season 1
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-lg px-8 py-4"
              >
                <Link
                  href="https://discord.gg/secretchelsociety"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3"
                >
                  <img
                    src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                    alt="Discord"
                    className="h-6 w-6"
                  />
                  Join Discord Community
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { value: "100%", label: "Free to Play", icon: Gift, color: "bg-emerald-500" },
                { value: "24/7", label: "Stat Tracking", icon: Activity, color: "bg-blue-500" },
                { value: "Real", label: "Prize Rewards", icon: Trophy, color: "bg-red-500" }
              ].map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className={`p-4 ${stat.color} rounded-full w-fit mx-auto mb-4`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Latest SCS News */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Latest SCS News
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Stay updated with the latest league announcements, player highlights, and community updates
          </p>
          <Button 
            variant="outline" 
            size="lg"
            asChild 
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-lg px-8 py-4"
          >
            <Link href="/news" className="flex items-center gap-3">
              <Star className="h-5 w-5" />
              View All News
            </Link>
          </Button>
        </div>

        {loading.news ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-80 rounded-xl" />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                  <NewsCard news={item} />
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-center p-16">
            <CardContent className="pt-6">
              <div className="p-4 bg-red-500 rounded-full w-fit mx-auto mb-8">
                <Star className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                No News Articles Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                Check back soon for the latest league updates, player highlights, and community announcements!
              </p>
            </CardContent>
          </Card>
        )}
      </motion.section>
    </div>
  )
}