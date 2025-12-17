"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TeamSummaryStatsProps {
  userTeam?: any
  playerBids?: Record<string, any>
}

// Match your main page logic (handles full names + abbreviations)
const getPositionAbbreviation = (position: string): "C" | "LW" | "RW" | "LD" | "RD" | "G" | "?" => {
  if (!position) return "?"
  const p = position.trim().toLowerCase()

  const map: Record<string, any> = {
    goalie: "G",
    g: "G",
    center: "C",
    c: "C",
    "left wing": "LW",
    lw: "LW",
    "right wing": "RW",
    rw: "RW",
    "left defense": "LD",
    ld: "LD",
    "right defense": "RD",
    rd: "RD",
  }

  return map[p] || "?"
}

export function TeamSummaryStats({ userTeam, playerBids = {} }: TeamSummaryStatsProps) {
  const [teamStats, setTeamStats] = useState({
    currentSalary: 0,
    rosterSize: 0,
    positionBreakdown: {
      C: 0,
      LW: 0,
      RW: 0,
      LD: 0,
      RD: 0,
      G: 0,
    },
  })

  const [pendingBids, setPendingBids] = useState({
    totalBidAmount: 0,
    bidCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const { supabase } = useSupabase()

  const SALARY_CAP = 75000000 // $75M

  const calculatePendingBids = useCallback(() => {
    if (!userTeam) return

    let totalBidAmount = 0
    let bidCount = 0

    // NOTE: playerBids is "highest bid per player" in your management page
    Object.values(playerBids).forEach((bid: any) => {
      if (bid?.team_id === userTeam.id) {
        totalBidAmount += Number(bid.bid_amount || 0)
        bidCount += 1
      }
    })

    setPendingBids({ totalBidAmount, bidCount })
  }, [playerBids, userTeam])

  const fetchTeamStats = useCallback(async () => {
    if (!userTeam?.id) return

    setLoading(true)

    try {
      // 1) Pull roster from players (this is the source of truth for salary/size)
      const { data: players, error } = await supabase
        .from("players")
        .select(
          `
          salary,
          user_id
        `,
        )
        .eq("team_id", userTeam.id)

      if (error) throw error

      const roster = players || []
      const userIds = roster.map((p: any) => p.user_id).filter(Boolean)

      // 2) Pull positions from season_registrations (by user_id)
      // Prefer active season if you have seasons table, otherwise fall back to latest approved
      let registrations: any[] = []

      const { data: activeSeason } = await supabase.from("seasons").select("id").eq("is_active", true).maybeSingle()

      if (activeSeason?.id && userIds.length > 0) {
        const { data: regs, error: regErr } = await supabase
          .from("season_registrations")
          .select("user_id, primary_position, secondary_position")
          .in("user_id", userIds)
          .eq("season_id", activeSeason.id)
          .eq("status", "Approved")

        if (!regErr && regs) registrations = regs
      }

      // Fallback: most recent approved per user if active season didn’t return anything
      if (registrations.length === 0 && userIds.length > 0) {
        const { data: regs, error: regErr } = await supabase
          .from("season_registrations")
          .select("user_id, primary_position, secondary_position, season_id")
          .in("user_id", userIds)
          .eq("status", "Approved")
          .order("season_id", { ascending: false })

        if (!regErr && regs) {
          const latest: Record<string, any> = {}
          regs.forEach((r: any) => {
            if (!latest[r.user_id]) latest[r.user_id] = r
          })
          registrations = Object.values(latest)
        }
      }

      // 3) Compute stats
      const positionBreakdown = { C: 0, LW: 0, RW: 0, LD: 0, RD: 0, G: 0 }

      const currentSalary = roster.reduce((sum: number, p: any) => sum + Number(p.salary || 0), 0)
      const rosterSize = roster.length

      roster.forEach((p: any) => {
        const reg = registrations.find((r: any) => r.user_id === p.user_id)
        const primary = getPositionAbbreviation(reg?.primary_position || "")
        if (primary !== "?" && positionBreakdown.hasOwnProperty(primary)) {
          positionBreakdown[primary as keyof typeof positionBreakdown] += 1
        }
      })

      setTeamStats({ currentSalary, rosterSize, positionBreakdown })
    } catch (err) {
      console.error("Error fetching team stats:", err)
      // Don’t leave stale loading state; keep last known values
    } finally {
      setLoading(false)
    }
  }, [supabase, userTeam?.id])

  useEffect(() => {
    if (!userTeam) return
    fetchTeamStats()
    calculatePendingBids()
  }, [userTeam, fetchTeamStats, calculatePendingBids])

  const projectedSalary = teamStats.currentSalary + pendingBids.totalBidAmount
  const projectedRosterSize = teamStats.rosterSize + pendingBids.bidCount
  const hasPendingBids = pendingBids.bidCount > 0

  if (!userTeam || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="h-16 bg-slate-700 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Team Salary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h3 className="text-white font-semibold mb-3">Team Salary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Current</span>
              <span className="text-white font-medium">
                ${teamStats.currentSalary.toLocaleString()} / ${(SALARY_CAP / 1000000).toFixed(0)}M
              </span>
            </div>
            <Progress value={(teamStats.currentSalary / SALARY_CAP) * 100} className="h-2 bg-slate-700" />

            {hasPendingBids && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Projected</span>
                  <span className={`font-medium ${projectedSalary > SALARY_CAP ? "text-red-400" : "text-slate-400"}`}>
                    ${projectedSalary.toLocaleString()} / ${(SALARY_CAP / 1000000).toFixed(0)}M
                  </span>
                </div>
                <Progress value={(projectedSalary / SALARY_CAP) * 100} className="h-2 bg-slate-700 opacity-60" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roster Size */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h3 className="text-white font-semibold mb-3">Roster Size</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Current</span>
              <span className="text-white font-medium">{teamStats.rosterSize} / 15 players</span>
            </div>
            <Progress value={(teamStats.rosterSize / 15) * 100} className="h-2 bg-slate-700" />

            {hasPendingBids && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Projected</span>
                  <span className={`font-medium ${projectedRosterSize > 15 ? "text-red-400" : "text-slate-400"}`}>
                    {projectedRosterSize} / 15 players
                  </span>
                </div>
                <Progress value={(projectedRosterSize / 15) * 100} className="h-2 bg-slate-700 opacity-60" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Position Breakdown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h3 className="text-white font-semibold mb-3">Position Breakdown</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-400 font-medium">C:</span>
              <span className="text-white">{teamStats.positionBreakdown.C}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400 font-medium">LW:</span>
              <span className="text-white">{teamStats.positionBreakdown.LW}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-medium">RW:</span>
              <span className="text-white">{teamStats.positionBreakdown.RW}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400 font-medium">LD:</span>
              <span className="text-white">{teamStats.positionBreakdown.LD}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-medium">RD:</span>
              <span className="text-white">{teamStats.positionBreakdown.RD}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400 font-medium">G:</span>
              <span className="text-white">{teamStats.positionBreakdown.G}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
