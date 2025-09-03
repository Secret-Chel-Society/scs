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
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
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

        setLoading((prev) => ({ ...prev, games: false }))

        // Fetch team standings
        try {
          const response = await fetch("/api/standings")
          if (!response.ok) throw new Error("Failed to fetch standings")
          const data = await response.json()
          setStandings(data.standings || [])
          setLoading((prev) => ({ ...prev, standings: false }))
        } catch (error) {
          console.error("Error fetching standings:", error)
          toast({
            title: "Error loading standings",
            description: error.message || "Failed to load standings data.",
            variant: "destructive",
          })
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
        })
      }
    }

    fetchData()
  }, [supabase, toast])

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <BannedUserModal />
      <FloatingParticles />

      {/* Enhanced Hockey-Themed Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />

        {/* Hockey-themed animated overlay elements */}
        <motion.div
          className="absolute top-20 right-10 w-20 h-20 border-2 border-ice-blue-500/30 rounded-full flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Gamepad2 className="h-8 w-8 text-ice-blue-500/50" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-10 w-16 h-16 bg-goal-red-500/20 rounded-lg flex items-center justify-center"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Trophy className="h-8 w-8 text-goal-red-500/50" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-20 w-12 h-12 bg-gradient-to-r from-ice-blue-500/20 to-goal-red-500/20 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>

      {/* Enhanced Stats Section with Hockey Theme */}
      <motion.section
        className="relative -mt-20 z-10 mx-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto">
          <Card className="hockey-card backdrop-blur-md bg-white/95 dark:bg-hockey-silver-900/95 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/5 via-transparent to-goal-red-500/5" />
            <CardContent className="relative p-8">
              <div className="text-center mb-8">
                <h2 className="hockey-title text-2xl mb-2">SCS League Statistics</h2>
                <p className="hockey-subtitle">Real-time data from our advanced tracking system</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  {
                    icon: Users,
                    label: "Active Players",
                    value: stats.totalPlayers,
                    color: "text-ice-blue-600 dark:text-ice-blue-400",
                    desc: "Registered competitors",
                  },
                  {
                    icon: Trophy,
                    label: "Teams",
                    value: stats.totalTeams,
                    color: "text-assist-green-600 dark:text-assist-green-400",
                    desc: "Active franchises",
                  },
                  {
                    icon: Calendar,
                    label: "Matches Played",
                    value: stats.totalMatches,
                    color: "text-rink-blue-600 dark:text-rink-blue-400",
                    desc: "Total games tracked",
                  },
                  {
                    icon: TrendingUp,
                    label: "Completed Trades",
                    value: stats.completedTrades,
                    color: "text-goal-red-600 dark:text-goal-red-400",
                    desc: "Completed transactions",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="hockey-stat-item text-center group cursor-pointer"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      className={`${stat.color} mb-2 mx-auto w-fit`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="h-8 w-8" />
                    </motion.div>
                    <div className="text-3xl font-bold mb-1 text-hockey-silver-800 dark:text-hockey-silver-200">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-sm font-medium mb-1 text-hockey-silver-700 dark:text-hockey-silver-300">{stat.label}</div>
                    <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">{stat.desc}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* New: About SCS Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <motion.div className="inline-flex items-center gap-3 mb-4" whileHover={{ scale: 1.05 }}>
            <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="hockey-title text-4xl font-bold bg-gradient-to-r from-goal-red-500 to-goal-red-600 bg-clip-text text-transparent">
              About SCS
            </h2>
          </motion.div>
          <div className="h-1 w-32 bg-gradient-to-r from-goal-red-500 to-transparent rounded-full mx-auto mb-6" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-card h-full border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-hockey-silver-800 dark:text-hockey-silver-200">
                  <GamepadIcon className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
                  Premier NHL 26 League
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed mb-4">
                  The Secret Chel Society (SCS) is the most competitive and professionally organized NHL 26
                  gaming league available today. We provide a complete hockey simulation experience with structured
                  seasons, playoffs, and championship tournaments that mirror real NHL operations.
                </p>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed">
                  We provide a comprehensive hockey experience with multiple divisions and in-depth team management. 
                  Players can engage in a full range of league activities, 
                  from trades and free agency to a complete statistical system that tracks every detail of on-ice performance.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-card h-full border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-hockey-silver-800 dark:text-hockey-silver-200">
                  <Users className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
                  Professional Community
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed mb-4">
                  Connect with hundreds of dedicated NHL 26 players in a top-tier competitive environment. 
                  Our community consists of seasoned gamers and 
                  hockey enthusiasts who are passionate about strategic play and sportsmanship.
                </p>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed">
                  Competitive integrity is at the heart of our community. 
                  Our dedicated team of moderators enforces a robust rule set, 
                  fostering an environment where every match is played with sportsmanship and professionalism.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* New: Advanced Features Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <motion.div className="inline-flex items-center gap-3 mb-4" whileHover={{ scale: 1.05 }}>
            <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h2 className="hockey-title text-4xl font-bold bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 bg-clip-text text-transparent">
              Advanced League Features
            </h2>
          </motion.div>
          <div className="h-1 w-32 bg-gradient-to-r from-ice-blue-500 to-transparent rounded-full mx-auto mb-6" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-card h-full border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ice-blue-500/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">Custom API Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed mb-4">
                 Our proprietary API system provides detailed statistical tracking and analysis for every aspect of NHL 26 gameplay. 
                 It automatically records all key metrics, from goals and assists to advanced analytics like Corsi and Fenwick ratings.
                </p>
                <ul className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <ChartBar className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Real-time match statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Advanced player analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Historical performance data
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-card h-full border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-assist-green-500/20 rounded-lg">
                    <Coins className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
                  </div>
                  <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">Token Reward System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed mb-4">
                  Earn SCS tokens completely free by participating in matches, achieving milestones, and contributing
                  to the community. Redeem tokens for exclusive prizes, merchandise, and special league privileges.
                </p>
                <ul className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Free prize redemption
                  </li>
                  <li className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Achievement rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Exclusive league perks
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="hockey-card h-full border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rink-blue-500/20 rounded-lg">
                    <Shield className="h-6 w-6 text-rink-blue-600 dark:text-rink-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">Professional Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 leading-relaxed mb-4">
                  Complete team management system with salary caps, contract negotiations, trade deadlines, waiver
                  claims, and draft systems that create an authentic NHL franchise experience.
                </p>
                <ul className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    Trade & waiver system
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    Scheduled seasons
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    Championship playoffs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content with Enhanced Animations */}
      <div className="container mx-auto px-4 py-16 space-y-32">
        {/* Enhanced Upcoming Games Section */}
        <motion.section
          className="relative z-40"
          style={{ y: y1 }}
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <GamepadIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="hockey-title text-3xl font-bold bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 bg-clip-text text-transparent">
                Upcoming NHL 26 Matches
              </h2>
              <p className="hockey-subtitle mt-1">Live-streamed competitive games with real-time statistics</p>
              <div className="h-1 w-20 bg-gradient-to-r from-ice-blue-500 to-transparent rounded-full mt-2" />
            </div>
          </div>

          <motion.div
            className="relative z-40 bg-white/95 dark:bg-hockey-silver-900/95 backdrop-blur-sm rounded-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {loading.games ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-40 rounded-lg" />
                ))}
              </div>
            ) : upcomingGames.length > 0 ? (
              <UpcomingGames games={upcomingGames} />
            ) : (
              <Card className="hockey-card text-center p-8 border-dashed border-2 border-hockey-silver-300/50 dark:border-hockey-silver-600/50">
                <CardContent className="pt-6">
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-hockey-silver-400 dark:text-hockey-silver-500" />
                  </motion.div>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    No upcoming matches scheduled. Check back soon for the next round of competitive NHL 26 games!
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.section>

        {/* Enhanced Recent Trades Section */}
        <motion.section
          className="relative z-30"
          style={{ y: y2 }}
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <TrendingUp className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="hockey-title text-3xl font-bold bg-gradient-to-r from-assist-green-500 to-assist-green-600 bg-clip-text text-transparent">
                Recent Player Trades
              </h2>
              <p className="hockey-subtitle mt-1">Live transaction feed from our professional trade system</p>
              <div className="h-1 w-20 bg-gradient-to-r from-assist-green-500 to-transparent rounded-full mt-2" />
            </div>
          </div>
          <div className="relative z-30 bg-white/95 dark:bg-hockey-silver-900/95 backdrop-blur-sm rounded-lg">
            <RecentTrades />
          </div>
        </motion.section>

        {/* Enhanced Tabs Section - Now only 2 tabs */}
        <motion.section
          className="relative z-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <motion.div className="inline-flex items-center gap-3 mb-4" whileHover={{ scale: 1.05 }}>
              <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h2 className="hockey-title text-4xl font-bold bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 bg-clip-text text-transparent">
                Match Results & Standings
              </h2>
            </motion.div>
            <div className="h-1 w-32 bg-gradient-to-r from-ice-blue-500 to-transparent rounded-full mx-auto mb-6" />
            <p className="hockey-subtitle text-lg max-w-2xl mx-auto">
              Track recent match outcomes and current league standings in real-time
            </p>
          </div>

          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 p-1 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg">
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <div className="p-1 bg-white/20 rounded-lg">
                  <Trophy className="h-4 w-4" />
                </div>
                Recent Match Results
              </TabsTrigger>
              <TabsTrigger
                value="standings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <div className="p-1 bg-white/20 rounded-lg">
                  <Target className="h-4 w-4" />
                </div>
                League Standings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="completed" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading.games ? (
                  <Card className="hockey-card">
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
                  <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                            Recent Match Results
                          </div>
                          <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
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
                  <Card className="hockey-card text-center p-12 border-dashed border-2 border-hockey-silver-300/50 dark:border-hockey-silver-600/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                    <CardContent className="pt-6">
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="mb-6"
                      >
                        <div className="p-4 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full w-fit mx-auto">
                          <Trophy className="h-16 w-16 text-ice-blue-600 dark:text-ice-blue-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">
                        No Completed Matches Yet
                      </h3>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 max-w-md mx-auto">
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
                  <Card className="hockey-card">
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
                  <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                            League Standings
                          </div>
                          <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                            Current team rankings and playoff race positions
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 p-4 bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 rounded-xl border border-assist-green-200/50 dark:border-assist-green-700/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-assist-green-800 dark:text-assist-green-200">
                            Playoff Race Update
                          </h4>
                        </div>
                        <p className="text-sm text-assist-green-700 dark:text-assist-green-300">
                          Top 8 teams qualify for playoffs. Current standings show {standings.slice(0, 8).length} teams in playoff positions.
                        </p>
                      </div>
                      <TeamStandings teams={standings} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="hockey-card text-center p-12 border-dashed border-2 border-hockey-silver-300/50 dark:border-hockey-silver-600/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                    <CardContent className="pt-6">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="mb-6"
                      >
                        <div className="p-4 bg-gradient-to-r from-rink-blue-500/20 to-rink-blue-500/20 rounded-full w-fit mx-auto">
                          <Target className="h-16 w-16 text-rink-blue-600 dark:text-rink-blue-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">
                        Standings Not Available
                      </h3>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 max-w-md mx-auto">
                        League standings will appear here once the season begins. Check back soon for current rankings!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Enhanced Call to Action */}
        <motion.section
          className="relative overflow-hidden z-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="hockey-card relative bg-gradient-to-br from-ice-blue-500/20 via-ice-blue-300/10 to-transparent border-ice-blue-300/50 dark:border-ice-blue-600/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-ice-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-ice-blue-500/10 rounded-full translate-y-12 -translate-x-12" />

            <CardContent className="relative p-12 text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                className="mb-6"
              >
                <Crown className="h-16 w-16 mx-auto text-ice-blue-600 dark:text-ice-blue-400" />
              </motion.div>

              <h2 className="hockey-title text-4xl font-bold mb-4 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 bg-clip-text text-transparent">
                Join the Premier NHL 26 League
              </h2>
              <p className="hockey-subtitle text-xl mb-4 max-w-3xl mx-auto">
                Experience the most competitive NHL 26 gaming environment with professional-grade statistics tracking,
                free token rewards, and authentic hockey league management.
              </p>
              <p className="hockey-subtitle text-lg mb-8 max-w-2xl mx-auto">
                No entry fees, no pay-to-win mechanics - just pure competitive hockey gaming with real rewards!
              </p>

              <div className="flex flex-wrap justify-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 hover:from-ice-blue-600 hover:to-ice-blue-700 shadow-lg"
                  >
                    <Link href="/register" className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Register for Season 1
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="border-ice-blue-300/50 dark:border-ice-blue-600/50 hover:bg-ice-blue-500/10 backdrop-blur-sm bg-transparent"
                  >
                    <Link
                      href="https://discord.gg/secretchelsociety"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <img
                        src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                        alt="Discord"
                        className="h-5 w-5"
                      />
                      Join Discord Community
                    </Link>
                  </Button>
                </motion.div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">100%</div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Free to Play</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">24/7</div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Stat Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">Real</div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Prize Rewards</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Enhanced Latest News */}
        <motion.section
          className="relative z-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Star className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="hockey-title text-3xl font-bold bg-gradient-to-r from-goal-red-500 to-goal-red-600 bg-clip-text text-transparent">
                  Latest SCS News
                </h2>
                <p className="hockey-subtitle mt-1">Stay updated with league announcements and highlights</p>
                <div className="h-1 w-20 bg-gradient-to-r from-goal-red-500 to-transparent rounded-full mt-2" />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" asChild className="hover:bg-goal-red-500/10">
                <Link href="/news">View All News</Link>
              </Button>
            </motion.div>
          </div>

          {loading.news ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-64 rounded-lg" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <NewsCard news={item} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="hockey-card text-center p-8 border-dashed border-2 border-hockey-silver-300/50 dark:border-hockey-silver-600/50">
              <CardContent className="pt-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Star className="h-12 w-12 mx-auto mb-4 text-hockey-silver-400 dark:text-hockey-silver-500" />
                </motion.div>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                  No news articles available yet. Check back soon for league updates!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.section>
      </div>
    </div>
  )
}