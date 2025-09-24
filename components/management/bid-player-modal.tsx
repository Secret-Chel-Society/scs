"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"

interface BidPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  player: any
  teamData?: any
  userTeam?: any
  fetchData?: () => void
  fetchPlayerBids?: () => void
  currentTeamSalary?: number
  projectedSalary?: number
  currentSalaryCap?: number
  teamPlayers?: any[]
  projectedRosterSize?: number
  onBidPlaced?: () => void
  currentBid?: any
  salaryCap?: number
}

export function BidPlayerModal({
  isOpen,
  onClose,
  player,
  teamData,
  userTeam,
  fetchData,
  fetchPlayerBids,
  currentTeamSalary = 0,
  projectedSalary = 0,
  currentSalaryCap = 65000000,
  teamPlayers = [],
  projectedRosterSize = 0,
  onBidPlaced,
  currentBid,
  salaryCap = 65000000,
}: BidPlayerModalProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { supabase, session } = useSupabase()

  // Use either teamData or userTeam, with fallback
  const team = teamData || userTeam

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && player) {
      // Set minimum bid amount
      const currentBidAmount = currentBid?.bid_amount || 0
      const playerSalary = player.salary || 750000
      const minimumBid = Math.max(currentBidAmount + 2000000, 2000000)
      setBidAmount(minimumBid.toString())
      setError(null)
    } else {
      setBidAmount("")
      setError(null)
    }
  }, [isOpen, player, currentBid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!player || !team) {
      setError("Missing player or team information")
      return
    }

    if (!session?.user) {
      setError("You must be logged in to place a bid")
      return
    }

    const amount = Number.parseInt(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid bid amount")
      return
    }

    // Validate minimum bid
    const currentBidAmount = currentBid?.bid_amount || 0
    const playerSalary = player.salary || 750000
    const minimumBid = Math.max(currentBidAmount + 2000000, 2000000)

    if (amount < minimumBid) {
      setError(`Minimum bid is $${minimumBid.toLocaleString()}`)
      return
    }

    // Check salary cap
    const availableCapSpace = (salaryCap || currentSalaryCap) - (projectedSalary || currentTeamSalary)
    if (amount > availableCapSpace) {
      setError(`This bid would exceed your salary cap. Available space: $${availableCapSpace.toLocaleString()}`)
      return
    }

    // Check roster limit
    if (projectedRosterSize >= 15) {
      setError("Your team roster is full (15 players)")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log("Submitting bid:", {
        playerId: player.id,
        teamId: team.id,
        bidAmount: amount,
        playerName: player.users?.gamer_tag_id,
        teamName: team.name,
      })

      // Check if bidding is enabled
      const { data: biddingSettings, error: settingsError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "bidding_enabled")
        .single()

      if (settingsError) {
        console.error("Error checking bidding status:", settingsError)
      }

      if (biddingSettings && biddingSettings.value !== true) {
        setError("Bidding is currently disabled by league administrators")
        return
      }

      // Get the current bidding duration from system settings
      const { data: durationSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "bidding_duration")
        .single()

      // Default to 14400 seconds (4 hours) if setting not found
      const bidDurationSeconds = durationSetting?.value ? Number.parseInt(durationSetting.value) : 14400
      const expirationTime = new Date(Date.now() + bidDurationSeconds * 1000).toISOString()

      // Place bid using the simple API for testing
      const response = await fetch("/api/bids/simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          teamId: team.id,
          bidAmount: amount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to place bid")
      }

      toast({
        title: "Bid placed successfully",
        description: `Your bid of $${amount.toLocaleString()} has been placed for ${player.users?.gamer_tag_id || "the player"}.`,
      })

      // Call the callback functions to refresh data
      if (onBidPlaced) {
        onBidPlaced()
      }
      if (fetchData) {
        fetchData()
      }
      if (fetchPlayerBids) {
        fetchPlayerBids()
      }

      onClose()
    } catch (error: any) {
      console.error("Error placing bid:", error)
      setError(error.message || "Failed to place bid")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!player) {
    return null
  }

  const currentBidAmount = currentBid?.bid_amount || 0
  const playerSalary = player.salary || 750000
  const minimumBid = Math.max(currentBidAmount + 250000, playerSalary)
  const isExtendingBid = currentBid && currentBid.team_id === team?.id

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isExtendingBid ? "Extend Bid" : "Place Bid"} - {player.users?.gamer_tag_id || "Unknown Player"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</h3>
            <p className="text-sm text-muted-foreground">Current Salary: ${(playerSalary / 1000000).toFixed(2)}M</p>
          </div>

          {/* Current Bid Info */}
          {currentBid && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Current Highest Bid</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ${currentBid.bid_amount.toLocaleString()} by {currentBid.teams?.name || "Unknown Team"}
              </p>
              {isExtendingBid && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">You are extending your existing bid</p>
              )}
            </div>
          )}

          {/* Team Info */}
          {team && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Your Team: {team.name}</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Salary Cap: ${((projectedSalary || currentTeamSalary) / 1000000).toFixed(1)}M / $
                {((salaryCap || currentSalaryCap) / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Roster: {projectedRosterSize || teamPlayers.length} / 15 players
              </p>
            </div>
          )}

          {/* Bid Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bidAmount">Bid Amount</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={minimumBid}
                step="2000000"
                placeholder={`Minimum: $${minimumBid.toLocaleString()}`}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum bid: ${minimumBid.toLocaleString()} (increments of $2,000,000)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !team} className="flex-1">
                {isSubmitting ? "Placing Bid..." : isExtendingBid ? "Extend Bid" : "Place Bid"}
              </Button>
            </div>
          </form>

          {!team && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Missing team information. Please refresh the page and try again.
              </p>
            </div>
          )}

          {!session && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                You must be logged in to place bids. Please refresh the page and try again.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
