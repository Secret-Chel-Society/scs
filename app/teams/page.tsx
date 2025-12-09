"use client"

import { useMemo, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { TeamLogo } from "@/components/team-logo"
import { getAllTeamStats, getCurrentSeasonId } from "@/lib/team-utils"
import { Trophy, Award, Users, Search, ArrowUpDown, Grid2X2, Rows, ChevronRight, Sparkles, Shield } from "lucide-react"

// --- Constants --------------------------------------------------------------
const MAX_ROSTER_SIZE = 16
const CARDS_PER_SKELETON = 12

// --- Helpers ----------------------------------------------------------------
function safePct(numerator = 0, denominator = 1) {
  if (!denominator) return 0
  const pct = (numerator / denominator) * 100
  return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0
}

function formatMoneyM(value = 0) {
  return `$${(value / 1_000_000).toFixed(1)}M`
}

function cupAndTrophyCounts(awards = []) {
  let cups = 0
  let other = 0
  for (const a of awards) {
    if ((a?.award_type || "").toLowerCase().includes("cup")) cups++
    else other++
  }
  return { cups, other }
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ")
}

// Simple sparkbar from an array of numbers (0..max)
function SparkBar({ series }) {
  if (!series || !series.length) return null
  const max = Math.max(...series)
  return (
    <div className="flex items-end gap-0.5 h-6 w-full">
      {series.map((v, i) => (
        <div
          key={i}
          className="w-1.5 bg-primary/70 rounded-t"
          style={{ height: `${max ? (v / max) * 100 : 0}%` }}
          title={`Game ${i + 1}: ${v} pts`}
        />
      ))}
    </div>
  )
}

// Dot form (W/L/OTL) — expects array like ["W","W","L","OTL","W"]
function FormDots({ form = [] }) {
  const map = { W: "bg-emerald-500", L: "bg-rose-500", OTL: "bg-amber-500" }
  if (!form?.length) return null
  return (
    <div className="flex items-center gap-1" aria-label="recent form">
      {form.slice(-5).map((r, i) => (
        <div key={i} className={classNames("h-2.5 w-2.5 rounded-full", map[r] || "bg-muted-foreground/40")} />
      ))}
    </div>
  )
}

// --- Main Page --------------------------------------------------------------
export default function TeamsPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [view, setView] = useState("grid") // grid | table
  const [sortBy, setSortBy] = useState("points_desc")
  const [division, setDivision] = useState("all")
  // nhl | ahl | all (if you have league on team)

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setLoading(true)
        const seasonId = await getCurrentSeasonId()
        const teamStats = await getAllTeamStats(seasonId)
        const res = await fetch("/api/teams/awards")
        const { awards } = await res.json()

        // group awards by team
        const awardsByTeam = {}
        for (const a of awards || []) {
          if (!awardsByTeam[a.team_id]) awardsByTeam[a.team_id] = []
          awardsByTeam[a.team_id].push(a)
        }

        const merged = (teamStats || []).map((t) => ({ ...t, awards: awardsByTeam[t.id] || [] }))
        if (mounted) setTeams(merged)
      } catch (e) {
        toast({ title: "Error loading teams", description: (e && e.message) || "Failed to load teams.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [toast])

  // --- Derived metrics for header hero -------------------------------------
  const summary = useMemo(() => {
    if (!teams?.length) return { count: 0, avgPts: 0, totalCap: 0, avgCapUsed: 0 }
    const count = teams.length
    const avgPts = teams.reduce((s, t) => s + (t.points || 0), 0) / count
    const totalCap = teams.reduce((s, t) => s + (t.total_salary || 0), 0)
    const capUsedPct = teams.map((t) => safePct((t.total_salary || 0), ((t.salary_cap || t.cap_limit || 100_000_000))))
    const avgCapUsed = capUsedPct.reduce((s, x) => s + x, 0) / capUsedPct.length
    return { count, avgPts: Math.round(avgPts), totalCap, avgCapUsed: Math.round(avgCapUsed) }
  }, [teams])

  // --- Filtering & sorting --------------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = teams

        if (division !== "all") rows = rows.filter((t) => (t.division || "").toLowerCase() === division)
    if (q) rows = rows.filter((t) => (t.name || "").toLowerCase().includes(q))

    const sorters = {
      name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
      points_desc: (a, b) => (b.points || 0) - (a.points || 0),
      capspace_desc: (a, b) => (b.cap_space || 0) - (a.cap_space || 0),
      salary_asc: (a, b) => (a.total_salary || 0) - (b.total_salary || 0),
      roster_desc: (a, b) => (b.player_count || 0) - (a.player_count || 0),
    }
    const sorter = sorters[sortBy] || sorters.points_desc
    return [...rows].sort(sorter)
  }, [teams, query, division, sortBy])

  // --- UI -------------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" /> Teams
              </h1>
              <p className="text-muted-foreground mt-1">All NHL franchises competing this season.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <StatPill label="Total Teams" value={summary.count} />
                <StatPill label="Avg Points" value={summary.avgPts} />
                <StatPill label="Avg Cap Used" value={`${summary.avgCapUsed}%`} />
                <StatPill label="Total Payroll" value={formatMoneyM(summary.totalCap)} />
              </div>
            </div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search teams..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="atlantic">Atlantic</SelectItem>
                  <SelectItem value="metropolitan">Metropolitan</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="pacific">Pacific</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="points_desc"><div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4" /> Points</div></SelectItem>
                  <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                  <SelectItem value="capspace_desc">Cap Space</SelectItem>
                  <SelectItem value="salary_asc">Lowest Payroll</SelectItem>
                  <SelectItem value="roster_desc">Roster Size</SelectItem>
                </SelectContent>
              </Select>
              <div className="inline-flex rounded-lg border p-1 self-stretch">
                <Button variant={view === "grid" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setView("grid")}>
                  <Grid2X2 className="h-4 w-4" /> Grid
                </Button>
                <Button variant={view === "table" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setView("table")}>
                  <Rows className="h-4 w-4" /> Table
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: CARDS_PER_SKELETON }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : view === "table" ? (
          <TeamTable rows={filtered} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Subcomponents ----------------------------------------------------------
function StatPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 border rounded-2xl">
      <Shield className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 text-lg font-semibold">No teams match your filters</h3>
      <p className="text-muted-foreground text-sm">Try adjusting league, division, sort, or your search query.</p>
    </div>
  )
}

function CapBar({ used = 0, limit = 100_000_000, compact = false }) {
  const pct = safePct(used, limit)
  return (
    <div>
      <div className={compact ? "flex items-center justify-between text-[10px] text-muted-foreground" : "flex items-center justify-between text-xs text-muted-foreground"}>
        <span>Cap Usage</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className={compact ? "mt-0.5 h-1.5 w-full rounded-full bg-muted overflow-hidden" : "mt-1 h-2 w-full rounded-full bg-muted overflow-hidden"}>
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RosterBar({ count = 0, max = MAX_ROSTER_SIZE, compact = false }) {
  const pct = safePct(count, max)
  return (
    <div>
      <div className={compact ? "flex items-center justify-between text-[10px] text-muted-foreground" : "flex items-center justify-between text-xs text-muted-foreground"}>
        <span>Roster</span>
        <span>
          {count}/{max}
        </span>
      </div>
      <div className={compact ? "mt-0.5 h-1.5 w-full rounded-full bg-muted overflow-hidden" : "mt-1 h-2 w-full rounded-full bg-muted overflow-hidden"}>
        <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TeamCard({ team }) {
  const { cups, other } = cupAndTrophyCounts(team.awards)
  const limit = team.salary_cap || team.cap_limit || 100_000_000
  const capUsed = team.total_salary || 0

  const form = team.form_last5 || [] // e.g., ["W","W","L","OTL","W"]
  const pointsSeries = team.points_history || [] // e.g., [2,0,1,2,2,1]

  return (
    <Link href={`/teams/${team.id}`}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="group overflow-hidden h-full border-muted-foreground/20 hover:border-primary/40 transition-colors rounded-2xl">
          {/* Header gradient / logo slot */}
          <div className="relative h-28 w-full bg-gradient-to-r from-primary/15 via-background to-background">
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, var(--primary) 2px, transparent 2px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Centered logo tile */}
            <div className="absolute -bottom-0 left-5 h-24 w-24 flex items-center justify-center">
              {team.logo_url ? (
                <div className="relative h-20 w-20">
                  <Image
                    src={team.logo_url}
                    alt={team.name}
                    fill
                    className="object-contain drop-shadow-md"
                    sizes="80px"
                  />
                </div>
              ) : (
                <TeamLogo teamName={team.name} size="xl" />
              )}
            </div>
          </div>

          <CardContent className="pt-16 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold leading-tight">{team.name}</h2>
                <div className="mt-1 text-sm text-muted-foreground">Record: {team.wins}-{team.losses}-{team.otl}</div>
              </div>
              <div className="flex items-center gap-1">
                {cups > 0 && (
                  <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                    <Trophy className="h-3.5 w-3.5" /> {cups}
                  </Badge>
                )}
                {other > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Award className="h-3.5 w-3.5" /> {other}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-extrabold">{team.points ?? 0}</div>
                <div className="text-xs text-muted-foreground">PTS</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">{formatMoneyM(capUsed)}</div>
                <div className="text-xs text-muted-foreground">PAYROLL</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">{formatMoneyM(team.cap_space || 0)}</div>
                <div className="text-xs text-muted-foreground">CAP SPACE</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <CapBar used={capUsed} limit={limit} />
              <RosterBar count={team.player_count || 0} />
            </div>

            {(form?.length > 0 || pointsSeries?.length > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {form?.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Recent Form</div>
                    <FormDots form={form} />
                  </div>
                )}
                {pointsSeries?.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Points (last {pointsSeries.length})</div>
                    <SparkBar series={pointsSeries} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {(team.player_count || 0)}/{MAX_ROSTER_SIZE} players
                </span>
              </div>
              <div className="flex gap-2">
                <QuickLink href={`/teams/${team.id}`}>Overview</QuickLink>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

function QuickLink({ href, children }) {
  return (
    <Link href={href} className="text-xs inline-flex items-center gap-1 rounded-full border px-2.5 py-1 hover:border-primary">
      {children} <ChevronRight className="h-3 w-3" />
    </Link>
  )
}

function TeamTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      {/* Desktop / tablet (md+) */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 items-center bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
          <div className="col-span-4">Team</div>
          <div className="col-span-1 text-center">PTS</div>
          <div className="col-span-2 text-center">Record</div>
          <div className="col-span-2 text-center">Cap</div>
          <div className="col-span-1 text-center">Space</div>
          <div className="col-span-2 text-center">Roster</div>
        </div>
        <div className="divide-y">
          {rows.map((t) => {
            const { cups } = cupAndTrophyCounts(t.awards)
            const limit = t.salary_cap || t.cap_limit || 100_000_000
            return (
              <Link key={t.id} href={`/teams/${t.id}`} className="block hover:bg-muted/30">
                <div className="grid grid-cols-12 items-center px-4 py-3 gap-2">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="relative h-10 w-10 shrink-0">
                      {t.logo_url ? (
                        <Image src={t.logo_url} alt={t.name} fill className="object-contain" />
                      ) : (
                        <TeamLogo teamName={t.name} size="md" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight flex items-center gap-2 truncate">
                        <span className="truncate">{t.name}</span>
                        {cups > 0 && (
                          <Badge variant="outline" className="h-5 px-1.5 gap-1 border-yellow-500 text-yellow-600"><Trophy className="h-3 w-3" />{cups}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize truncate">
                        {t.division ? t.division : ""}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 text-center font-semibold">{t.points ?? 0}</div>
                  <div className="col-span-2 text-center text-sm text-muted-foreground">{t.wins}-{t.losses}-{t.otl}</div>
                  <div className="col-span-2"><CapBar used={t.total_salary || 0} limit={limit} /></div>
                  <div className="col-span-1 text-center">{formatMoneyM(t.cap_space || 0)}</div>
                  <div className="col-span-2"><RosterBar count={t.player_count || 0} /></div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile (<md) — compact list */}
      <div className="md:hidden divide-y">
        {rows.map((t) => {
          const limit = t.salary_cap || t.cap_limit || 100_000_000
          const { cups } = cupAndTrophyCounts(t.awards)
          return (
            <Link key={t.id} href={`/teams/${t.id}`} className="block">
              <div className="px-3 py-3 flex items-start gap-3">
                {/* Logo */}
                <div className="relative h-9 w-9 shrink-0">
                  {t.logo_url ? (
                    <Image src={t.logo_url} alt={t.name} fill className="object-contain" />
                  ) : (
                    <TeamLogo teamName={t.name} size="sm" />
                  )}
                </div>

                {/* Main */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight truncate flex items-center gap-2">
                        <span className="truncate">{t.name}</span>
                        {cups > 0 && (
                          <Badge variant="outline" className="h-4 text-[10px] px-1 border-yellow-500 text-yellow-600">
                            {cups}<Trophy className="ml-1 h-3 w-3"/>
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">{t.division || ""}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-base font-extrabold leading-none">{t.points ?? 0}</div>
                      <div className="text-[11px] text-muted-foreground">PTS</div>
                    </div>
                  </div>

                  {/* Second row: record and money */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div>{t.wins}-{t.losses}-{t.otl}</div>
                    <div className="flex items-center gap-3">
                      <div className="whitespace-nowrap">{formatMoneyM(t.total_salary || 0)}</div>
                      <div className="whitespace-nowrap">{formatMoneyM(t.cap_space || 0)}</div>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <CapBar used={t.total_salary || 0} limit={limit} compact />
                    <RosterBar count={t.player_count || 0} compact />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
