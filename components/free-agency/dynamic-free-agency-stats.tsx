"use client"

import { useState, useEffect } from "react"
import { Users, DollarSign, Target } from "lucide-react"

interface FreeAgencyStats {
  availablePlayers: number
  totalBids: number
  activeTeams: number
}

export function DynamicFreeAgencyStats() {
  const [stats, setStats] = useState<FreeAgencyStats>({
    availablePlayers: 0,
    totalBids: 0,
    activeTeams: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all stats from the new API endpoint
        const response = await fetch("/api/free-agency-stats")
        const data = await response.json()
        
        if (response.ok) {
          setStats({
            availablePlayers: data.availablePlayers || 0,
            totalBids: data.totalBids || 0,
            activeTeams: data.activeTeams || 0,
          })
        } else {
          throw new Error("Failed to fetch statistics")
        }
      } catch (err) {
        console.error("Error fetching free agency stats:", err)
        setError("Failed to load statistics")
        // Set default values on error
        setStats({
          availablePlayers: 0,
          totalBids: 0,
          activeTeams: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="text-3xl font-bold text-blue-200 mb-2">...</div>
          <div className="text-blue-300 flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Available Players
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="text-3xl font-bold text-green-200 mb-2">...</div>
          <div className="text-green-300 flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Bids
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="text-3xl font-bold text-purple-200 mb-2">...</div>
          <div className="text-purple-300 flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            Active Teams
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="text-3xl font-bold text-blue-200 mb-2">0</div>
          <div className="text-blue-300 flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Available Players
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="text-3xl font-bold text-green-200 mb-2">$0</div>
          <div className="text-green-300 flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Bids
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="text-3xl font-bold text-purple-200 mb-2">0</div>
          <div className="text-purple-300 flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            Active Teams
          </div>
        </div>
      </div>
    )
  }

  // Format the total bids amount
  const formatBidAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    } else {
      return `$${amount}`
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">{stats.availablePlayers}</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Available Players
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">{formatBidAmount(stats.totalBids)}</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          Total Bids
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">{stats.activeTeams}</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Target className="h-5 w-5" />
          Active Teams
        </div>
      </div>
    </div>
  )
}
