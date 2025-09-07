"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from "@/lib/supabase/client"

interface BidModalProps {
  isOpen: boolean
  onClose: () => void
  player: any
  onSubmit: (amount: number) => void
  currentSalary: number
}

export function BidModal({ isOpen, onClose, player, onSubmit, currentSalary }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState(currentSalary || 750000)
  const [currentHighestBid, setCurrentHighestBid] = useState<number | null>(null)
  const [error, setError] = useState("")
  const { supabase } = useSupabase()

  // Ensure bid amount is always in 2M increments
  const roundToIncrement = (value: number): number => {
    const increment = 2000000
    return Math.round(value / increment) * increment
  }

  useEffect(() => {
    if (isOpen && player?.id) {
      // Get the current highest bid for this player
      const fetchCurrentHighestBid = async () => {
        try {
          const { data, error } = await supabase
            .from("player_bidding")
            .select("bid_amount")
            .eq("player_id", player.id)
            .order("bid_amount", { ascending: false })
            .limit(1)

          if (error) {
            console.error("Error fetching highest bid:", error)
            return
          }

          if (data && data.length > 0) {
            setCurrentHighestBid(data[0].bid_amount)
            const minimumBid = Math.max(data[0].bid_amount + 2000000, currentSalary || 750000)
            setBidAmount(roundToIncrement(minimumBid))
          } else {
            setCurrentHighestBid(null)
            setBidAmount(roundToIncrement(currentSalary || 750000))
          }
        } catch (err) {
          console.error("Failed to fetch highest bid:", err)
        }
      }

      fetchCurrentHighestBid()
    }
  }, [isOpen, player, currentSalary, supabase])

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value)) {
      setBidAmount(roundToIncrement(value))
      setError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const minimumBid = currentHighestBid ? currentHighestBid + 2000000 : currentSalary || 750000

    if (bidAmount < minimumBid) {
      setError(`Bid amount must be at least $${minimumBid.toLocaleString()}`)
      return
    }

    if (bidAmount > 15000000) {
      setError("Maximum bid amount is $15,000,000")
      return
    }

    // Ensure bid is in 2M increments
    if (bidAmount % 2000000 !== 0) {
      setError("Bid amount must be in $2,000,000 increments")
      return
    }

    onSubmit(bidAmount)
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-hockey-silver-900 border-hockey-silver-700 text-white">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">
            Place Bid for {player?.users?.gamer_tag_id || "Player"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {currentHighestBid ? (
              <div className="space-y-2">
                <Label className="text-hockey-silver-300">Current Highest Bid</Label>
                <div className="bg-hockey-silver-800 px-3 py-2 rounded-md font-mono text-lg text-assist-green-400 border border-hockey-silver-600">
                  {formatCurrency(currentHighestBid)}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-hockey-silver-300">Minimum Bid</Label>
                <div className="bg-hockey-silver-800 px-3 py-2 rounded-md font-mono text-lg text-assist-green-400 border border-hockey-silver-600">
                  {formatCurrency(currentSalary || 750000)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bid-amount" className="text-hockey-silver-300">
                Bid Amount <span className="text-xs text-hockey-silver-400">(in $2,000,000 increments)</span>
              </Label>
              <Input
                id="bid-amount"
                type="number"
                value={bidAmount}
                onChange={handleBidChange}
                onBlur={() => setBidAmount(roundToIncrement(bidAmount))}
                min={currentHighestBid ? currentHighestBid + 2000000 : currentSalary || 750000}
                max={15000000}
                step={2000000}
                required
                className="bg-white text-black border-hockey-silver-300 font-mono text-lg focus:ring-2 focus:ring-ice-blue-500"
              />
              <div className="text-sm text-hockey-silver-400">Bid will be rounded to nearest $2,000,000 increment</div>
            </div>

            {error && (
              <div className="text-red-400 text-sm p-3 bg-red-950/40 border border-red-800/50 rounded-md">{error}</div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-hockey-silver-700 text-hockey-silver-300 hover:bg-hockey-silver-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Submit Bid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
