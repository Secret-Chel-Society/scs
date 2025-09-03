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
import { useSearchParams } from "next/navigation"

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
  const searchParams = useSearchParams()
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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Enhanced Hockey-Themed Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
        
        {/* Professional floating hockey elements */}
        <motion.div
          className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full shadow-2xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-xl flex items-center justify-center shadow-xl"
          animate={{ y: [-15, 15, -15], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Trophy className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-20 w-14 h-14 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-lg"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-8 h-8 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg"
          animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        
        {/* Ice rink line elements */}
        <motion.div
          className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-secondary/20 to-transparent"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, delay: 2.5 }}
        />
      </div>

      <BannedUserModal />
      <FloatingParticles />

      {/* Enhanced Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />
      </div>

      {/* Enhanced Hockey-Themed Stats Section */}
      <motion.section
        className="relative -mt-20 z-10 mx-4 mb-24"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto">
          <Card className="backdrop-blur-lg bg-background/95 border-primary/30 shadow-2xl overflow-hidden relative">
            {/* Enhanced hockey rink-inspired background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-secondary/5 to-primary/8" />
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary opacity-50" />
            
            {/* Ice rink corner elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
            
            <CardContent className="relative p-10">
              <div className="text-center mb-12">
                <motion.div
                  className="inline-flex items-center gap-4 mb-6"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-80" />
                    <BarChart3 className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-30" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SCS League Analytics Hub
                </h2>
                <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                  Real-time statistical data powered by our advanced NHL 26 tracking API
                </p>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="h-1 w-24 bg-gradient-to-r from-transparent to-primary rounded-full" />
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent rounded-full" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                {[
                  {
                    icon: Users,
                    label: "Active Players",
                    value: stats.totalPlayers,
                    color: "text-primary",
                    desc: "Elite competitors",
                    bgGradient: "from-primary/15 to-primary/25",
                    borderColor: "border-primary/40",
                    glowColor: "shadow-primary/20",
                  },
                  {
                    icon: Trophy,
                    label: "Teams",
                    value: stats.totalTeams,
                    color: "text-secondary",
                    desc: "Professional franchises",
                    bgGradient: "from-secondary/15 to-secondary/25",
                    borderColor: "border-secondary/40",
                    glowColor: "shadow-secondary/20",
                  },
                  {
                    icon: Calendar,
                    label: "Matches Played",
                    value: stats.totalMatches,
                    color: "text-primary",
                    desc: "Games tracked",
                    bgGradient: "from-primary/15 to-secondary/15",
                    borderColor: "border-primary/40",
                    glowColor: "shadow-primary/20",
                  },
                  {
                    icon: TrendingUp,
                    label: "Completed Trades",
                    value: stats.completedTrades,
                    color: "text-secondary",
                    desc: "Successful transactions",
                    bgGradient: "from-secondary/15 to-primary/15",
                    borderColor: "border-secondary/40",
                    glowColor: "shadow-secondary/20",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center group cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.08, y: -8 }}
                  >
                    <motion.div
                      className={`${stat.color} mb-6 mx-auto w-fit p-6 rounded-2xl bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} shadow-xl ${stat.glowColor} relative overflow-hidden`}
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <stat.icon className="h-10 w-10 relative z-10" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                    <div className="text-5xl font-bold mb-3 bg-gradient-to-br from-primary via-secondary to-primary bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {stat.label}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.desc}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Enhanced About SCS Section with Hockey Theme */}
      <motion.section
        className="container mx-auto px-4 py-24 relative"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-20">
          <motion.div 
            className="inline-flex items-center gap-6 mb-8" 
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
              <Crown className="h-12 w-12 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
            </div>
            <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              About SCS
            </h2>
          </motion.div>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
            <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
            <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
          </div>
          
          <motion.p 
            className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            The Secret Chel Society is the <span className="font-bold text-primary">premier NHL 26 competitive gaming league</span> with 
            advanced statistical tracking, professional management systems, and a thriving community of dedicated elite players.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl hover:shadow-3xl hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              
              <CardContent className="p-12 relative">
                <div className="flex items-center gap-6 mb-8">
                  <motion.div 
                    className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                    <GamepadIcon className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
                  </motion.div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    Premier NHL 26 League
                  </h3>
                </div>
                <div className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    The Secret Chel Society (SCS) is the <span className="font-semibold text-primary">most competitive and professionally organized NHL 26 gaming league</span> available today. We provide a complete hockey simulation experience with structured seasons, playoffs, and championship tournaments that mirror real NHL operations.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    We deliver a comprehensive hockey experience with multiple divisions and in-depth team management. Players can engage in the full spectrum of league activities, from <span className="font-semibold text-secondary">trades and free agency</span> to our complete statistical system that tracks every detail of on-ice performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-secondary/30 bg-gradient-to-br from-background via-secondary/5 to-primary/5 shadow-2xl hover:shadow-3xl hover:border-secondary/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
              
              <CardContent className="p-12 relative">
                <div className="flex items-center gap-6 mb-8">
                  <motion.div 
                    className="relative p-5 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-xl"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-90" />
                    <Users className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-secondary to-primary rounded-2xl blur opacity-40" />
                  </motion.div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    Professional Community
                  </h3>
                </div>
                <div className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Connect with hundreds of dedicated NHL 26 players in a <span className="font-semibold text-secondary">top-tier competitive environment</span>. Our community consists of seasoned gamers and hockey enthusiasts who are passionate about strategic play and sportsmanship.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    <span className="font-semibold text-primary">Competitive integrity</span> is at the heart of our community. Our dedicated team of moderators enforces a robust rule set, fostering an environment where every match is played with sportsmanship and professionalism.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Hockey Analytics & Features Section */}
      <motion.section
        className="container mx-auto px-4 py-24 relative"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-20">
          <motion.div 
            className="inline-flex items-center gap-6 mb-8" 
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
              <Database className="h-12 w-12 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
            </div>
            <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Advanced League Systems
            </h2>
          </motion.div>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
            <div className="h-3 w-3 bg-secondary rounded-full animate-pulse" />
            <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
          </div>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Professional-grade features designed for the ultimate NHL 26 competitive experience
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 hover:shadow-2xl hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/30 shadow-lg group-hover:shadow-xl"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Custom API Analytics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                 Our proprietary API system provides detailed statistical tracking and analysis for every aspect of NHL 26 gameplay. It automatically records all key metrics, from goals and assists to advanced analytics like <span className="font-semibold text-primary">Corsi and Fenwick ratings</span>.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <ChartBar className="h-6 w-6 text-primary" />
                    <span className="text-foreground font-medium">Real-time match statistics</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Activity className="h-6 w-6 text-secondary" />
                    <span className="text-foreground font-medium">Advanced player analytics</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Database className="h-6 w-6 text-primary" />
                    <span className="text-foreground font-medium">Historical performance data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-secondary/30 bg-gradient-to-br from-background via-secondary/5 to-primary/5 hover:shadow-2xl hover:border-secondary/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
              
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl border border-secondary/30 shadow-lg group-hover:shadow-xl"
                    whileHover={{ scale: 1.15, rotate: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Coins className="h-8 w-8 text-secondary" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    Token Reward System
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                  Earn SCS tokens <span className="font-semibold text-secondary">completely free</span> by participating in matches, achieving milestones, and contributing to the community. Redeem tokens for exclusive prizes, merchandise, and special league privileges.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Gift className="h-6 w-6 text-secondary" />
                    <span className="text-foreground font-medium">Free prize redemption</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Medal className="h-6 w-6 text-primary" />
                    <span className="text-foreground font-medium">Achievement rewards</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Star className="h-6 w-6 text-secondary" />
                    <span className="text-foreground font-medium">Exclusive league perks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 hover:shadow-2xl hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/30 shadow-lg group-hover:shadow-xl"
                    whileHover={{ scale: 1.15, rotate: 15 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Shield className="h-8 w-8 text-primary" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Professional Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                  Complete team management system with <span className="font-semibold text-primary">salary caps, contract negotiations</span>, trade deadlines, waiver claims, and draft systems that create an authentic NHL franchise experience.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span className="text-foreground font-medium">Trade & waiver system</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Clock className="h-6 w-6 text-secondary" />
                    <span className="text-foreground font-medium">Scheduled seasons</span>
                  </li>
                  <li className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Award className="h-6 w-6 text-primary" />
                    <span className="text-foreground font-medium">Championship playoffs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Main Content */}
      <div className="container mx-auto px-4 py-24 space-y-40">
        {/* Enhanced Upcoming Games Section with Hockey Arena Theme */}
        <motion.section
          className="relative z-40"
          style={{ y: y1 }}
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-8 mb-12">
            <motion.div
              className="relative p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 8 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
              <GamepadIcon className="h-10 w-10 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
            </motion.div>
            <div>
              <motion.h2 
                className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Upcoming NHL 26 Arena
              </motion.h2>
              <p className="text-muted-foreground mt-3 text-xl">Live-streamed professional matches with advanced real-time analytics</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full" />
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <div className="h-1 w-20 bg-gradient-to-r from-secondary to-primary rounded-full" />
              </div>
            </div>
          </div>

          <motion.div
            className="relative z-40 bg-background/95 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              {loading.games ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="w-full h-52 rounded-xl" />
                  ))}
                </div>
              ) : upcomingGames.length > 0 ? (
                <div className="p-8">
                  <UpcomingGames games={upcomingGames} />
                </div>
              ) : (
                <div className="p-8">
                  <Card className="text-center p-16 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="pt-6">
                      <motion.div
                        animate={{ y: [-8, 8, -8], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <Calendar className="h-20 w-20 mx-auto mb-8 text-primary" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-4 text-foreground">No Scheduled Matches</h3>
                      <p className="text-muted-foreground text-xl max-w-md mx-auto">
                        Check back soon for the next round of competitive NHL 26 arena battles!
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </motion.div>
        </motion.section>

        {/* Enhanced Professional Trades Section */}
        <motion.section
          className="relative z-30"
          style={{ y: y2 }}
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-8 mb-12">
            <motion.div
              className="relative p-6 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-2xl"
              whileHover={{ scale: 1.1, rotate: -8 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-90" />
              <TrendingUp className="h-10 w-10 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-secondary to-primary rounded-2xl blur opacity-40" />
            </motion.div>
            <div>
              <motion.h2 
                className="text-5xl font-bold bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Professional Trade Hub
              </motion.h2>
              <p className="text-muted-foreground mt-3 text-xl">Live transaction feed from our advanced management system</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="h-1 w-20 bg-gradient-to-r from-secondary to-primary rounded-full" />
                <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full" />
              </div>
            </div>
          </div>
          <motion.div 
            className="relative z-30 bg-background/95 backdrop-blur-lg border border-secondary/20 rounded-2xl shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
            <div className="p-8">
              <RecentTrades />
            </div>
          </motion.div>
        </motion.section>

        {/* Enhanced Hockey Analytics Tabs Section */}
        <motion.section
          className="relative z-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Tabs defaultValue="completed" className="w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-background/80 backdrop-blur-lg border border-primary/20 p-3 rounded-2xl shadow-xl">
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-4 text-lg font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <Trophy className="h-6 w-6" />
                  Recent Match Results
                </TabsTrigger>
                <TabsTrigger
                  value="standings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-4 text-lg font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <Target className="h-6 w-6" />
                  League Standings
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="completed">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-background/95 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                <div className="p-8">
                  {loading.games ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-52 rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <CompletedGames games={completedGames} />
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="standings">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-background/95 backdrop-blur-lg border border-secondary/20 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
                <div className="p-8">
                  {loading.standings ? (
                    <Skeleton className="w-full h-96 rounded-xl" />
                  ) : (
                    <TeamStandings teams={standings} />
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Enhanced Championship Call to Action */}
        <motion.section
          className="relative overflow-hidden z-20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="relative bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/15 border-2 border-primary/30 overflow-hidden shadow-3xl">
            <div className="absolute inset-0 hockey-grid opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
            
            {/* Enhanced floating elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full translate-y-20 -translate-x-20 blur-3xl" />

            <CardContent className="relative p-20 text-center">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
                className="mb-12"
              >
                <div className="relative inline-block">
                  <Crown className="h-24 w-24 mx-auto text-primary relative z-10" />
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl" />
                </div>
              </motion.div>

              <motion.h2 
                className="text-6xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Join the Elite NHL 26 Championship
              </motion.h2>
              
              <motion.p 
                className="text-2xl mb-8 max-w-5xl mx-auto text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Experience the <span className="font-bold text-primary">most competitive NHL 26 gaming environment</span> with professional-grade statistics tracking, free token rewards, and authentic hockey league management systems.
              </motion.p>
              
              <motion.p 
                className="text-xl mb-12 max-w-4xl mx-auto text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <span className="font-semibold text-secondary">No entry fees, no pay-to-win mechanics</span> - just pure competitive hockey gaming with real rewards and professional tournament structure!
              </motion.p>

              <motion.div 
                className="flex flex-wrap justify-center gap-10 mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div whileHover={{ scale: 1.08, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-2xl hover:shadow-3xl text-xl px-10 py-8 rounded-xl font-bold transition-all duration-300"
                  >
                    <Link href="/register" className="flex items-center gap-4">
                      <Zap className="h-7 w-7" />
                      Register for Season 1
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.08, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="border-2 border-primary/40 hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 hover:border-primary/60 backdrop-blur-lg bg-background/50 text-xl px-10 py-8 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Link
                      href="https://discord.gg/secretchelsociety"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4"
                    >
                      <img
                        src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                        alt="Discord"
                        className="h-7 w-7"
                      />
                      Join Elite Community
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05, y: -3 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative mb-4">
                    <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">100%</div>
                    <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto" />
                  </div>
                  <div className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Free to Play</div>
                </motion.div>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05, y: -3 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative mb-4">
                    <div className="text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">24/7</div>
                    <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full mx-auto" />
                  </div>
                  <div className="text-xl font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">Analytics Tracking</div>
                </motion.div>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05, y: -3 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative mb-4">
                    <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Real</div>
                    <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto" />
                  </div>
                  <div className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Championship Prizes</div>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Enhanced League News & Updates */}
        <motion.section
          className="relative z-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-8">
              <motion.div
                className="relative p-6 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-90" />
                <Star className="h-10 w-10 text-white relative z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-secondary to-primary rounded-2xl blur opacity-40" />
              </motion.div>
              <div>
                <motion.h2 
                  className="text-5xl font-bold bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  Latest League Updates
                </motion.h2>
                <p className="text-muted-foreground mt-3 text-xl">Stay informed with championship announcements and highlights</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-1 w-20 bg-gradient-to-r from-secondary to-primary rounded-full" />
                  <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full" />
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.08, y: -3 }}>
              <Button 
                variant="ghost" 
                asChild 
                className="hover:bg-gradient-to-r hover:from-secondary/10 hover:to-primary/10 border border-secondary/20 hover:border-secondary/40 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Link href="/news">View All Updates</Link>
              </Button>
            </motion.div>
          </div>

          {loading.news ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-96 rounded-2xl" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 100 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <NewsCard news={item} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="text-center p-20 border-2 border-dashed border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 shadow-xl">
              <CardContent className="pt-8">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                  className="mb-10"
                >
                  <Star className="h-24 w-24 mx-auto text-secondary" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-6 text-foreground">No News Updates</h3>
                <p className="text-muted-foreground text-xl max-w-lg mx-auto">
                  Check back soon for the latest championship announcements and league updates!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.section>
      </div>
    </div>
  )
}
