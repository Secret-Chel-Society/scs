"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSupabase } from "@/lib/supabase/client"
import { FileText, Crown, UserX, AlertTriangle, ArrowUpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const ContractOfferDialog = dynamic(
  () => import("@/components/management/ContractOfferDialog").then(mod => mod.ContractOfferDialog),
  { ssr: false }
)

type Props = {
  teamPlayers: any[]
  tcPlayers?: any[]
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string
  teamId?: string
  teamName?: string
  league?: "nhl" | "ahl"
  isManager?: boolean
}

export default function TeamRosterTab({
  teamPlayers,
  tcPlayers = [],
  getPositionAbbreviation,
  getPositionColor,
  teamId,
  teamName,
  league = "nhl",
  isManager = false
}: Props) {
  const { supabase, session } = useSupabase()

  const [registrationsByUser, setRegistrationsByUser] = useState<Record<string, any>>({})
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null)
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [hasFranchisePlayer, setHasFranchisePlayer] = useState(false)
  
  // Release player state
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [playerToRelease, setPlayerToRelease] = useState<any>(null)
  const [releaseReason, setReleaseReason] = useState("")
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false)
  
  // Call-up state
  const [callingUpPlayers, setCallingUpPlayers] = useState<Set<string>>(new Set())
  
  const { toast } = useToast()

  const safePlayers = useMemo(() => (Array.isArray(teamPlayers) ? teamPlayers : []), [teamPlayers])

  // Check if team already has a franchise player
  useEffect(() => {
    const hasFranchise = safePlayers.some(p => p.is_franchise_player)
    setHasFranchisePlayer(hasFranchise)
  }, [safePlayers])

  const handleOfferContract = (player: any) => {
    setSelectedPlayer({
      id: player.id,
      gamer_tag_id: player?.users?.gamer_tag_id || "Unknown",
      contract_salary: player?.salary || 0,
      contract_type: player?.contract_type || null,
      is_franchise_player: player?.is_franchise_player || false
    })
    setContractDialogOpen(true)
  }

  const handleReleasePlayer = (player: any) => {
    setPlayerToRelease(player)
    setReleaseReason("")
    setReleaseDialogOpen(true)
  }

  const submitReleaseRequest = async () => {
    if (!playerToRelease || !releaseReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for releasing this player.",
        variant: "destructive",
      })
      return
    }

    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "You must be logged in to release a player.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingRelease(true)
    try {
      const response = await fetch("/api/player-releases", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          player_id: playerToRelease.id,
          reason: releaseReason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit release request")
      }

      toast({
        title: "Release Request Submitted",
        description: "An admin will review your request to release this player.",
      })
      setReleaseDialogOpen(false)
      setPlayerToRelease(null)
      setReleaseReason("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit release request",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingRelease(false)
    }
  }

  const handleCallUp = async (player: any) => {
    if (!player?.id) return
    
    setCallingUpPlayers(prev => new Set(prev).add(player.id))
    
    try {
      const response = await fetch("/api/tc/call-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          league,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to call up player")
      }

      toast({
        title: "Player Called Up",
        description: `${player?.users?.gamer_tag_id || "Player"} has been called up from Training Camp.`,
      })
      
      // Refresh page to update rosters
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to call up player",
        variant: "destructive",
      })
    } finally {
      setCallingUpPlayers(prev => {
        const newSet = new Set(prev)
        newSet.delete(player.id)
        return newSet
      })
    }
  }

  const safeTcPlayers = useMemo(() => (Array.isArray(tcPlayers) ? tcPlayers : []), [tcPlayers])

  useEffect(() => {
    let cancelled = false
    const loadRegistrations = async () => {
      try {
        // Get active season
        const { data: activeSeason } = await supabase
          .from("seasons")
          .select("id, season_number")
          .eq("is_active", true)
          .maybeSingle()

        if (!cancelled && activeSeason) {
          setActiveSeasonId(activeSeason.id)
          setActiveSeasonNumber(activeSeason.season_number)
        }

        // Get user IDs from team players
        const userIds = safePlayers.map((p) => p.user_id).filter(Boolean)

        if (userIds.length === 0) return

        // Fetch registrations for these users
        let query = supabase
          .from("season_registrations")
          .select("user_id, primary_position, secondary_position, season_id, season_number, status, is_late_signup")
          .in("user_id", userIds)
          .eq("status", "Approved")

        // Filter by active season if we have one
        if (activeSeason?.id) {
          query = query.eq("season_id", activeSeason.id)
        }

        const { data: registrations, error } = await query

        if (!cancelled && registrations) {
          const regMap: Record<string, any> = {}
          for (const reg of registrations) {
            regMap[reg.user_id] = reg
          }
          setRegistrationsByUser(regMap)
        }
      } catch (e) {
        console.error("TeamRosterTab error loading registrations:", e)
      }
    }
    loadRegistrations()
    return () => {
      cancelled = true
    }
  }, [supabase, safePlayers])

  const getPlayerPosition = (player: any) => {
    // First check our directly fetched registrations
    const fetchedReg = registrationsByUser[player.user_id]
    if (fetchedReg) {
      return {
        primary: fetchedReg.primary_position,
        secondary: fetchedReg.secondary_position,
        isLateSignup: fetchedReg.is_late_signup,
      }
    }

    // Then check if registration was passed with player data
    const regs = Array.isArray(player?.season_registrations) ? player.season_registrations : []
    if (regs.length > 0) {
      const reg = regs[0]
      return {
        primary: reg?.primary_position,
        secondary: reg?.secondary_position,
        isLateSignup: reg?.is_late_signup,
      }
    }

    return { primary: null, secondary: null, isLateSignup: false }
  }

  const renderPosition = (player: any) => {
    const { primary, secondary } = getPlayerPosition(player)
    const primaryPos = primary ?? "UNKNOWN"

    return (
      <div className="flex items-center justify-center gap-1">
        <span className={getPositionColor(primaryPos)}>{getPositionAbbreviation(primaryPos)}</span>
        {secondary && (
          <>
            {" / "}
            <span className={getPositionColor(secondary)}>{getPositionAbbreviation(secondary)}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Team Roster</CardTitle>
        <CardDescription className="text-sm md:text-base">Manage your team's players and roles</CardDescription>
      </CardHeader>
      <CardContent>
        {safePlayers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Position</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Console</TableHead>
                    <TableHead className="text-center">Contract</TableHead>
                    <TableHead className="text-center">Salary</TableHead>
                    {isManager && teamId && <TableHead className="text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safePlayers.map((player) => {
                    const { isLateSignup } = getPlayerPosition(player)
                    return (
                    <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-medium">
                          {player?.users?.gamer_tag_id || "Unknown Player"}
                          {isLateSignup && <span className="text-red-500 ml-1 text-xs font-bold">(LS)</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{renderPosition(player)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={player?.role === "Owner" ? "default" : "outline"}>
                          {player?.role ?? "Player"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{player?.users?.console || "Unknown"}</TableCell>
                      <TableCell className="text-center">
                        {player?.contract_type ? (
                          <div className="flex items-center justify-center gap-1">
                            <Badge
                              variant="outline"
                              className={player?.is_franchise_player ? "border-yellow-500 text-yellow-500" : ""}
                            >
                              {player?.is_franchise_player && <Crown className="h-3 w-3 mr-1" />}
                              {player?.contract_type}
                            </Badge>
                            {player?.contract_years_remaining && (
                              <span className="text-xs text-muted-foreground">
                                ({player?.contract_years_remaining}yr)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        ${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M
                        {player?.is_franchise_player && (
                          <span className="text-xs text-yellow-500 ml-1">(-25%)</span>
                        )}
                      </TableCell>
                      {isManager && teamId && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOfferContract(player)}
                              title="Offer Contract"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => handleReleasePlayer(player)}
                              title="Release Player"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )})}
                  
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {safePlayers.map((player) => {
                const { isLateSignup } = getPlayerPosition(player)
                return (
                <div key={player.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base break-words">
                        {player?.users?.gamer_tag_id || "Unknown Player"}
                        {isLateSignup && <span className="text-red-500 ml-1 text-xs font-bold">(LS)</span>}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {renderPosition(player)}
                      </div>
                    </div>

                    <Badge variant={player?.role === "Owner" ? "default" : "outline"} className="text-xs shrink-0">
                      {player?.role ?? "Player"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Console</span>
                      <span>{player?.users?.console || "Unknown"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Contract</span>
                      <div className="flex items-center gap-1">
                        {player?.contract_type ? (
                          <>
                            <Badge
                              variant="outline"
                              className={player?.is_franchise_player ? "border-yellow-500 text-yellow-500" : ""}
                            >
                              {player?.is_franchise_player && <Crown className="h-3 w-3 mr-1" />}
                              {player?.contract_type}
                            </Badge>
                            {player?.contract_years_remaining && (
                              <span className="text-xs text-muted-foreground">
                                ({player?.contract_years_remaining}yr)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Salary</span>
                      <span className="font-mono font-medium">
                        ${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M
                        {player?.is_franchise_player && (
                          <span className="text-xs text-yellow-500 ml-1">(-25%)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {isManager && teamId && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOfferContract(player)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Offer Contract
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => handleReleasePlayer(player)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Release Player
                      </Button>
                    </div>
                  )}
                </div>
              )})}
              
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No players on this team.</div>
        )}

        {/* TC Roster Section */}
        {safeTcPlayers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-amber-500">Training Camp Roster</h3>
            
            {/* Desktop TC Table */}
            <div className="hidden md:block rounded-md border border-amber-500/30 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-500/10">
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Position</TableHead>
                    <TableHead className="text-center">Console</TableHead>
                    <TableHead className="text-center">Salary</TableHead>
                    {isManager && <TableHead className="text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeTcPlayers.map((player) => {
                    const { isLateSignup } = getPlayerPosition(player)
                    return (
                      <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {player?.users?.gamer_tag_id || "Unknown Player"}
                            <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50">TC</Badge>
                            {isLateSignup && <span className="text-red-500 text-xs font-bold">(LS)</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{renderPosition(player)}</TableCell>
                        <TableCell className="text-center">{player?.users?.console || "Unknown"}</TableCell>
                        <TableCell className="text-center font-mono">$0</TableCell>
                        {isManager && (
                          <TableCell className="text-center">
                            {isLateSignup ? (
                              <span className="text-xs text-muted-foreground">LS - Cannot Call Up</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                                onClick={() => handleCallUp(player)}
                                disabled={callingUpPlayers.has(player.id)}
                                title="Call Up to Main Roster"
                              >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                {callingUpPlayers.has(player.id) ? "Calling Up..." : "Call Up"}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile TC Cards */}
            <div className="md:hidden space-y-3">
              {safeTcPlayers.map((player) => {
                const { isLateSignup } = getPlayerPosition(player)
                return (
                  <div key={player.id} className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base flex items-center gap-2 flex-wrap">
                          {player?.users?.gamer_tag_id || "Unknown Player"}
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50">TC</Badge>
                          {isLateSignup && <span className="text-red-500 text-xs font-bold">(LS)</span>}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {renderPosition(player)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Console</span>
                        <span>{player?.users?.console || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Salary</span>
                        <span className="font-mono font-medium">$0</span>
                      </div>
                    </div>

                    {isManager && (
                      <div className="mt-3 pt-3 border-t border-amber-500/30">
                        {isLateSignup ? (
                          <div className="text-center text-xs text-muted-foreground py-2">
                            Late Signup - Cannot Call Up
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-green-500 border-green-500/50 hover:bg-green-500/10"
                            onClick={() => handleCallUp(player)}
                            disabled={callingUpPlayers.has(player.id)}
                          >
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            {callingUpPlayers.has(player.id) ? "Calling Up..." : "Call Up to Main Roster"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Contract Offer Dialog */}
      {teamId && (
        <ContractOfferDialog
          open={contractDialogOpen}
          onOpenChange={setContractDialogOpen}
          player={selectedPlayer}
          teamId={teamId}
          teamName={teamName}
          league={league}
          hasFranchisePlayer={hasFranchisePlayer}
          onOfferSent={() => {
            setContractDialogOpen(false)
            // Optionally refresh data
          }}
        />
      )}

      {/* Release Player Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Release Player
            </DialogTitle>
            <DialogDescription>
              You are requesting to release{" "}
              <span className="font-semibold text-foreground">
                {playerToRelease?.users?.gamer_tag_id || "this player"}
              </span>{" "}
              from the team. This request requires admin approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">
                <strong>Warning:</strong> If approved, this player will be permanently removed from the team and 
                will not be able to be signed again through free agency or bidding.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="release-reason" className="text-sm font-medium">
                Reason for Release <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="release-reason"
                placeholder="Please provide a detailed reason for releasing this player..."
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be reviewed by an admin before the release is approved.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setReleaseDialogOpen(false)}
              disabled={isSubmittingRelease}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReleaseRequest}
              disabled={isSubmittingRelease || !releaseReason.trim()}
              className="w-full sm:w-auto"
            >
              {isSubmittingRelease ? "Submitting..." : "Submit Release Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
