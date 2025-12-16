"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSupabase } from "@/lib/supabase/client"
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
  const [viewerRole, setViewerRole] = useState<string>("Player")
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const canRevealBidTeams = useMemo(() => {
    return ["Admin", "Owner", "GM", "AGM"].includes(viewerRole)
  }, [viewerRole])

  useEffect(() => {
    if (!isOpen) return
    if (!playerId) return

    ;(async () => {
      await loadViewerRole()
      await loadBidHistory()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, playerId])

  const loadViewerRole = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        setViewerRole("Player")
        return
      }

      const { data, error } = await supabase
        .from("players")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (!error && data?.role) setViewerRole(data.role)
      else setViewerRole("Player")
    } catch {
      setViewerRole("Player")
    }
  }

  const loadBidHistory = async () => {
    setLoading(true)

    try {
      // Managers can see team details
      if (canRevealBidTeams) {
        const { data, error } = await supabase
          .from("player_bidding")
          .select(
            `
            id,
            bid_amount,
            created_at,
            bid_expires_at,
            teams (
              id,
              name,
              logo_url
            )
          `,
          )
          .eq("player_id", playerId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setBids(data || [])
        return
      }

      // Players: redacted history only (no team join)
      const { data, error } = await supabase
        .from("player_bidding")
        .select("id,bid_amount,created_at,bid_expires_at")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })

      if (error) throw error
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
          <DialogTitle>
            Bid History for {playerName}
            {!canRevealBidTeams && <span className="text-muted-foreground text-sm"> (Teams hidden)</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
            </div>
          ) : bids.length === 0 ? (
            <p className="text-center text-muted-foreground">No bids have been placed yet.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {bids.map((bid) => (
                <div key={bid.id} className="border rounded-md p-3 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {canRevealBidTeams ? (
                        <>
                          {bid.teams?.logo_url ? (
                            <img
                              src={bid.teams.logo_url || "/placeholder.svg"}
                              alt={bid.teams.name}
                              className="h-6 w-6 mr-2 object-contain"
                            />
                          ) : null}
                          <span className="font-medium">{bid.teams?.name || "Unknown Team"}</span>
                        </>
                      ) : (
                        <span className="font-medium text-muted-foreground">Team hidden</span>
                      )}
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
