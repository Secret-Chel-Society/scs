"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface BidHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  playerId: string
  playerName: string
}

export function BidHistoryModal({ isOpen, onClose, playerId, playerName }: BidHistoryModalProps) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && playerId) {
      loadBidHistory()
    }
  }, [isOpen, playerId])

  const loadBidHistory = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("player_bidding")
        .select(`
          id,
          bid_amount,
          created_at,
          bid_expires_at,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setBids(data || [])
    } catch (error: any) {
      toast({
        title: "Error loading bid history",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bid History for {playerName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : bids.length === 0 ? (
            <p className="text-center text-muted-foreground">No bids have been placed yet.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {bids.map((bid) => (
                <div key={bid.id} className="border rounded-md p-3 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {bid.teams.logo_url ? (
                        <img
                          src={bid.teams.logo_url || "/placeholder.svg"}
                          alt={bid.teams.name}
                          className="h-6 w-6 mr-2 object-contain"
                        />
                      ) : null}
                      <span className="font-medium">{bid.teams.name}</span>
                    </div>
                    <span className="font-bold">${bid.bid_amount.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Placed: {format(new Date(bid.created_at), "MMM d, yyyy h:mm a")}</span>
                    <span>Expires: {format(new Date(bid.bid_expires_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
