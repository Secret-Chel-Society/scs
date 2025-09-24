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
      url: "/placeholder.svg?height=600&width=1200",
      title: "Welcome to MGHL",
      subtitle: "The premier NHL 25 competitive gaming league with advanced stat tracking",
    },
    {
      url: "/placeholder.svg?height=600&width=1200",
      title: "Season 1 Registration Open",
      subtitle: "Join the most competitive NHL 25 league and earn rewards through our token system",
    },
    {
      url: "/placeholder.svg?height=600&width=1200",
      title: "Live Match Streaming",
      subtitle: "Watch professional NHL 25 matches with real-time statistics and commentary",
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
                  : `/placeholder.svg?height=600&width=1200&query=${encodeURIComponent(img.title || "NHL 25 hockey league")}`,
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      <BannedUserModal />
      <FloatingParticles />

      {/* Enhanced Hockey-Themed Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />

        {/* Hockey-themed animated overlay elements */}
        <motion.div
          className="absolute top-20 right-10 w-20 h-20 border-2 border-primary/30 rounded-full flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Gamepad2 className="h-8 w-8 text-primary/50" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-10 w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Trophy className="h-8 w-8 text-primary/50" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-20 w-12 h-12 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-full"
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
          <Card className="backdrop-blur-md bg-background/90 border-primary/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-red-500/5" />
            <CardContent className="relative p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">MGHL League Statistics</h2>
                <p className="text-muted-foreground">Real-time data from our advanced tracking system</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  {
                    icon: Users,
                    label: "Active Players",
                    value: stats.totalPlayers,
                    color: "text-blue-500",
                    desc: "Registered competitors",
                  },
                  {
                    icon: Trophy,
                    label: "Teams",
                    value: stats.totalTeams,
                    color: "text-green-500",
                    desc: "Active franchises",
                  },
                  {
                    icon: Calendar,
                    label: "Matches Played",
                    value: stats.totalMatches,
                    color: "text-purple-500",
                    desc: "Total games tracked",
                  },
                  {
                    icon: TrendingUp,
                    label: "Completed Trades",
                    value: stats.completedTrades,
                    color: "text-orange-500",
                    desc: "Completed transactions",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center group cursor-pointer"
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
                    <div className="text-3xl font-bold mb-1">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-sm font-medium mb-1">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.desc}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* New: About MGHL Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <motion.div className="inline-flex items-center gap-3 mb-4" whileHover={{ scale: 1.05 }}>
            <div className="p-3 bg-gradient-to-r from-primary to-primary/60 rounded-xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              About MGHL
            </h2>
          </motion.div>
          <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mb-6" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-primary/20 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <GamepadIcon className="h-6 w-6 text-primary" />
                  Premier NHL 25 League
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Major Gaming Hockey League (MGHL) is the most competitive and professionally organized NHL 25
                  gaming league available today. We provide a complete hockey simulation experience with structured
                  seasons, playoffs, and championship tournaments that mirror real NHL operations.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our league features multiple divisions, comprehensive team management systems, player trades, free
                  agency periods, and a complete statistical tracking system that records every aspect of gameplay
                  performance.
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
            <Card className="h-full border-primary/20 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  Professional Community
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Join hundreds of dedicated NHL 25 players in a mature, competitive environment. Our community includes
                  experienced gamers, team managers, and hockey enthusiasts who are passionate about strategic gameplay
                  and fair competition.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We maintain high standards for sportsmanship and competitive integrity, with dedicated moderators and
                  comprehensive rules that ensure every match is played fairly and professionally.
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
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Advanced League Features
            </h2>
          </motion.div>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-transparent rounded-full mx-auto mb-6" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl">Custom API Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our proprietary API system automatically tracks and analyzes every aspect of NHL 25 gameplay,
                  including goals, assists, saves, shots, face-off wins, and advanced metrics like Corsi and Fenwick
                  ratings.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <ChartBar className="h-4 w-4 text-blue-500" />
                    Real-time match statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Advanced player analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
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
            <Card className="h-full border-green-500/20 bg-gradient-to-br from-background to-green-500/5 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Coins className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-xl">Token Reward System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Earn MGHL tokens completely free by participating in matches, achieving milestones, and contributing
                  to the community. Redeem tokens for exclusive prizes, merchandise, and special league privileges.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-500" />
                    Free prize redemption
                  </li>
                  <li className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-green-500" />
                    Achievement rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
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
            <Card className="h-full border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-xl">Professional Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Complete team management system with salary caps, contract negotiations, trade deadlines, waiver
                  claims, and draft systems that create an authentic NHL franchise experience.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Trade & waiver system
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    Scheduled seasons
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
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
              className="p-3 bg-gradient-to-r from-primary to-primary/60 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <GamepadIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Upcoming NHL 25 Matches
              </h2>
              <p className="text-muted-foreground mt-1">Live-streamed competitive games with real-time statistics</p>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-transparent rounded-full mt-2" />
            </div>
          </div>

          <motion.div
            className="relative z-40 bg-background/95 backdrop-blur-sm rounded-lg"
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
              <Card className="text-center p-8 border-dashed border-2 border-muted-foreground/20">
                <CardContent className="pt-6">
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  </motion.div>
                  <p className="text-muted-foreground">
                    No upcoming matches scheduled. Check back soon for the next round of competitive NHL 25 games!
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
              className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <TrendingUp className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Recent Player Trades
              </h2>
              <p className="text-muted-foreground mt-1">Live transaction feed from our professional trade system</p>
              <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-transparent rounded-full mt-2" />
            </div>
          </div>
          <div className="relative z-30 bg-background/95 backdrop-blur-sm rounded-lg">
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
          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Recent Match Results
              </TabsTrigger>
              <TabsTrigger
                value="standings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
              >
                <Target className="h-4 w-4 mr-2" />
                League Standings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="completed">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading.games ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-40 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <CompletedGames games={completedGames} />
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="standings">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading.standings ? (
                  <Skeleton className="w-full h-96 rounded-lg" />
                ) : (
                  <TeamStandings teams={standings} />
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
          <Card className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-12 -translate-x-12" />

            <CardContent className="relative p-12 text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                className="mb-6"
              >
                <Crown className="h-16 w-16 mx-auto text-primary" />
              </motion.div>

              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Join the Premier NHL 25 League
              </h2>
              <p className="text-xl mb-4 max-w-3xl mx-auto text-muted-foreground">
                Experience the most competitive NHL 25 gaming environment with professional-grade statistics tracking,
                free token rewards, and authentic hockey league management.
              </p>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
                No entry fees, no pay-to-win mechanics - just pure competitive hockey gaming with real rewards!
              </p>

              <div className="flex flex-wrap justify-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
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
                    className="border-primary/30 hover:bg-primary/10 backdrop-blur-sm bg-transparent"
                  >
                    <Link
                      href="https://discord.gg/mghl"
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
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Free to Play</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Stat Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Real</div>
                  <div className="text-sm text-muted-foreground">Prize Rewards</div>
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
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Star className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Latest MGHL News
                </h2>
                <p className="text-muted-foreground mt-1">Stay updated with league announcements and highlights</p>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-transparent rounded-full mt-2" />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" asChild className="hover:bg-primary/10">
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
            <Card className="text-center p-8 border-dashed border-2 border-muted-foreground/20">
              <CardContent className="pt-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                </motion.div>
                <p className="text-muted-foreground">
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
