"use client"

import { Suspense, useState, useEffect } from "react"
import { PublicBiddingRecap } from "@/components/free-agency/public-bidding-recap"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, DollarSign, Users, Target, TrendingUp, Award, Medal, Crown } from "lucide-react"

interface BiddingStats {
  totalBids: number
  totalPlayers: number
  totalTeams: number
  averageBid: number
}

function BiddingRecapStats() {
  const [stats, setStats] = useState<BiddingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/bidding-recap")
        if (response.ok) {
          const data = await response.json()
          if (data.totalBids && data.totalPlayers && data.totalTeams) {
            const totalBidAmount = data.playerBids?.reduce((sum: number, player: any) => sum + player.highestBid, 0) || 0
            const averageBid = data.totalBids > 0 ? totalBidAmount / data.totalBids : 0
            
            setStats({
              totalBids: data.totalBids,
              totalPlayers: data.totalPlayers,
              totalTeams: data.totalTeams,
              averageBid: averageBid
            })
          }
        }
      } catch (error) {
        console.error("Error fetching bidding stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <Skeleton className="h-8 w-20 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    } else {
      return `$${amount.toFixed(0)}`
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">
          {stats ? formatCurrency(stats.totalBids * (stats.averageBid || 50000)) : "$0"}
        </div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          Total Bids
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">
          {stats ? stats.totalPlayers : "0"}
        </div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Players Bidded
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">
          {stats ? stats.totalTeams : "0"}
        </div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Target className="h-5 w-5" />
          Active Teams
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">
          {stats ? formatCurrency(stats.averageBid) : "$0"}
        </div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" />
          Avg Bid
        </div>
      </div>
    </div>
  )
}

function BiddingRecapLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function BiddingRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              Bidding Recap
            </h1>
            <p className="text-xl text-green-200 mb-8">
              See how teams competed in the free agency market
            </p>
          </div>

          {/* Bidding Statistics */}
          <BiddingRecapStats />

          {/* Main Content */}
          <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <Suspense fallback={<BiddingRecapLoadingSkeleton />}>
                  <PublicBiddingRecap />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
