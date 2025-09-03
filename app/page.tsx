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

  useEffect(() => {
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
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
      subtitle: "The premier NHL 26 competitive gaming league with advanced championship analytics",
    },
    {
      url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200",
      title: "Championship Season 1 Registration",
      subtitle: "Join the elite NHL 26 championship league and earn rewards through our professional token system",
    },
    {
      url: "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/logoheader/scslogo.png?height=600&width=1200",
      title: "Live Championship Arena Streaming",
      subtitle: "Watch professional NHL 26 championship matches with real-time analytics and expert commentary",
    },
  ])

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
        } catch (error: any) {
          console.error("Error fetching standings:", error)
          toast({
            title: "Error loading standings",
            description: error.message || "Failed to load standings data.",
            variant: "destructive",
          })
          setLoading((prev) => ({ ...prev, standings: false }))
        }
      } catch (error: any) {
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
    <div className="min-h-screen relative overflow-hidden bg-background pt-4">
      {/* Enhanced Hockey-Themed Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
        
        {/* Professional floating hockey elements */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full shadow-2xl" />
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-xl flex items-center justify-center shadow-xl">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute top-1/2 left-20 w-14 h-14 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-lg" />
        <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg" />
        
        {/* Ice rink line elements */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent opacity-50" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-secondary/20 to-transparent opacity-50" />
      </div>

      <BannedUserModal />

      {/* Enhanced Hero Section */}
      <div className="relative">
        <HeroCarousel images={heroImages} />
      </div>

      {/* Enhanced Hockey-Themed Stats Section */}
      <section className="relative -mt-20 z-10 mx-4 mb-24">
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
                <div className="inline-flex items-center gap-4 mb-6">
                  <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-80" />
                    <BarChart3 className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-30" />
                  </div>
                </div>
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
                  <div
                    key={stat.label}
                    className="text-center group cursor-pointer"
                  >
                    <div className={`${stat.color} mb-6 mx-auto w-fit p-6 rounded-2xl bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} shadow-xl ${stat.glowColor} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <stat.icon className="h-10 w-10 relative z-10" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="text-5xl font-bold mb-3 bg-gradient-to-br from-primary via-secondary to-primary bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {stat.label}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enhanced About SCS Section with Hockey Theme */}
      <section className="container mx-auto px-4 py-24 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-6 mb-8">
            <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
              <Crown className="h-12 w-12 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
            </div>
            <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              About SCS
            </h2>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
            <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
            <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
          </div>
          
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            The Secret Chel Society is the <span className="font-bold text-primary">premier NHL 26 competitive gaming league</span> with 
            advanced statistical tracking, professional management systems, and a thriving community of dedicated elite players.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="h-full border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl hover:shadow-3xl hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            
            <Card className="h-full border-none bg-transparent">
              <CardContent className="p-12 relative">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative p-5 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                    <GamepadIcon className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
                  </div>
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
          </div>

          <div className="h-full border-2 border-secondary/30 bg-gradient-to-br from-background via-secondary/5 to-primary/5 shadow-2xl hover:shadow-3xl hover:border-secondary/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
            
            <Card className="h-full border-none bg-transparent">
              <CardContent className="p-12 relative">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative p-5 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-90" />
                    <Users className="h-10 w-10 text-white relative z-10" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-secondary to-primary rounded-2xl blur opacity-40" />
                  </div>
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
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-20">
        <Card className="relative bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/15 border-2 border-primary/30 overflow-hidden shadow-3xl">
          <div className="absolute inset-0 hockey-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <CardContent className="relative p-20 text-center">
            <div className="mb-12">
              <div className="relative inline-block">
                <Crown className="h-24 w-24 mx-auto text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl" />
              </div>
            </div>

            <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Join the Elite NHL 26 Championship
            </h2>
            
            <p className="text-2xl mb-8 max-w-5xl mx-auto text-muted-foreground leading-relaxed">
              Experience the <span className="font-bold text-primary">most competitive NHL 26 gaming environment</span> with professional-grade statistics tracking, free token rewards, and authentic hockey league management systems.
            </p>
            
            <p className="text-xl mb-12 max-w-4xl mx-auto text-muted-foreground">
              <span className="font-semibold text-secondary">No entry fees, no pay-to-win mechanics</span> - just pure competitive hockey gaming with real rewards and professional tournament structure!
            </p>

            <div className="flex flex-wrap justify-center gap-10 mb-16">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">100%</div>
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto" />
                </div>
                <div className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Free to Play</div>
              </div>
              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">24/7</div>
                  <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full mx-auto" />
                </div>
                <div className="text-xl font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">Analytics Tracking</div>
              </div>
              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Real</div>
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto" />
                </div>
                <div className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Championship Prizes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Enhanced Tabs Section */}
      <section className="container mx-auto px-4 py-20">
        <Tabs defaultValue="completed" className="w-full">
          <div className="bg-background/80 backdrop-blur-lg border-2 border-primary/20 p-4 rounded-2xl shadow-2xl mb-12">
            <TabsList className="grid w-full grid-cols-2 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-lg rounded-xl border border-primary/20">
              <TabsTrigger
                value="completed"
                className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
              >
                <Trophy className="h-6 w-6" />
                Recent Match Results
              </TabsTrigger>
              <TabsTrigger
                value="standings"
                className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
              >
                <Target className="h-6 w-6" />
                League Standings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="completed">
            <div className="bg-background/95 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-xl overflow-hidden">
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
            </div>
          </TabsContent>

          <TabsContent value="standings">
            <div className="bg-background/95 backdrop-blur-lg border border-secondary/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
              <div className="p-8">
                {loading.standings ? (
                  <Skeleton className="w-full h-96 rounded-xl" />
                ) : (
                  <TeamStandings teams={standings} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Enhanced Latest News */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-8">
            <div className="relative p-6 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-90" />
              <Star className="h-10 w-10 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-secondary to-primary rounded-2xl blur opacity-40" />
            </div>
            <div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent">
                Latest League Updates
              </h2>
              <p className="text-muted-foreground mt-3 text-xl">Stay informed with championship announcements and highlights</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="h-1 w-20 bg-gradient-to-r from-secondary to-primary rounded-full" />
                <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full" />
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            asChild 
            className="hover:bg-gradient-to-r hover:from-secondary/10 hover:to-primary/10 border border-secondary/20 hover:border-secondary/40 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Link href="/news">View All Updates</Link>
          </Button>
        </div>

        {loading.news ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-96 rounded-2xl" />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.map((item) => (
              <div key={item.id} className="group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <NewsCard news={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center p-20 border-2 border-dashed border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 shadow-xl">
            <CardContent className="pt-8">
              <div className="mb-10">
                <Star className="h-24 w-24 mx-auto text-secondary" />
              </div>
              <h3 className="text-3xl font-bold mb-6 text-foreground">No News Updates</h3>
              <p className="text-muted-foreground text-xl max-w-lg mx-auto">
                Check back soon for the latest championship announcements and league updates!
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}