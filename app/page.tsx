"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import NewsCard from "@/components/news-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Trophy, Users, Calendar, TrendingUp, ArrowRight, UserPlus, ChevronRight } from "lucide-react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"
import { calculateStandings, getSeasons } from "@/lib/standings-calculator"

/* ========================= TSN/ESPN-style scores ribbon helpers ========================= */

type RibbonMatch = {
  id: string
  match_date: string // UTC from Supabase
  status: string
  home_score: number | null
  away_score: number | null
  home_team: { id: string; name: string; logo_url?: string | null } | null
  away_team: { id: string; name: string; logo_url?: string | null } | null
  has_overtime?: boolean | null
}

const EST_TZ = "America/New_York"
const MAX_RIBBON_ITEMS = 36

// "9:00 PM" in EST from a UTC ISO string
function estTime(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

// YYYY-MM-DD in EST from ISO
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

// A UTC Date representing **midnight EST** for the given local date
function midnightESTAsUTC(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = Number(parts.find((p) => p.type === "year")!.value)
  const m = Number(parts.find((p) => p.type === "month")!.value)
  const day = Number(parts.find((p) => p.type === "day")!.value)
  return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0))
}

// Start Sunday / End Saturday of the week in **EST**, represented as UTC Dates
function startOfWeekSun(d = new Date()) {
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ,
    weekday: "short",
  })
    .format(d)
    .toLowerCase()
  const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const offset = map[weekdayStr.slice(0, 3)] ?? 0
  const base = midnightESTAsUTC(d)
  base.setUTCDate(base.getUTCDate() - offset) // back to Sunday
  return base
}
function endOfWeekSat(d = new Date()) {
  const s = startOfWeekSun(d)
  const e = new Date(s)
  e.setUTCDate(e.getUTCDate() + 6)
  e.setUTCHours(23, 59, 59, 999)
  return e
}

// Format a UTC Date as YYYY-MM-DD
function toISODate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// For chip labels ("Mon", "Tue", ...). Compute weekday **in EST** for the EST date string
function dayShort(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map((n) => Number(n))
  // Noon UTC avoids DST edge cases; we then format as EST weekday.
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

// Compute the EST Sunday (YYYY-MM-DD string) for a given UTC ISO
function weekKeyFromMatch(iso: string) {
  const sundayUTC = startOfWeekSun(new Date(iso))
  return toISODate(sundayUTC)
}

/* ========================= UI bits for the ribbon ========================= */

function ScrollButtons({ targetId }: { targetId: string }) {
  return (
    <div className="hidden md:flex gap-2">
      <button
        aria-label="Scroll left"
        onClick={() => document.getElementById(targetId)?.scrollBy({ left: -600, behavior: "smooth" })}
        className="rounded-md border border-yellow-500/40 px-2 py-1 text-[10px] md:text-xs text-yellow-100 hover:bg-yellow-500/10"
      >
        ‹
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => document.getElementById(targetId)?.scrollBy({ left: 600, behavior: "smooth" })}
        className="rounded-md border border-yellow-500/40 px-2 py-1 text-[10px] md:text-xs text-yellow-100 hover:bg-yellow-500/10"
      >
        ›
      </button>
    </div>
  )
}

// AWAY (top) / HOME (bottom). FINAL layout + "View game" link.
function ScoreChip({
  m,
  recordForTeam,
}: {
  m: RibbonMatch
  recordForTeam: (id?: string | null) => string
}) {
  const completed = m.status?.toLowerCase() === "completed"
  const inProgress = m.status?.toLowerCase() === "in progress"
  const awayRec = recordForTeam(m.away_team?.id)
  const homeRec = recordForTeam(m.home_team?.id)
  const viewHref = `/matches/${m.id}`

  return (
    <div className="min-w-[270px] md:min-w-[320px] rounded-lg border border-yellow-500/40 bg-neutral-950/90 px-3 md:px-4 py-2 flex shadow-[0_0_0_1px_rgba(0,0,0,0.6)]">
      <div className="flex-1">
        {/* AWAY */}
        <div className="flex items-center gap-2 h-8">
          <img
            src={m.away_team?.logo_url || "/placeholder.svg?height=20&width=20"}
            alt={m.away_team?.name || "Away"}
            className="w-5 h-5 rounded bg-neutral-900 object-contain"
          />
          <span className="truncate text-[13px] font-semibold text-white">{m.away_team?.name ?? "TBD"}</span>
          {completed ? (
            <span className="ml-auto text-sm font-extrabold tabular-nums text-yellow-300">
              {m.away_score ?? 0}
            </span>
          ) : (
            <span className="ml-auto text-[11px] md:text-xs text-neutral-400 tabular-nums">{awayRec}</span>
          )}
        </div>
        {/* HOME */}
        <div className="flex items-center gap-2 h-8">
          <img
            src={m.home_team?.logo_url || "/placeholder.svg?height=20&width=20"}
            alt={m.home_team?.name || "Home"}
            className="w-5 h-5 rounded bg-neutral-900 object-contain"
          />
          <span className="truncate text-[13px] font-semibold text-white">{m.home_team?.name ?? "TBD"}</span>
          {completed ? (
            <span className="ml-auto text-sm font-extrabold tabular-nums text-yellow-300">
              {m.home_score ?? 0}
            </span>
          ) : (
            <span className="ml-auto text-[11px] md:text-xs text-neutral-400 tabular-nums">{homeRec}</span>
          )}
        </div>
      </div>

      {/* RIGHT: time/live/final */}
      <div className="w-px bg-yellow-500/30 my-1 ml-3 md:ml-4" />
      <div className="w-[84px] md:w-[96px] pl-4 md:pl-5 flex items-center justify-center text-right">
        {completed ? (
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-yellow-400 uppercase">
              FINAL{m.has_overtime ? " (OT)" : ""}
            </div>
            <Link
              href={viewHref}
              className="text-[11px] text-yellow-100 underline underline-offset-2 hover:text-white mt-1"
            >
              View game
            </Link>
          </div>
        ) : inProgress ? (
          <div className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600/20 text-red-400 tracking-[0.18em] uppercase">
            LIVE
          </div>
        ) : (
          <div className="text-xs md:text-sm text-neutral-300 tabular-nums">{estTime(m.match_date)}</div>
        )}
      </div>
    </div>
  )
}

/* ================================ Small components ================================ */

function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number
  duration?: number
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  // @ts-ignore
  const ref = React.useRef<HTMLSpanElement | null>(null)
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

function TradeCard({ trade }: { trade: any }) {
  return (
    <Card className="hover:shadow-lg hover:shadow-yellow-500/15 transition-all duration-300 border-neutral-800 bg-neutral-950/70">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-yellow-500/60 text-yellow-300">
            NHL Trade
          </Badge>
          <span className="text-xs text-neutral-400">
            {new Date(trade.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="space-y-2 text-sm text-neutral-100">
          <div>
            <span className="font-medium text-white">Status:</span> <span className="capitalize">{trade.status}</span>
          </div>
          {trade.trade_message && (
            <p className="text-xs text-neutral-400 line-clamp-2">{trade.trade_message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function WaiverCard({ waiver }: { waiver: any }) {
  const fmtDate = (iso?: string | null) =>
    iso
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: EST_TZ,
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(iso))
      : ""

  const statusBadge =
    waiver.status === "claimed" ? (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Claimed</span>
    ) : waiver.status === "cleared" ? (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Cleared</span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300">Open</span>
    )

  return (
    <Card className="hover:shadow-lg hover:shadow-yellow-500/15 transition-all duration-300 border-neutral-800 bg-neutral-950/70">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-yellow-500/60 text-yellow-300">
            SCSHL Waiver
          </Badge>
          <span className="text-xs text-neutral-400">{fmtDate(waiver.waived_at)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-100">
          <span className="text-neutral-400">From</span>
          <img
            src={waiver.waiving_team?.logo_url || "/placeholder.svg?height=18&width=18"}
            alt="Waiving Team"
            className="w-4 h-4 rounded bg-neutral-900"
          />
          <span className="font-medium">{waiver.waiving_team?.name ?? "—"}</span>
        </div>

        {waiver.winning_team?.name ? (
          <div className="flex items-center gap-2 text-sm text-neutral-100">
            <span className="text-neutral-400">To</span>
            <img
              src={waiver.winning_team?.logo_url || "/placeholder.svg?height=18&width=18"}
              alt="Winning Team"
              className="w-4 h-4 rounded bg-neutral-900"
            />
            <span className="font-medium">{waiver.winning_team?.name}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs">
          <div className="text-neutral-400">Deadline: {fmtDate(waiver.claim_deadline)}</div>
          {statusBadge}
        </div>
      </CardContent>
    </Card>
  )
}

function StandingsCard({ teams }: { teams: any[] }) {
  const topTeams = (teams || []).slice(0, 5)

  const logoUrl =
    "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"

  return (
    <Card className="relative overflow-hidden h-full border border-yellow-500/40 bg-neutral-950/90">
      {/* Watermark background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(${logoUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "70%",
          filter: "grayscale(100%)",
          maskImage:
            "radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* Soft veil for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
          <span className="bg-gradient-to-r from-yellow-300 via-white to-yellow-400 bg-clip-text text-transparent font-black tracking-tight">
            SCSHL STANDINGS
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-2">
        {topTeams.length === 0 ? (
          <div className="text-sm text-neutral-400 py-6 text-center">No standings available.</div>
        ) : (
          topTeams.map((team: any, index: number) => (
            <div
              key={team.id ?? index}
              className={`group flex items-center justify-between p-2 rounded-lg transition border ${
                index === 0
                  ? "bg-yellow-500/10 border-yellow-400/60"
                  : "bg-black/40 border-yellow-500/20 hover:border-yellow-400/50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`font-bold text-[11px] w-6 text-center rounded-full border ${
                    index === 0
                      ? "bg-yellow-400 text-black border-yellow-300"
                      : "bg-neutral-900 text-yellow-200 border-yellow-500/50"
                  }`}
                >
                  {index + 1}
                </span>
                <img
                  src={team.logo_url || "/placeholder.svg?height=20&width=20"}
                  alt={team.name}
                  className="w-5 h-5 rounded bg-neutral-900 object-contain"
                />
                <span className="font-medium text-sm truncate text-neutral-50">{team.name}</span>
              </div>

              <div className="text-right">
                <div className="font-bold text-sm tabular-nums text-yellow-200">{team.points} pts</div>
                <div className="text-[11px] text-neutral-400 tabular-nums">
                  {team.wins}-{team.losses}-{team.otl}
                </div>
                {team.last_10 ? (
                  <div className="text-[11px] text-neutral-500 font-mono">L10: {team.last_10}</div>
                ) : null}
              </div>
            </div>
          ))
        )}

        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-yellow-200 hover:text-white hover:bg-yellow-500/10"
            asChild
          >
            <Link href="/standings">
              View Full Standings <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ============================ Featured News Block ============================ */

function FeaturedNews({ item }: { item: any }) {
  if (!item) return null

  const href = `/news/${item.id}`
  const img =
    item.hero_image_url ||
    item.image_url ||
    item.cover_url ||
    item.banner_url ||
    item.thumbnail_url ||
    "/placeholder.svg?height=600&width=1200"

  const dateStr = item.created_at
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: EST_TZ,
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(item.created_at))
    : ""

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-yellow-500/40 bg-black/80">
        {/* Image */}
        <div className="aspect-[16/9] w-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={item.title ?? "News"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {/* Gold glow overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(650px 300px at 20% 0%, rgba(250,204,21,0.25), transparent 60%), radial-gradient(650px 300px at 80% 10%, rgba(253,224,71,0.18), transparent 60%)",
            }}
          />
        </div>

        {/* Copy */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 text-xs text-neutral-300 mb-2">
            <span>{dateStr}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-white group-hover:text-yellow-300 transition-colors">
            {item.title ?? "Untitled"}
          </h3>
          {item.subtitle || item.excerpt ? (
            <p className="mt-2 text-sm text-neutral-300 line-clamp-2">
              {item.subtitle ?? item.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/* =================================== Page =================================== */

export default function Home() {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [news, setNews] = useState<any[]>([])
  const [nhlTrades, setNhlTrades] = useState<any[]>([])
  const [nhlStandings, setNhlStandings] = useState<any[]>([])
  const [nhlWaivers, setNhlWaivers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPlayers: 0,
    nhlTeams: 0,
    totalMatches: 0,
    completedTrades: 0,
  })
  const [loading, setLoading] = useState(true)

  // Ribbon state (NHL only now)
  const [allNhl, setAllNhl] = useState<RibbonMatch[]>([])
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]) // YYYY-MM-DD (Sunday in EST)
  const [currentWeekIdx, setCurrentWeekIdx] = useState<number>(0)

  const weekStart = useMemo(() => {
    const key = availableWeeks[currentWeekIdx]
    return key ? new Date(`${key}T00:00:00Z`) : startOfWeekSun()
  }, [availableWeeks, currentWeekIdx])
  const weekEnd = useMemo(() => endOfWeekSat(weekStart), [weekStart])

  const weekDays = useMemo(() => {
    if (!availableWeeks.length) return []
    const wkKey = toISODate(weekStart)

    const daysWithGames = new Set<string>()
    for (const m of allNhl) {
      if (weekKeyFromMatch(m.match_date) === wkKey) {
        daysWithGames.add(isoDateInEST(m.match_date))
      }
    }
    return Array.from(daysWithGames).sort()
  }, [allNhl, weekStart, availableWeeks])

  const [activeDay, setActiveDay] = useState<string>(isoDateInEST(new Date().toISOString()))
  useEffect(() => {
    if (weekDays.length === 0) {
      setActiveDay(isoDateInEST(new Date().toISOString()))
    } else {
      const todayEST = isoDateInEST(new Date().toISOString())
      setActiveDay(weekDays.includes(todayEST) ? todayEST : weekDays[0])
    }
  }, [weekDays])

  // Load ribbon matches and compute weeks (NHL only)
  useEffect(() => {
    ;(async () => {
      try {
        const back = new Date()
        back.setUTCDate(back.getUTCDate() - 120)
        const fwd = new Date()
        fwd.setUTCDate(fwd.getUTCDate() + 120)
        const from = startOfWeekSun(back).toISOString()
        const to = endOfWeekSat(fwd).toISOString()

        const nhl = await supabase
          .from("matches")
          .select(`
            id, match_date, status, home_score, away_score, has_overtime,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .gte("match_date", from)
          .lte("match_date", to)
          .in("status", ["Scheduled", "In Progress", "Completed"])
          .order("match_date", { ascending: true })

        const nhlData = (nhl.data as RibbonMatch[] | null) ?? []
        setAllNhl(nhlData)

        const keys = new Set<string>()
        for (const m of nhlData) keys.add(weekKeyFromMatch(m.match_date))
        const sorted = Array.from(keys).sort()
        setAvailableWeeks(sorted)

        const todayWk = weekKeyFromMatch(new Date().toISOString())
        let idx = sorted.findIndex((k) => k >= todayWk)
        if (idx === -1) idx = Math.max(0, sorted.length - 1)
        setCurrentWeekIdx(idx)
      } catch (e) {
        console.error("Error loading ribbon matches:", e)
      }
    })()
  }, [supabase])

  // Team record map for ribbon
  const [nhlRecordByTeamId, setNhlRecordByTeamId] = useState<Record<string, string>>({})

  // Everything else (stats / trades / standings / waivers / news)
  useEffect(() => {
    async function fetchData() {
      try {
        const [playersRes, nhlTeamsRes, nhlMatchesRes, nhlTradesRes] = await Promise.all([
          supabase.from("users").select("id", { count: "exact" }),
          supabase.from("teams").select("id", { count: "exact" }).eq("is_active", true),
          supabase.from("matches").select("id", { count: "exact" }),
          supabase.from("trades").select("id", { count: "exact" }).eq("status", "completed"),
        ])

        setStats({
          totalPlayers: playersRes.count || 0,
          nhlTeams: nhlTeamsRes.count || 0,
          totalMatches: nhlMatchesRes.count || 0,
          completedTrades: nhlTradesRes.count || 0,
        })

        const nhlTradesData = await supabase
          .from("trades")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4)
        setNhlTrades(nhlTradesData.data || [])

        // Seasons
        const seasonsNHL = await getSeasons()
        const activeNHL = seasonsNHL?.find((s) => s.is_active)

        if (activeNHL) {
          const nhlStandingsData: any[] = await calculateStandings(activeNHL.id)
          const sortedNhl = [...nhlStandingsData]
            .sort((a, b) => {
              if (a.points !== b.points) return b.points - a.points
              if (a.wins !== b.wins) return b.wins - a.wins
              if (a.goal_differential !== b.goal_differential) return b.goal_differential - a.goal_differential
              return b.goals_for - a.goals_for
            })
            .slice(0, 5)
          setNhlStandings(sortedNhl)

          const nhlRec: Record<string, string> = {}
          for (const t of nhlStandingsData) {
            nhlRec[String(t.id ?? t.team_id ?? "")] = `${t.wins ?? 0}-${t.losses ?? 0}-${t.otl ?? 0}`
          }
          setNhlRecordByTeamId(nhlRec)
        } else {
          setNhlStandings([])
          setNhlRecordByTeamId({})
        }

        const nhlWaiversData = await supabase
          .from("waivers")
          .select(`
            id, status, waived_at, claim_deadline,
            player:player_id(id),
            waiving_team:waiving_team_id(id, name, logo_url),
            winning_team:winning_team_id(id, name, logo_url)
          `)
          .order("waived_at", { ascending: false })
          .limit(4)
        setNhlWaivers(nhlWaiversData.data || [])

        const { data: newsData } = await supabase
          .from("news")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(5)

        setNews(newsData || [])
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error loading data",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, toast])

  /* ================================== RENDER ================================== */

  const featured = news[0]
  const moreNews = news.slice(1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <BannedUserModal />

      {/* ============================ SCORES RIBBON (EST) ============================ */}
      <section className="border-b border-yellow-500/40 bg-gradient-to-r from-black via-neutral-950 to-black">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 py-4">
          {/* Header + week nav */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-yellow-400 rounded-full" />
              <div className="text-xs md:text-sm font-semibold tracking-[0.18em] text-yellow-100 uppercase">
                SCSHL Scores • EST
              </div>
            </div>

            <div className="flex items-center gap-2 text-yellow-100">
              <button
                className="rounded-md border border-yellow-500/40 px-2 py-1 text-[10px] md:text-xs hover:bg-yellow-500/10 disabled:opacity-40"
                onClick={() => {
                  if (currentWeekIdx > 0) setCurrentWeekIdx((i) => i - 1)
                }}
                disabled={currentWeekIdx <= 0}
              >
                ‹ Week
              </button>
              <div className="text-[10px] md:text-xs text-neutral-300 tabular-nums">
                {toISODate(weekStart)} — {toISODate(weekEnd)}
              </div>
              <button
                className="rounded-md border border-yellow-500/40 px-2 py-1 text-[10px] md:text-xs hover:bg-yellow-500/10 disabled:opacity-40"
                onClick={() => {
                  if (currentWeekIdx < availableWeeks.length - 1) setCurrentWeekIdx((i) => i + 1)
                }}
                disabled={currentWeekIdx >= availableWeeks.length - 1}
              >
                Week ›
              </button>
            </div>
          </div>

          {/* Day chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {weekDays.length === 0 ? (
              <span className="text-xs text-neutral-400">No games this week.</span>
            ) : (
              weekDays.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`px-3 py-1.5 rounded-full border text-[11px] md:text-xs whitespace-nowrap transition-all ${
                    activeDay === d
                      ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                      : "border-yellow-500/40 text-yellow-100/80 hover:bg-yellow-500/10"
                  }`}
                >
                  {dayShort(d)}{" "}
                  <span className={activeDay === d ? "text-black/70 ml-1" : "text-neutral-400 ml-1"}>
                    {d.slice(5)}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Horizontal scroller */}
          {(() => {
            const grouped = groupByESTDay(allNhl)
            const list = (grouped[activeDay] || []).slice(0, MAX_RIBBON_ITEMS)
            const scrollerId = "scores-nhl"

            const recordForTeam = (id?: string | null) => (id ? nhlRecordByTeamId[String(id)] ?? "0-0-0" : "0-0-0")

            return (
              <div className="mt-3 flex items-center justify-between gap-3">
                <ScrollButtons targetId={scrollerId} />
                <div
                  id={scrollerId}
                  className="flex gap-2 overflow-x-auto scroll-smooth w-full no-scrollbar snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {list.length === 0 ? (
                    <div className="text-sm text-neutral-400 py-3">No games scheduled.</div>
                  ) : (
                    list.map((m) => (
                      <div key={m.id} className="snap-start">
                        <ScoreChip m={m} recordForTeam={recordForTeam} />
                      </div>
                    ))
                  )}
                </div>
                <ScrollButtons targetId={scrollerId} />
              </div>
            )
          })()}
        </div>
      </section>
      {/* ============================ /SCORES RIBBON ============================ */}

      {/* ============================ ESPN TOP STACK ============================ */}
      <section className="container mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main (Featured News + small headlines) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Top Stories
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-yellow-300 hover:text-white hover:bg-yellow-500/10"
              >
                <Link href="/news">
                  More News <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <Skeleton className="h-[360px] w-full bg-neutral-800/70" />
            ) : featured ? (
              <FeaturedNews item={featured} />
            ) : (
              <Card className="bg-black/80 border-neutral-800">
                <CardContent className="p-8 text-center text-neutral-400">No news yet.</CardContent>
              </Card>
            )}

            {/* Additional headlines (compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full bg-neutral-800/70" />)
                : moreNews.slice(0, 4).map((n: any) => <NewsCard key={n.id} news={n} />)}
            </div>
          </div>

          {/* Sidebar (sticky) */}
          <aside className="lg:sticky lg:top-20 space-y-6 h-max">
            {/* Standings */}
            <Card className="bg-black/80 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100">Standings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-40 w-full bg-neutral-800" />
                ) : (
                  <StandingsCard teams={nhlStandings} />
                )}
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="bg-black/80 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs uppercase text-neutral-400 mb-2 flex items-center gap-2">
                    <img
                      src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"
                      alt="NHL"
                      className="w-4 h-4"
                    />
                    SCSHL
                  </div>
                  <div className="space-y-3">
                    {loading
                      ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full bg-neutral-800" />)
                      : nhlTrades.slice(0, 3).map((t) => <TradeCard key={t.id} trade={t} />)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Waivers */}
            <Card className="bg-black/80 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100">Recent Waivers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs uppercase text-neutral-400 mb-2">SCSHL</div>
                  <div className="space-y-3">
                    {loading
                      ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full bg-neutral-800" />)
                      : nhlWaivers.slice(0, 2).map((w) => <WaiverCard key={w.id} waiver={w} />)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
      {/* ============================ /ESPN TOP STACK ============================ */}

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-neutral-950 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(700px 360px at 20% 0%, rgba(234,179,8,0.22), transparent 60%), radial-gradient(700px 360px at 80% 10%, rgba(250,204,21,0.18), transparent 60%)",
          }}
        />
        <div className="absolute top-0 left-0 w-32 h-32 geometric-accent text-yellow-500/40"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 geometric-accent text-yellow-500/40 rotate-180"></div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-8">
              <motion.img
                src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"
                alt="SCS Logo"
                className="w-56 h-56 drop-shadow-2xl rounded-2xl bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm border border-yellow-500/40 shadow-[0_0_35px_rgba(250,204,21,0.25)]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Button
                asChild
                size="lg"
                className="font-bold text-lg px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black border-0 shadow-[0_0_35px_rgba(250,204,21,0.4)] transform hover:scale-105 transition-all duration-300"
              >
                <Link href="/register/season">
                  <UserPlus className="h-6 w-6 mr-3" />
                  Season Signup
                  <ChevronRight className="h-6 w-6 ml-3" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Banner */}
      <section className="relative">
        <div className="w-full bg-gradient-to-r from-black via-neutral-950 to-black">
          <img
            src="https://cewrogcukeebjkpzsthw.supabase.co/storage/v1/object/public/media/photos/general/OFF-SEASON_BANNER.png"
            alt="Off-Season Banner"
            className="w-full h-auto object-cover opacity-95"
          />
        </div>
      </section>

      {/* Placeholder for original franchise block */}
      <section className="relative py-20 bg-gradient-to-br from-black via-neutral-950 to-black">
        {/* keep your existing content here if you had any */}
      </section>

      {/* STATS */}
      <section className="relative py-20 bg-gradient-to-br from-black via-neutral-950 to-black">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950/90 to-black"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-yellow-300 via-white to-yellow-400 bg-clip-text text-transparent tracking-tight">
              LEAGUE STATISTICS
            </h2>
            <p className="text-neutral-400 text-lg">Real-time data from the SCSHL league</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Users, label: "Active Players", value: stats.totalPlayers, color: "from-yellow-400 to-amber-500" },
              { icon: Trophy, label: "SCS Teams", value: stats.nhlTeams, color: "from-amber-500 to-yellow-400" },
              { icon: Calendar, label: "Total Matches", value: stats.totalMatches, color: "from-yellow-300 to-yellow-500" },
              {
                icon: TrendingUp,
                label: "Completed Trades",
                value: stats.completedTrades,
                color: "from-amber-400 to-amber-600",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="relative overflow-hidden bg-black/80 border-neutral-800 backdrop-blur-sm hover:bg-black/90 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.25)]">
                  <CardContent className="p-6">
                    <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-full w-fit mx-auto mb-4`}>
                      <stat.icon className="h-8 w-8 text-black" />
                    </div>
                    <div className="text-3xl font-black mb-2 text-white">
                      <AnimatedCounter end={stat.value} />
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hide scrollbar utility for the ribbon */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
