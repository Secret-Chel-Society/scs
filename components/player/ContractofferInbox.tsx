"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Check, X, Crown, Clock } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ContractOffer {
  id: string
  team_id: string
  league: string
  offer_type: "1SZN" | "2SZN" | "FRANCHISE"
  salary_amount: number
  status: "pending" | "accepted" | "rejected" | "expired"
  offered_at: string
  team?: {
    name: string
    logo_url: string | null
  }
}

interface ContractOffersInboxProps {
  playerId: string
}

export function ContractOffersInbox({ playerId }: ContractOffersInboxProps) {
  const { supabase } = useSupabase()
  const [offers, setOffers] = useState<ContractOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const fetchOffers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contract_offers")
        .select(`
          *,
          teams (name, logo_url)
        `)
        .eq("player_id", playerId)
        .eq("status", "pending")
        .order("offered_at", { ascending: false })

      if (error) throw error
      
      // Map teams to team for display
      const mappedOffers = (data || []).map(offer => ({
        ...offer,
        team: offer.teams
      }))
      setOffers(mappedOffers)
    } catch (error) {
      console.error("Error fetching contract offers:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, playerId])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  const respondToOffer = async (offerId: string, accept: boolean) => {
    setResponding(offerId)
    try {
      const offer = offers.find(o => o.id === offerId)
      if (!offer) return

      // Update offer status
      const { error: offerError } = await supabase
        .from("contract_offers")
        .update({
          status: accept ? "accepted" : "rejected",
          responded_at: new Date().toISOString()
        })
        .eq("id", offerId)

      if (offerError) throw offerError

      if (accept) {
        // Update player contract
        const contractYears = offer.offer_type === "2SZN" ? 2 : 1
        const isFranchise = offer.offer_type === "FRANCHISE"

        const updates: any = {
          contract_type: offer.offer_type,
          contract_seasons_remaining: contractYears,
          salary: offer.salary_amount,
          has_franchise_tag: isFranchise
        }

        // Set team based on league
        if (offer.league === "NHL") {
          updates.team_id = offer.team_id
        } else {
          updates.team_id_ahl = offer.team_id
        }

        const { error: playerError } = await supabase
          .from("players")
          .update(updates)
          .eq("id", playerId)

        if (playerError) throw playerError

        // Reject all other pending offers from other teams
        await supabase
          .from("contract_offers")
          .update({ status: "rejected", responded_at: new Date().toISOString() })
          .eq("player_id", playerId)
          .eq("status", "pending")
          .neq("id", offerId)

        toast.success(`Contract accepted! You are now signed with ${offer.team?.name}`)
      } else {
        toast.success("Contract offer rejected")
      }

      fetchOffers()
    } catch (error) {
      console.error("Error responding to offer:", error)
      toast.error("Failed to respond to offer")
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (offers.length === 0) {
    return null // Don't show anything if no pending offers
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contract Offers
          <Badge variant="secondary">{offers.length}</Badge>
        </CardTitle>
        <CardDescription>
          You have pending contract offers. Accept one or they will default to 1SZN.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {offer.team?.logo_url ? (
                  <Image
                    src={offer.team.logo_url}
                    alt={offer.team.name || "Team"}
                    width={48}
                    height={48}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{offer.team?.name || "Unknown Team"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={offer.league === "NHL" ? "default" : "secondary"}>
                      {offer.league}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={offer.offer_type === "FRANCHISE" ? "border-yellow-500 text-yellow-500" : ""}
                    >
                      {offer.offer_type === "FRANCHISE" && <Crown className="h-3 w-3 mr-1" />}
                      {offer.offer_type}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${offer.salary_amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(offer.offered_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => respondToOffer(offer.id, true)}
                disabled={responding === offer.id}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => respondToOffer(offer.id, false)}
                disabled={responding === offer.id}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
