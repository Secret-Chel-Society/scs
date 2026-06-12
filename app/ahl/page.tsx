"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Trophy, Calendar, ChevronRight, ArrowRight, Users, Star, TrendingUp, 
  Newspaper, Clock, Play, ArrowLeftRight, ChevronLeft, Zap
} from "lucide-react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"
import { calculateAHLStandings, getAHLSeasons } from "@/lib/ahl-standings-calculator"
import { MembersOnline } from "@/components/members-online"

/* ========================= Constants ========================= */

const EST_TZ = "America/New_York"
const AHL_LOGO = "https://recxpnhghofuerpyqysb.supabase.co/storage/v1/object/public/media/photos/general/0T7oa-removebg-preview.png"

/* ========================= Types ========================= */

type RibbonMatch = {
  id: string
  match_date: string
  status: string
  home_score: number | null
  away_score: number | null
  home_team: { id: string; name: string; logo_url?: string | null } | null
  away_team: { id: string; name: string; logo_url?: string | null } | null
  has_overtime?: boolean | null
}

/* ========================= Date Helpers ========================= */

function estTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

function isoDateInEST(iso: string) {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")!.value
  const m = parts.find((p) => p.type === "month")!.value
  const day = parts.find((p) => p.type === "day")!.value
  return `${y}-${m}-${day}`
}

function midnightESTAsUTC(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  }).formatToParts(d)
  const y = Number(parts.find((p) => p.type === "year")!.value)
  const m = Number(parts.find((p) => p.type === "month")!.value)
  const day = Number(parts.find((p) => p.type === "day")!.value)
  return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0))
}

function startOfWeekSun(d = new Date()) {
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    weekday: "short",
  }).format(d).toLowerCase()
  const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const offset = map[weekdayStr.slice(0, 3)] ?? 0
  const base = midnightESTAsUTC(d)
  base.setUTCDate(base.getUTCDate() - offset)
  return base
}

function endOfWeekSat(d = new Date()) {
  const s = startOfWeekSun(d)
  const e = new Date(s)
  e.setUTCDate(e.getUTCDate() + 6)
  e.setUTCHours(23, 59, 59, 999)
  return e
}

function toISODate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function dayShort(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map((n) => Number(n))
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return new Intl.DateTimeFormat("en-US", { timeZone: EST_TZ, weekday: "short" }).format(anchor)
}

function groupByESTDay(matches: RibbonMatch[]) {
  const map: Record<string, RibbonMatch[]> = {}
  for (const m of matches) {
    const key = isoDateInEST(m.match_date)
    ;(map[key] ??= []).push(m)
  }
  Object.values(map).forEach((arr) =>
    arr.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  )
  return map
}

function weekKeyFromMatch(iso: string) {
  const sundayUTC = startOfWeekSun(new Date(iso))
  return toISODate(sundayUTC)
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    month: "short",
    day: "numeric",
  }).format(new Date(dateString))
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}

/* ========================= Score Chip ========================= */

function ScoreChip({ m, recordForTeam }: { m: RibbonMatch; recordForTeam: (id?: string | null) => string }) {
  const completed = m.status?.toLowerCase() === "completed"
  const inProgress = m.status?.toLowerCase() === "in progress"
  const viewHref = `/ahl/matches/${m.id}`

  return (
    <Link href={viewHref} className="block">
      <div className="ticker-item min-w-[240px] md:min-w-[280px] px-3 py-2.5 flex gap-3 cursor-pointer">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <img src={m.away_team?.logo_url || "/placeholder.svg?height=20&width=20"} alt="" className="w-5 h-5 rounded object-contain" />
            <span className="text-sm font-semibold truncate flex-1">{m.away_team?.name ?? "TBD"}</span>
            {completed ? (
              <span className={`text-sm font-bold tabular-nums ${(m.away_score || 0) > (m.home_score || 0) ? "text-white" : "text-muted-foreground"}`}>
                {m.away_score ?? 0}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{recordForTeam(m.away_team?.id)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <img src={m.home_team?.logo_url || "/placeholder.svg?height=20&width=20"} alt="" className="w-5 h-5 rounded object-contain" />
            <span className="text-sm font-semibold truncate flex-1">{m.home_team?.name ?? "TBD"}</span>
            {completed ? (
              <span className={`text-sm font-bold tabular-nums ${(m.home_score || 0) > (m.away_score || 0) ? "text-white" : "text-muted-foreground"}`}>
                {m.home_score ?? 0}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{recordForTeam(m.home_team?.id)}</span>
            )}
          </div>
        </div>
        <div className="w-px bg-white/10 my-0.5" />
        <div className="w-[60px] flex items-center justify-center">
          {completed ? (
            <div className="text-center">
              <div className="text-[10px] font-semibold text-muted-foreground">FINAL{m.has_overtime ? " OT" : ""}</div>
            </div>
          ) : inProgress ? (
            <div className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold live-pulse">LIVE</div>
          ) : (
            <div className="text-xs text-muted-foreground">{estTime(m.match_date)}</div>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ========================= Main Page ========================= */

export default function AHLHome() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [leagueLeaders, setLeagueLeaders] = useState<any>({})
  
  const [allMatches, setAllMatches] = useState<RibbonMatch[]>([])
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [currentWeekIdx, setCurrentWeekIdx] = useState<number>(0)
  const [recordByTeamId, setRecordByTeamId] = useState<Record<string, string>>({})
  
  const weekStart = useMemo(() => {
    const key = availableWeeks[currentWeekIdx]
    return key ? new Date(`${key}T00:00:00Z`) : startOfWeekSun()
  }, [availableWeeks, currentWeekIdx])
  const weekEnd = useMemo(() => endOfWeekSat(weekStart), [weekStart])
  
  const weekDays = useMemo(() => {
    if (!availableWeeks.length) return []
    const wkKey = toISODate(weekStart)
    const daysWithGames = new Set<string>()
    for (const m of allMatches) {
      if (weekKeyFromMatch(m.match_date) === wkKey) {
        daysWithGames.add(isoDateInEST(m.match_date))
      }
    }
    return Array.from(daysWithGames).sort()
  }, [allMatches, weekStart, availableWeeks])
  
  const [activeDay, setActiveDay] = useState<string>(isoDateInEST(new Date().toISOString()))
  
  useEffect(() => {
    if (weekDays.length === 0) {
      setActiveDay(isoDateInEST(new Date().toISOString()))
    } else {
      const todayEST = isoDateInEST(new Date().toISOString())
      setActiveDay(weekDays.includes(todayEST) ? todayEST : weekDays[0])
    }
  }, [weekDays])
  
  const recordForTeam = (id?: string | null) => id ? (recordByTeamId[id] || "0-0-0") : ""
  
  // Fetch ribbon matches from AHL
  useEffect(() => {
    async function fetchRibbonData() {
      try {
        const back = new Date()
        back.setUTCDate(back.getUTCDate() - 120)
        const fwd = new Date()
        fwd.setUTCDate(fwd.getUTCDate() + 120)
        const from = startOfWeekSun(back).toISOString()
        const to = endOfWeekSat(fwd).toISOString()

        const { data: matchesData, error } = await supabase
          .from("matches_ahl")
          .select(`id, match_date, status, home_score, away_score, has_overtime,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)`)
          .gte("match_date", from)
          .lte("match_date", to)
          .order("match_date", { ascending: true })
          .limit(500)

        if (!error && matchesData) {
          setAllMatches(matchesData as RibbonMatch[])
          const weekSet = new Set<string>()
          for (const m of matchesData) weekSet.add(weekKeyFromMatch(m.match_date))
          const sortedWeeks = Array.from(weekSet).sort()
          setAvailableWeeks(sortedWeeks)
          const todayWeek = toISODate(startOfWeekSun())
          const idx = sortedWeeks.indexOf(todayWeek)
          setCurrentWeekIdx(idx >= 0 ? idx : sortedWeeks.length - 1)
        }

        const seasons = await getAHLSeasons()
        const activeSeason = seasons?.find((s: any) => s.is_active)
        if (activeSeason) {
          const standingsCalc = await calculateAHLStandings(activeSeason.id)
          const records: Record<string, string> = {}
          for (const team of standingsCalc) records[team.id] = `${team.wins}-${team.losses}-${team.otl}`
          setRecordByTeamId(records)
        }
      } catch (e) {
        console.error("Error fetching ribbon data:", e)
      }
    }
    fetchRibbonData()
  }, [supabase])
  
  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch AHL news (if there's a category or we can use the same news table)
        const { data: newsData } = await supabase
          .from("news")
          .select("*")
          .eq("published", true)
          .or("category.eq.ahl,category.eq.AHL")
          .order("created_at", { ascending: false })
          .limit(5)
        setNews(newsData || [])
        
        const seasons = await getAHLSeasons()
        const activeSeason = seasons?.find((s: any) => s.is_active)
        if (activeSeason) {
          const standingsData = await calculateAHLStandings(activeSeason.id)
          const sorted = [...standingsData].sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points
            if (a.wins !== b.wins) return b.wins - a.wins
            return b.goals_for - a.goals_for
          })
          setStandings(sorted)
          
          // Fetch AHL stats from ea_player_stats_ahl
          const { data: seasonStats } = await supabase
            .from("ea_player_stats_ahl")
            .select(`player_id, goals, assists`)
            .eq("season_id", activeSeason.id)
          
          if (seasonStats && seasonStats.length > 0) {
            // Get unique player IDs and fetch player data separately
            const playerIds = [...new Set(seasonStats.map(s => s.player_id).filter(Boolean))]
            const { data: playersData } = await supabase
              .from("players")
              .select(`id, users(gamer_tag_id), teams_ahl:team_id_ahl(name, logo_url)`)
              .in("id", playerIds)
            
            const playersMap = new Map(playersData?.map(p => [p.id, p]) || [])
            
            const playerTotals: Record<string, any> = {}
            for (const stat of seasonStats) {
              const pid = stat.player_id
              if (!pid) continue
              const player = playersMap.get(pid)
              if (!playerTotals[pid]) {
                playerTotals[pid] = {
                  gamer_tag: player?.users?.gamer_tag_id || "Unknown",
                  team_name: player?.teams_ahl?.name || "",
                  team_logo: player?.teams_ahl?.logo_url || "",
                  goals: 0, assists: 0, points: 0,
                }
              }
              playerTotals[pid].goals += stat.goals || 0
              playerTotals[pid].assists += stat.assists || 0
              playerTotals[pid].points += (stat.goals || 0) + (stat.assists || 0)
            }
            const totalsArray = Object.values(playerTotals)
            setLeagueLeaders({
              points: totalsArray.sort((a: any, b: any) => b.points - a.points).slice(0, 3).map((p: any) => ({ ...p, value: p.points })),
              goals: totalsArray.sort((a: any, b: any) => b.goals - a.goals).slice(0, 3).map((p: any) => ({ ...p, value: p.goals })),
              assists: totalsArray.sort((a: any, b: any) => b.assists - a.assists).slice(0, 3).map((p: any) => ({ ...p, value: p.assists })),
            })
          }
        }
        
        const now = new Date().toISOString()
        const { data: upcomingData } = await supabase
          .from("matches_ahl")
          .select(`id, match_date, status, home_team:home_team_id(id, name, logo_url), away_team:away_team_id(id, name, logo_url)`)
          .eq("status", "Scheduled")
          .gte("match_date", now)
          .order("match_date", { ascending: true })
          .limit(4)
        setUpcomingMatches(upcomingData || [])
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching AHL homepage data:", error)
        toast({ title: "Error loading data", description: "Failed to load homepage content.", variant: "destructive" })
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, toast])
  
  const featuredNews = news[0]
  const moreNews = news.length > 1 ? news.slice(1, 4) : news.slice(0, 3)
  const grouped = groupByESTDay(allMatches)
  const todaysGames = (grouped[activeDay] || []).slice(0, 12)

  return (
    <div className="min-h-screen premium-bg">
      <BannedUserModal />
      
      {/* ==================== LIVE SCORES TICKER ==================== */}
      <section className="ticker-container sticky top-16 z-30">
        <div className="w-full px-4 lg:px-8 py-2">
          <div className="flex items-center gap-3">
            {/* League badge */}
            <div className="hidden md:flex items-center gap-2 pr-3 border-r border-white/10 flex-shrink-0">
              <img src={AHL_LOGO} alt="MGAHL" className="w-6 h-6" />
              <span className="text-xs font-bold text-orange-500">LIVE</span>
            </div>
            
            {/* Week nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => currentWeekIdx > 0 && setCurrentWeekIdx(i => i - 1)}
                disabled={currentWeekIdx <= 0}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => currentWeekIdx < availableWeeks.length - 1 && setCurrentWeekIdx(i => i + 1)}
                disabled={currentWeekIdx >= availableWeeks.length - 1}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Day tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-shrink-0">
              {weekDays.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    activeDay === d 
                      ? "bg-orange-500 text-white" 
                      : "hover:bg-white/10 text-muted-foreground"
                  }`}
                >
                  {dayShort(d)}
                </button>
              ))}
            </div>
            
            {/* Games scroll */}
            <div className="flex-1 overflow-x-auto scroll-container scrollbar-hide">
              <div className="flex gap-2 py-1">
                {todaysGames.length === 0 ? (
                  <span className="text-xs text-muted-foreground px-3">No games scheduled</span>
                ) : (
                  todaysGames.map((m) => <ScoreChip key={m.id} m={m} recordForTeam={recordForTeam} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 w-full px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <img src={AHL_LOGO} alt="MGAHL" className="w-16 h-16 md:w-20 md:h-20 drop-shadow-2xl" />
                <div>
                  <Badge variant="outline" className="border-orange-500/50 text-orange-500 mb-1">Season Active</Badge>
                  <p className="text-xs text-muted-foreground">Development League</p>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6">
                <span className="text-orange-500">MAJOR</span>
                <br />
                <span className="text-orange-500">GAMING</span>
                <br />
                <span className="text-orange-400">AMERICAN</span>
                <br />
                <span className="text-orange-400">HOCKEY LEAGUE</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mb-8">
                The premier development league. Where future stars hone their skills and prove their worth.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link href="/ahl/standings">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                    <Trophy className="w-4 h-4" /> View Standings
                  </Button>
                </Link>
                <Link href="/ahl/teams">
                  <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 font-bold gap-2">
                    <Users className="w-4 h-4" /> View Teams
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            {/* Right - Featured News */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {loading ? (
                <Skeleton className="aspect-[16/10] rounded-2xl" />
              ) : featuredNews ? (
                <Link href={`/ahl/news/${featuredNews.id}`} className="group block">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden premium-card">
                    <img
                      src={featuredNews.hero_image_url || featuredNews.image_url || "/placeholder.svg?height=400&width=640"}
                      alt={featuredNews.title}
                      className="absolute inset-0 w-full h-full object-cover card-image"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-orange-500">Featured</Badge>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(featuredNews.created_at)}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
                        {featuredNews.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="aspect-[16/10] rounded-2xl glass-card flex items-center justify-center">
                  <p className="text-muted-foreground">No AHL news yet</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <section className="py-12 md:py-16">
        <div className="w-full px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
            
            {/* Left Column - News & Leaders */}
            <div className="lg:col-span-2 space-y-8">
              {/* More News */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 section-header">
                    <Newspaper className="w-5 h-5 text-orange-500" />
                    Latest AHL News
                  </h3>
                  <Link href="/ahl/news">
                    <Button variant="ghost" size="sm" className="text-xs">View All <ChevronRight className="w-3 h-3 ml-1" /></Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {loading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)
                  ) : moreNews.length > 0 ? (
                    moreNews.map((n) => (
                      <Link key={n.id} href={`/ahl/news/${n.id}`} className="group block">
                        <div className="relative aspect-video rounded-xl overflow-hidden glass-card border border-white/5 hover:border-orange-500/30 transition-all duration-300">
                          <img
                            src={n.hero_image_url || n.image_url || n.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                            alt={n.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/20 text-orange-500 mb-2">
                              {formatDate(n.created_at)}
                            </span>
                            <h4 className="text-sm font-bold line-clamp-2 group-hover:text-orange-500 transition-colors leading-tight">{n.title}</h4>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">No AHL news articles yet</div>
                  )}
                </div>
              </div>
              
              {/* League Leaders */}
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 section-header">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  AHL League Leaders
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {["points", "goals", "assists"].map((cat) => {
                    const leader = leagueLeaders[cat]?.[0]
                    const Icon = cat === "points" ? Zap : cat === "goals" ? Star : Users
                    return (
                      <div key={cat} className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-semibold uppercase text-muted-foreground">{cat} Leader</span>
                        </div>
                        {loading || !leader ? (
                          <Skeleton className="h-12" />
                        ) : (
                          <div className="flex items-center gap-3">
                            <img src={leader.team_logo || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-contain" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{leader.gamer_tag}</p>
                              <p className="text-xs text-muted-foreground truncate">{leader.team_name}</p>
                            </div>
                            <span className="text-2xl font-black text-orange-500">{leader.value}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Right Column - Standings & Schedule */}
            <div className="space-y-6">
              {/* Standings */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold">AHL Standings</h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                  ) : (
                    <div className="space-y-1">
                      {standings.slice(0, 8).map((team, idx) => (
                        <Link key={team.id} href={`/ahl/teams/${team.id}`}>
                          <div className={`flex items-center gap-3 p-2 rounded-lg standings-row ${idx < 3 ? "bg-white/5" : ""}`}>
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                              idx === 0 ? "bg-amber-500/20 text-amber-400" :
                              idx === 1 ? "bg-gray-400/20 text-gray-300" :
                              idx === 2 ? "bg-amber-700/20 text-amber-600" :
                              "text-muted-foreground"
                            }`}>{idx + 1}</span>
                            <img src={team.logo_url || "/placeholder.svg"} alt={team.name} className="w-6 h-6 rounded object-contain team-badge" />
                            <span className="flex-1 text-sm font-medium truncate">{team.name}</span>
                            <div className="text-right">
                              <span className="text-sm font-bold">{team.points}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">{team.wins}-{team.losses}-{team.otl}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link href="/ahl/standings">
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">Full Standings <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  </Link>
                </div>
              </div>
              
              {/* Schedule */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold">Upcoming AHL Games</h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                  ) : upcomingMatches.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming games</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingMatches.map((match) => (
                        <Link key={match.id} href={`/ahl/matches/${match.id}`}>
                          <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors schedule-card">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-muted-foreground">{formatDate(match.match_date)}</span>
                              <span className="text-[10px] font-medium text-orange-500">{formatTime(match.match_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <img src={match.away_team?.logo_url || "/placeholder.svg"} alt="" className="w-5 h-5 rounded object-contain" />
                                <span className="text-xs font-medium truncate">{match.away_team?.name}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground px-2">@</span>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="text-xs font-medium truncate">{match.home_team?.name}</span>
                                <img src={match.home_team?.logo_url || "/placeholder.svg"} alt="" className="w-5 h-5 rounded object-contain" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link href="/ahl/matches">
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">Full Schedule <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  </Link>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="glass-card rounded-xl p-4">
                <h4 className="font-bold text-sm mb-3">Quick Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: "/ahl/standings", icon: Trophy, label: "Standings" },
                    { href: "/ahl/statistics", icon: TrendingUp, label: "Statistics" },
                    { href: "/ahl/teams", icon: Users, label: "Teams" },
                    { href: "/ahl/free-agency", icon: Star, label: "Free Agency" },
                  ].map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div className="quick-action p-3 flex flex-col items-center gap-2 text-center">
                        <link.icon className="w-5 h-5 action-icon text-muted-foreground transition-all" />
                        <span className="text-xs font-medium">{link.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Members Online */}
              <MembersOnline />
            </div>
          </div>
        </div>
      </section>
      
      {/* ==================== CTA SECTION ==================== */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4">DEVELOP YOUR GAME</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              The AHL is where future NHL stars develop their skills. Watch the next generation compete.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/ahl/standings">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 px-8">
                  <Trophy className="w-4 h-4" /> View Standings
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 font-bold gap-2">
                  Back to NHL
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
