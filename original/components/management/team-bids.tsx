"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"

interface TeamBidsProps {
  teamId: string
}

export function TeamBids({ teamId }: TeamBidsProps) {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const { supabase, session } = useSupabase()

  useEffect(() => {
    fetchBids()
  }, [])

  const fetchBids = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("player_bidding")
        .select(
          `
          id,
          player_id,
          team_id,
          bid_amount,
          expires_at,
          created_at,
          status,
          players:player_id (
            id,
            user_id,
            users:user_id (
              id,
              gamer_tag_id,
              primary_position,
              secondary_position
            )
          ),
          teams:team_id (
            id,
            name,
            logo_url
          )
        `,
        )
        .eq("team_id", teamId)
        .order("expires_at", { ascending: true })

      if (error) {
        throw error
      }

      setBids(data || [])
    } catch (err) {
      console.error("Error fetching bids:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const extendBid = async (bidId) => {
    try {
      // Ensure we have a valid session before making the request
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to extend bids.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/extend-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bidId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to extend bid")
      }

      toast({
        title: "Bid Extended",
        description: "The bid has been extended by 2 hours.",
      })

      // Refresh bids
      fetchBids()
    } catch (err) {
      console.error("Error extending bid:", err)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center p-4">Loading bids...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>
  }

  if (bids.length === 0) {
    return <div className="text-center p-4">No active bids found.</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Team Bids</h2>
      {bids.map((bid) => (
        <Card key={bid.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{bid.players?.users?.gamer_tag_id}</span>
                <span className="text-sm text-muted-foreground">
                  ({bid.players?.users?.primary_position}/{bid.players?.users?.secondary_position})
                </span>
              </div>
              <span className="text-lg font-bold">${(bid.bid_amount / 1000).toFixed(1)}k</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Expires: {new Date(bid.expires_at).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Status: {bid.status}</p>
              </div>
              <Button onClick={() => extendBid(bid.id)} variant="outline" size="sm">
                Extend Bid
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
