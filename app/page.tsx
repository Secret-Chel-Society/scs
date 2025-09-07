"use client"

import React from "react"

import { useState, useEffect } from "react"
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
import { RecentTrades } from "@/components/recent-trades"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [news, setNews] = useState([])
  const [upcomingGames, setUpcomingGames] = useState([])
  const [completedGames, setCompletedGames] = useState([])
  const [standings, setStandings] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    completedTrades: 0,
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
        // Fetch carousel images
        try {
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

        // Fetch stats - Updated to count completed trades instead of pending
        try {
          const [playersRes, teamsRes, matchesRes, tradesRes] = await Promise.all([
            supabase.from("users").select("id", { count: "exact" }),
            supabase
              .from("teams")
              .select("id", { count: "exact" })
              .eq("is_active", true), // Only active teams
            supabase.from("matches").select("id", { count: "exact" }),
            // Check if trades table exists and get completed trades
            supabase
              .from("trades")
              .select("id", { count: "exact" })
              .eq("status", "completed")
              .then(
                (result) => result,
                (error) => {
                  // If trades table doesn't exist, return 0
                  if (error.message.includes("relation") && error.message.includes("does not exist")) {
                    return { count: 0, error: null }
                  }
                  return { count: 0, error }
                },
              ),
          ])

          setStats({
            totalPlayers: playersRes.count || 0,
            totalTeams: teamsRes.count || 0,
            totalMatches: matchesRes.count || 0,
            completedTrades: tradesRes.count || 0,
          })
        } catch (error) {
          console.error("Error fetching stats:", error)
        }

        // Fetch latest news
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(3)

        if (newsError) throw newsError
        setNews(newsData || [])
        setLoading((prev) => ({ ...prev, news: false }))

        // Fetch upcoming games
        const { data: upcomingData, error: upcomingError } = await supabase
          .from("matches")
          .select(`
            id, 
            match_date, 
            status,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .eq("status", "Scheduled")
          .gte("match_date", new Date().toISOString())
          .order("match_date", { ascending: true })
          .limit(10)

        if (upcomingError) throw upcomingError
        setUpcomingGames(upcomingData || [])

        // Fetch completed games
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
          .eq("status", "Completed")
          .order("match_date", { ascending: false })
          .limit(10)

        if (completedError) throw completedError
        setCompletedGames(completedData || [])

        // Fetch featured games
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

        if (featuredError) throw featuredError
        setFeaturedGames(featuredData || [])
        setLoading((prev) => ({ ...prev, featured: false }))

        setLoading((prev) => ({ ...prev, games: false }))

        // Fetch team standings
        try {
          const response = await fetch("/api/standings")
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch standings`)
          }
          const data = await response.json()
          setStandings(data.standings || [])
          setLoading((prev) => ({ ...prev, standings: false }))
        } catch (error) {
          console.error("Error fetching standings:", error)
          // Don't show toast for standings error, just log it and continue
          console.log("Standings not available - continuing without standings data")
          setStandings([]) // Set empty array so component doesn't break
          setLoading((prev) => ({ ...prev, standings: false }))
        }
      } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20">
      <BannedUserModal />
      
      {/* Clean Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />
      </div>

      {/* Clean SCS League Statistics Section */}
      <motion.section
        className="container mx-auto px-4 py-20 -mt-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-16">
          <motion.div 
            className="inline-flex items-center gap-4 mb-6" 
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="hockey-icon-container">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h2 className="hockey-gradient-text text-4xl md:text-5xl font-black">
              SCS League Statistics
            </h2>
          </motion.div>
          <div className="hockey-divider" />
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto leading-relaxed">
            Real-time data from our advanced tracking system with comprehensive analytics
          </p>
        </div>

        <Card className="hockey-card">
          <CardContent className="p-8">
            <div className="hockey-stats-grid">
              {[
                {
                  icon: Users,
                  label: "Active Players",
                  value: stats.totalPlayers,
                  color: "from-blue-500 to-blue-600",
                  desc: "Registered competitors",
                },
                {
                  icon: Trophy,
                  label: "Teams",
                  value: stats.totalTeams,
                  color: "from-emerald-500 to-emerald-600",
                  desc: "Active franchises",
                },
                {
                  icon: Calendar,
                  label: "Matches Played",
                  value: stats.totalMatches,
                  color: "from-indigo-500 to-indigo-600",
                  desc: "Total games tracked",
                },
                {
                  icon: TrendingUp,
                  label: "Completed Trades",
                  value: stats.completedTrades,
                  color: "from-red-500 to-red-600",
                  desc: "Completed transactions",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="hockey-stat-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <motion.div
                    className="hockey-stat-icon"
                    whileHover={{ rotate: 6, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`p-6 bg-gradient-to-r ${stat.color} rounded-2xl shadow-2xl mx-auto w-fit`}>
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <div className="hockey-stat-value">
                    <AnimatedCounter end={stat.value} />
                  </div>
                  <div className="hockey-stat-label">{stat.label}</div>
                  <div className="hockey-stat-desc">{stat.desc}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Featured Games Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-16">
          <motion.div 
            className="inline-flex items-center gap-4 mb-6" 
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="hockey-icon-container-red">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h2 className="hockey-gradient-text-red text-4xl md:text-5xl font-black">
              Featured Games
            </h2>
          </motion.div>
          <div className="hockey-divider-red" />
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto leading-relaxed">
            Don't miss these highlighted matches from our competitive league
          </p>
        </div>

        {loading.featured ? (
          <Card className="bg-white/80 dark:bg-hockey-silver-800/80 backdrop-blur-sm border border-ice-blue-200 dark:border-ice-blue-700 shadow-xl">
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
        ) : featuredGames.length > 0 ? (
          <Card className="hockey-card">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="group"
                  >
                    <Link href={`/matches/${game.id}`}>
                      <Card className="h-full bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-700 dark:to-hockey-silver-800 border border-ice-blue-200 dark:border-ice-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                Featured Match
                              </span>
                            </div>
                            <span className="text-xs text-hockey-silver-500 dark:text-hockey-silver-400">
                              {new Date(game.match_date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Home Team */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {game.home_team?.name?.charAt(0) || "H"}
                                </span>
                              </div>
                              <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex-1">
                                {game.home_team?.name || "Home Team"}
                              </span>
                              <span className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">
                                {game.home_score || 0}
                              </span>
                            </div>

                            {/* VS */}
                            <div className="text-center">
                              <span className="text-sm font-medium text-hockey-silver-500 dark:text-hockey-silver-400">VS</span>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {game.away_team?.name?.charAt(0) || "A"}
                                </span>
                              </div>
                              <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex-1">
                                {game.away_team?.name || "Away Team"}
                              </span>
                              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {game.away_score || 0}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-ice-blue-200 dark:border-ice-blue-600">
                            <div className="flex items-center justify-between">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                game.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : game.status === 'Scheduled'
                                  ? 'bg-ice-blue-100 text-ice-blue-800 dark:bg-ice-blue-900 dark:text-ice-blue-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {game.status}
                              </span>
                              <span className="text-xs text-hockey-silver-500 dark:text-hockey-silver-400 group-hover:text-hockey-silver-700 dark:group-hover:text-hockey-silver-300 transition-colors">
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
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 dark:bg-hockey-silver-800/80 backdrop-blur-sm border border-ice-blue-200 dark:border-ice-blue-700 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-hockey-silver-100 dark:bg-hockey-silver-700 rounded-full">
                  <Star className="h-8 w-8 text-hockey-silver-400" />
                </div>
                <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  No Featured Games Yet
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 max-w-md">
                  Check back soon for highlighted matches from our competitive league.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.section>

      {/* Clean About SCS Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-16">
          <motion.div 
            className="inline-flex items-center gap-4 mb-6" 
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="hockey-icon-container-red">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h2 className="hockey-gradient-text-red text-4xl md:text-5xl font-black">
              About SCS
            </h2>
          </motion.div>
          <div className="hockey-divider-red" />
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto leading-relaxed">
            Discover what makes the Secret Chel Society the premier destination for competitive NHL 26 gaming
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-feature-card">
              <CardContent className="p-8">
                <div className="hockey-feature-header">
                  <div className="hockey-feature-icon bg-gradient-to-r from-ice-blue-500 to-rink-blue-600">
                    <GamepadIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="hockey-feature-title">
                    Premier NHL 26 League
                  </h3>
                </div>
                <div className="hockey-feature-content">
                  <p className="hockey-feature-text">
                    The Secret Chel Society (SCS) is the most competitive and professionally organized NHL 26
                    gaming league available today. We provide a complete hockey simulation experience with structured
                    seasons, playoffs, and championship tournaments that mirror real NHL operations.
                  </p>
                  <p className="hockey-feature-text">
                    We provide a comprehensive hockey experience with multiple divisions and in-depth team management. 
                    Players can engage in a full range of league activities, 
                    from trades and free agency to a complete statistical system that tracks every detail of on-ice performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-feature-card">
              <CardContent className="p-8">
                <div className="hockey-feature-header">
                  <div className="hockey-feature-icon bg-gradient-to-r from-assist-green-500 to-assist-green-600">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="hockey-feature-title">
                    Professional Community
                  </h3>
                </div>
                <div className="hockey-feature-content">
                  <p className="hockey-feature-text">
                    Connect with hundreds of dedicated NHL 26 players in a top-tier competitive environment. 
                    Our community consists of seasoned gamers and 
                    hockey enthusiasts who are passionate about strategic play and sportsmanship.
                  </p>
                  <p className="hockey-feature-text">
                    Competitive integrity is at the heart of our community. 
                    Our dedicated team of moderators enforces a robust rule set, 
                    fostering an environment where every match is played with sportsmanship and professionalism.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Clean Why Choose SCS Content */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="hockey-card">
            <CardContent className="p-12">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  className="mb-8"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="hockey-icon-container-red mx-auto w-fit">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <h3 className="hockey-gradient-text-red text-3xl font-black mb-6">
                  Why Choose SCS?
                </h3>
                <p className="hockey-feature-text text-xl leading-relaxed mb-8">
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
                      <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg w-fit mx-auto mb-3">
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

      {/* Clean Advanced League Features Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="clean-section-header">
          <motion.div 
            className="inline-flex items-center gap-4 mb-6" 
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="clean-icon-container">
              <Database className="h-10 w-10 text-white" />
            </div>
            <h2 className="clean-section-title clean-gradient-text">
              Advanced League Features
            </h2>
          </motion.div>
          <div className="clean-divider" />
          <p className="clean-section-subtitle">
            Discover the cutting-edge features that make SCS the most advanced NHL 26 league platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="clean-feature-card">
              <CardHeader>
                <div className="clean-feature-header">
                  <div className="clean-feature-icon bg-gradient-to-r from-blue-500 to-blue-600">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="clean-feature-title">
                    Custom API Statistics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="clean-feature-content">
                  <p className="clean-feature-text">
                    Our proprietary API system provides detailed statistical tracking and analysis for every aspect of NHL 26 gameplay. 
                    It automatically records all key metrics, from goals and assists to advanced analytics like Corsi and Fenwick ratings.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <ChartBar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Real-time match statistics
                    </li>
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Advanced player analytics
                    </li>
                    <li className="flex items-center gap-3 text-base">
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="clean-feature-card">
              <CardHeader>
                <div className="clean-feature-header">
                  <div className="clean-feature-icon bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <Coins className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="clean-feature-title">
                    Token Reward System
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="clean-feature-content">
                  <p className="clean-feature-text">
                    Earn SCS tokens completely free by participating in matches, achieving milestones, and contributing
                    to the community. Redeem tokens for exclusive prizes, merchandise, and special league privileges.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-emerald-500/20 rounded-md">
                        <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Free prize redemption
                    </li>
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-emerald-500/20 rounded-md">
                        <Medal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Achievement rewards
                    </li>
                    <li className="flex items-center gap-3 text-base">
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="clean-feature-card">
              <CardHeader>
                <div className="clean-feature-header">
                  <div className="clean-feature-icon bg-gradient-to-r from-indigo-500 to-indigo-600">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="clean-feature-title">
                    Professional Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="clean-feature-content">
                  <p className="clean-feature-text">
                    Complete team management system with salary caps, contract negotiations, trade deadlines, waiver
                    claims, and draft systems that create an authentic NHL franchise experience.
                  </p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-indigo-500/20 rounded-md">
                        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Trade & waiver system
                    </li>
                    <li className="flex items-center gap-3 text-base">
                      <div className="p-1 bg-indigo-500/20 rounded-md">
                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Scheduled seasons
                    </li>
                    <li className="flex items-center gap-3 text-base">
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

      {/* Main Content with Enhanced Animations */}
      <div className="container mx-auto px-4 py-16 space-y-32">
        {/* Clean Upcoming NHL 26 Matches Section */}
        <motion.section
          className="container mx-auto px-4 py-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="clean-section-header">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6" 
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="clean-icon-container">
                <GamepadIcon className="h-10 w-10 text-white" />
              </div>
              <h2 className="clean-section-title clean-gradient-text">
                Upcoming NHL 26 Matches
              </h2>
            </motion.div>
            <div className="clean-divider" />
            <p className="clean-section-subtitle">
              Live-streamed competitive games with real-time statistics and professional commentary
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
          >
            <Card className="clean-card">
              <CardContent className="p-8">
                {loading.games ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Skeleton className="w-full h-48 rounded-xl" />
                      </motion.div>
                    ))}
                  </div>
                ) : upcomingGames.length > 0 ? (
                  <UpcomingGames games={upcomingGames} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Card className="hockey-card text-center p-16 border-dashed border-2 border-hockey-silver-300/50 dark:border-hockey-silver-600/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/20">
                      <CardContent className="pt-6">
                        <motion.div
                          animate={{ y: [-5, 5, -5] }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                          className="mb-8"
                        >
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/30 to-rink-blue-500/30 rounded-full blur-xl scale-150" />
                            <div className="relative p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                              <Calendar className="h-16 w-16 text-white" />
                            </div>
                          </div>
                        </motion.div>
                        <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
                          No Upcoming Matches
                        </h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-lg max-w-md mx-auto">
                          Check back soon for the next round of competitive NHL 26 games with live streaming and real-time statistics!
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Clean Recent Player Trades Section */}
        <motion.section
          className="container mx-auto px-4 py-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="clean-section-header">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6" 
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="clean-icon-container-emerald">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h2 className="clean-section-title clean-gradient-text-emerald">
                Recent Player Trades
              </h2>
            </motion.div>
            <div className="clean-divider-emerald" />
            <p className="clean-section-subtitle">
              Live transaction feed from our professional trade system with real-time updates
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="clean-card">
              <CardContent className="p-8">
                <RecentTrades />
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Clean Match Results & Standings Section */}
        <motion.section
          className="container mx-auto px-4 py-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="clean-section-header">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6" 
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="clean-icon-container">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h2 className="clean-section-title clean-gradient-text">
                Match Results & Standings
              </h2>
            </motion.div>
            <div className="clean-divider" />
            <p className="clean-section-subtitle">
              Track recent match outcomes and current league standings in real-time with comprehensive statistics
            </p>
          </div>

          <Tabs defaultValue="completed" className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-12 h-12 bg-hockey-silver-800 dark:bg-hockey-silver-900 rounded-lg p-1">
                <TabsTrigger
                  value="completed"
                  className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Recent Match Results</span>
                </TabsTrigger>
                <TabsTrigger
                  value="standings"
                  className="text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-ice-blue-500 data-[state=active]:text-white text-hockey-silver-300 hover:text-white flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  <span>League Standings</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="completed" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading.games ? (
                  <Card className="clean-card">
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
                  <Card className="clean-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
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
                  <Card className="clean-card text-center p-12 border-dashed border-2 border-slate-300/50 dark:border-slate-600/50">
                    <CardContent className="pt-6">
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="mb-6"
                      >
                        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full w-fit mx-auto">
                          <Trophy className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                        No Completed Matches Yet
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Matches will appear here once they're completed. Check back soon for the latest results!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="standings" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading.standings ? (
                  <Card className="clean-card">
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
                  <Card className="clean-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg">
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
                      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
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
                  <Card className="clean-card text-center p-12 border-dashed border-2 border-slate-300/50 dark:border-slate-600/50">
                    <CardContent className="pt-6">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="mb-6"
                      >
                        <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 rounded-full w-fit mx-auto">
                          <Trophy className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                        Standings Not Available
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        League standings will appear here once the season begins. Check back soon for current rankings!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Clean Join the Premier NHL 26 League Card */}
        <motion.section
          className="relative container mx-auto px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="hockey-card relative overflow-hidden">
            <CardContent className="relative p-16 text-center">
              {/* Enhanced Crown Icon */}
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
                className="mb-8"
              >
                <div className="hockey-icon-container mx-auto w-fit">
                  <Crown className="h-16 w-16 text-white drop-shadow-lg" />
                </div>
              </motion.div>

              {/* Clean Title */}
              <motion.h2 
                className="hockey-gradient-text text-5xl md:text-6xl font-black mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Join the Premier NHL 26 League
              </motion.h2>

              {/* Clean Subtitle */}
              <motion.div
                className="mb-8 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-xl md:text-2xl mb-4 leading-relaxed text-slate-600 dark:text-slate-400">
                  Experience the most competitive NHL 26 gaming environment with professional-grade statistics tracking,
                  free token rewards, and authentic hockey league management.
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                  No entry fees, no pay-to-win mechanics - just pure competitive hockey gaming with real rewards!
                </p>
              </motion.div>

              {/* Clean Action Buttons */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    className="hockey-button text-lg px-8 py-4"
                  >
                    <Link href="/register" className="flex items-center gap-3">
                      <Zap className="h-6 w-6" />
                      Register for Season 1
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="hockey-button-secondary text-lg px-8 py-4"
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
                </motion.div>
              </motion.div>

              {/* Clean Stats Grid */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
              >
                {[
                  { value: "100%", label: "Free to Play", icon: Gift, color: "from-emerald-500 to-emerald-600" },
                  { value: "24/7", label: "Stat Tracking", icon: Activity, color: "from-blue-500 to-blue-600" },
                  { value: "Real", label: "Prize Rewards", icon: Trophy, color: "from-red-500 to-red-600" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="clean-stat-item cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="hockey-stat-icon bg-gradient-to-r from-emerald-500 to-emerald-600">
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="hockey-stat-value">
                      {stat.value}
                    </div>
                    <div className="hockey-stat-desc">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Clean Latest SCS News */}
        <motion.section
          className="container mx-auto px-4 py-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="clean-section-header">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6" 
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
            <div className="hockey-icon-container-red">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h2 className="hockey-gradient-text-red text-4xl md:text-5xl font-black">
              Latest SCS News
            </h2>
          </motion.div>
          <div className="hockey-divider-red" />
            <p className="clean-section-subtitle mb-8">
              Stay updated with the latest league announcements, player highlights, and community updates
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Button 
                variant="outline" 
                size="lg"
                asChild 
                className="hockey-button-secondary text-lg px-8 py-4"
              >
                <Link href="/news" className="flex items-center gap-3">
                  <Star className="h-5 w-5" />
                  View All News
                </Link>
              </Button>
            </motion.div>
          </div>

          {loading.news ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Skeleton className="w-full h-80 rounded-xl" />
                </motion.div>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="hockey-card">
                    <NewsCard news={item} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="hockey-card text-center p-16 border-dashed border-2 border-ice-blue-300/50 dark:border-rink-blue-600/50">
                <CardContent className="pt-6">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    className="mb-8"
                  >
                    <div className="hockey-icon-container-red mx-auto w-fit">
                      <Star className="h-16 w-16 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    No News Articles Yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                    Check back soon for the latest league updates, player highlights, and community announcements!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.section>
      </div>
    </div>
  )
}