"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TeamSummaryStatsProps {
  userTeam?: any
  playerBids?: Record<string, any>
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
  const supabase = createClientComponentClient()

  const SALARY_CAP = 75000000 // $75M

  useEffect(() => {
    if (userTeam) {
      fetchTeamStats()
      calculatePendingBids()
    }
  }, [userTeam, playerBids])

  const fetchTeamStats = async () => {
    if (!userTeam) return

    try {
      // Get current team players
      const { data: players, error } = await supabase
        .from("players")
        .select(`
          salary,
          users:user_id (
            id,
            gamer_tag_id
          ),
          season_registrations!inner (
            primary_position,
            secondary_position
          )
        `)
        .eq("team_id", userTeam.id)

      if (error) throw error

      let currentSalary = 0
      let rosterSize = 0
      const positionBreakdown = {
        C: 0,
        LW: 0,
        RW: 0,
        LD: 0,
        RD: 0,
        G: 0,
      }

      players?.forEach((player) => {
        if (player.users) {
          currentSalary += player.salary || 0
          rosterSize += 1

          // Count primary position
          const primaryPos = player.season_registrations?.[0]?.primary_position
          if (primaryPos && positionBreakdown.hasOwnProperty(primaryPos)) {
            positionBreakdown[primaryPos as keyof typeof positionBreakdown] += 1
          }
        }
      })

      setTeamStats({
        currentSalary,
        rosterSize,
        positionBreakdown,
      })
    } catch (error) {
      console.error("Error fetching team stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePendingBids = () => {
    if (!userTeam) return

    let totalBidAmount = 0
    let bidCount = 0

    Object.values(playerBids).forEach((bid: any) => {
      if (bid.team_id === userTeam.id) {
        totalBidAmount += bid.bid_amount
        bidCount += 1
      }
    })

    setPendingBids({ totalBidAmount, bidCount })
  }

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
