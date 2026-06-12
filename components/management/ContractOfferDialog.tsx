"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, Crown } from "lucide-react"
import { toast } from "sonner"

interface Player {
  id: string
  gamer_tag_id: string
  contract_salary: number | null
  contract_type: string | null
  is_franchise_player: boolean
}

interface ContractOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player | null
  teamId: string
  teamName?: string
  league: "nhl" | "ahl"
  hasFranchisePlayer: boolean
  onOfferSent: () => void
}

export function ContractOfferDialog({
  open,
  onOpenChange,
  player,
  teamId,
  teamName = "Team",
  league,
  hasFranchisePlayer,
  onOfferSent
}: ContractOfferDialogProps) {
  const { supabase } = useSupabase()
  const [contractType, setContractType] = useState<"1SZN" | "2SZN" | "FRANCHISE">("1SZN")
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingWindow, setCheckingWindow] = useState(true)

  useEffect(() => {
    async function checkContractWindow() {
      setCheckingWindow(true)
      try {
        const leagueUpper = league.toUpperCase() // Database uses "NHL"/"AHL"
        const { data: settings, error } = await supabase
          .from("contract_settings")
          .select("*")
          .eq("league", leagueUpper)
          .maybeSingle()

        if (error) throw error

        if (settings) {
          const now = new Date()
          const windowStart = settings.contract_window_start ? new Date(settings.contract_window_start) : null
          const windowEnd = settings.contract_window_end ? new Date(settings.contract_window_end) : null

          const isInWindow = settings.is_window_open && 
            (!windowStart || now >= windowStart) && 
            (!windowEnd || now <= windowEnd)

          setIsWindowOpen(isInWindow)
        } else {
          setIsWindowOpen(false)
        }
      } catch (error) {
        console.error("Error checking contract window:", error)
        setIsWindowOpen(false)
      } finally {
        setCheckingWindow(false)
      }
    }

    if (open) {
      checkContractWindow()
      setContractType("1SZN")
    }
  }, [open, league, supabase])

  const calculateSalary = () => {
    const baseSalary = player?.contract_salary || 0
    if (contractType === "FRANCHISE") {
      return baseSalary * 0.75 // 25% discount
    }
    return baseSalary
  }

  const sendOffer = async () => {
    if (!player) return

    setLoading(true)
    try {
      // Check if there's already a pending offer for this player from this team
      const { data: existingOffer, error: checkError } = await supabase
        .from("contract_offers")
        .select("id")
        .eq("player_id", player.id)
        .eq("team_id", teamId)
        .eq("league", league.toUpperCase())
        .eq("status", "pending")
        .maybeSingle()

      if (checkError) throw checkError

      if (existingOffer) {
        toast.error("There's already a pending offer for this player")
        return
      }

      // Check franchise limit
      if (contractType === "FRANCHISE" && hasFranchisePlayer) {
        toast.error("You already have a franchise player. Only 1 allowed per team.")
        return
      }

      // Get the player's user_id for notification
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("user_id")
        .eq("id", player.id)
        .single()

      if (playerError) throw playerError

      // Create the offer
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiration
      
      const { data: offerData, error } = await supabase
        .from("contract_offers")
        .insert({
          player_id: player.id,
          team_id: teamId,
          league: league.toUpperCase(),
          offer_type: contractType,
          salary_amount: calculateSalary(),
          status: "pending",
          expires_at: expiresAt.toISOString()
        })
        .select("id")
        .single()

      if (error) throw error

      // Create notification for the player with the contract offer ID for accept/reject actions
      if (playerData?.user_id && offerData?.id) {
        const salaryFormatted = calculateSalary().toLocaleString()
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: playerData.user_id,
            title: "Contract Offer Received",
            message: `${teamName} has offered you a ${contractType} contract worth $${salaryFormatted} in the ${league.toUpperCase()}.`,
            read: false,
            link: "/dashboard",
            data: { 
              type: "contract_offer", 
              contract_offer_id: offerData.id,
              player_id: player.id,
              team_id: teamId,
              team_name: teamName,
              contract_type: contractType, 
              salary: calculateSalary(), 
              league: league.toUpperCase() 
            }
          })
        
        if (notifError) {
          console.error("Error creating notification:", notifError)
        }
      }

      toast.success(`Contract offer sent to ${player.gamer_tag_id}`)
      onOfferSent()
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending contract offer:", error)
      toast.error("Failed to send contract offer")
    } finally {
      setLoading(false)
    }
  }

  if (!player) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Offer Contract
          </DialogTitle>
          <DialogDescription>
            Send a contract offer to {player.gamer_tag_id}
          </DialogDescription>
        </DialogHeader>

        {checkingWindow ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : !isWindowOpen ? (
          <div className="py-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Contract Window Closed</p>
                <p className="text-sm text-muted-foreground">
                  The {league.toUpperCase()} contract offer window is currently closed. 
                  Please wait for the admin to open it.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Current Contract</Label>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{player.contract_type || "None"}</Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Salary</span>
                  <span className="font-medium">${player.contract_salary?.toLocaleString() || "0"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Select Contract Type</Label>
              <RadioGroup
                value={contractType}
                onValueChange={(v) => setContractType(v as "1SZN" | "2SZN" | "FRANCHISE")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="1SZN" id="1szn" />
                  <Label htmlFor="1szn" className="flex-1 cursor-pointer">
                    <span className="font-medium">1SZN Contract</span>
                    <p className="text-sm text-muted-foreground">Standard 1 season contract</p>
                  </Label>
                  <span className="font-medium">${player.contract_salary?.toLocaleString() || "0"}</span>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="2SZN" id="2szn" />
                  <Label htmlFor="2szn" className="flex-1 cursor-pointer">
                    <span className="font-medium">2SZN Contract</span>
                    <p className="text-sm text-muted-foreground">2 season commitment</p>
                  </Label>
                  <span className="font-medium">${player.contract_salary?.toLocaleString() || "0"}</span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer ${
                  hasFranchisePlayer ? "opacity-50 pointer-events-none" : "border-yellow-500/30 bg-yellow-500/5"
                }`}>
                  <RadioGroupItem value="FRANCHISE" id="franchise" disabled={hasFranchisePlayer} />
                  <Label htmlFor="franchise" className="flex-1 cursor-pointer">
                    <span className="font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      FRANCHISE Contract
                    </span>
                    <p className="text-sm text-muted-foreground">
                      25% salary discount (1 per team)
                      {hasFranchisePlayer && " - Already have franchise player"}
                    </p>
                  </Label>
                  <span className="font-medium text-green-500">
                    ${((player.contract_salary || 0) * 0.75).toLocaleString()}
                  </span>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Offered Salary</span>
                <span className="text-lg font-bold">${calculateSalary().toLocaleString()}</span>
              </div>
              {contractType === "FRANCHISE" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Includes 25% franchise discount
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={sendOffer} 
            disabled={loading || !isWindowOpen || checkingWindow}
          >
            {loading ? "Sending..." : "Send Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
