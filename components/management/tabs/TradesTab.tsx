"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight, CheckCircle2, XCircle } from "lucide-react"

type DraftPick = {
  id: string
  season_number: number
  round: number
  original_team?: { name?: string | null }
}

type ToastArgs = {
  title: string
  description?: string
  variant?: "destructive" | "default" | "outline" | "secondary" | null
}

type Props = {
  // data
  allTeams: any[]
  teamData: any | null
  teamPlayers: any[]
  tcPlayers?: any[]
  selectedTeamPlayers: any[]
  selectedTeamTcPlayers?: any[]
  myPicks: DraftPick[]
  otherTeamPicks: DraftPick[]

  // salary/cap
  currentSalaryCap: number
  currentTeamSalary: number
  projectedTeamSalary: number
  otherTeamSalary: number
  projectedOtherTeamSalary: number

  // selections
  selectedTeamForTrade: string | null
  setSelectedTeamForTrade: (v: string) => void
  selectedMyPlayers: string[]
  setSelectedMyPlayers: (ids: string[]) => void
  selectedOtherPlayers: string[]
  setSelectedOtherPlayers: (ids: string[]) => void
  selectedMyPicks: string[]
  setSelectedMyPicks: (ids: string[]) => void
  selectedOtherPicks: string[]
  setSelectedOtherPicks: (ids: string[]) => void

  // withholding
  capSpaceWithholding: Record<string, number>
  setCapSpaceWithholding: (s: Record<string, number>) => void
  getValidWithholdingAmounts: (playerSalary: number) => number[]

  // text + helpers
  tradeMessage: string
  setTradeMessage: (v: string) => void
  formatPick: (p: DraftPick) => string
  toggleFromArray: (arr: string[], id: string) => string[]
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string

  // actions/state
  isSubmittingTrade: boolean
  setIsSubmittingTrade: (v: boolean) => void
  tradeError: string | null
  setTradeError: (v: string | null) => void
  tradeSuccess: string | null
  setTradeSuccess: (v: string | null) => void
  handleTradeResponse: (proposalId: string, accept: boolean) => Promise<void>

  // proposals
  incomingTradeProposals: any[]
  outgoingTradeProposals: any[]
  isProcessingTradeResponse: boolean
  cancellingTrades: Set<string>
  setCancellingTrades: (s: Set<string>) => void

  // env/tools used in original inline handler
  supabase: any
  session: any
  fetchTradeProposals: (teamId: string, teamName: string) => Promise<void>
  toast: (args: ToastArgs) => void
}

export default function TradesTab({
  // data
  allTeams,
  teamData,
  teamPlayers,
  tcPlayers = [],
  selectedTeamPlayers,
  selectedTeamTcPlayers = [],
  myPicks,
  otherTeamPicks,

  // salary/cap
  currentSalaryCap,
  currentTeamSalary,
  projectedTeamSalary,
  otherTeamSalary,
  projectedOtherTeamSalary,

  // selections
  selectedTeamForTrade,
  setSelectedTeamForTrade,
  selectedMyPlayers,
  setSelectedMyPlayers,
  selectedOtherPlayers,
  setSelectedOtherPlayers,
  selectedMyPicks,
  setSelectedMyPicks,
  selectedOtherPicks,
  setSelectedOtherPicks,

  // withholding
  capSpaceWithholding,
  setCapSpaceWithholding,
  getValidWithholdingAmounts,

  // text + helpers
  tradeMessage,
  setTradeMessage,
  formatPick,
  toggleFromArray,
  getPositionAbbreviation,
  getPositionColor,

  // actions/state
  isSubmittingTrade,
  setIsSubmittingTrade,
  tradeError,
  setTradeError,
  tradeSuccess,
  setTradeSuccess,
  handleTradeResponse,

  // proposals
  incomingTradeProposals,
  outgoingTradeProposals,
  isProcessingTradeResponse,
  cancellingTrades,
  setCancellingTrades,

  // env/tools
  supabase,
  session,
  fetchTradeProposals,
  toast,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Center</CardTitle>
        <CardDescription>Propose trades with other teams and manage trade proposals</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="propose" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="propose">Propose Trade</TabsTrigger>
            <TabsTrigger value="incoming">
              Incoming Proposals
              {incomingTradeProposals.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {incomingTradeProposals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing Proposals</TabsTrigger>
          </TabsList>

          {/* PROPOSE (exact original UI / logic) */}
          <TabsContent value="propose">
            <div className="space-y-6">
              {/* Team Selection */}
              <div className="space-y-2">
                <Label htmlFor="tradeTeam">Select Team to Trade With</Label>
                <Select value={selectedTeamForTrade || ""} onValueChange={setSelectedTeamForTrade}>
                  <SelectTrigger id="tradeTeam">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeamForTrade && (
                <>
                  {/* Trade Message */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeMessage">Trade Message (Optional)</Label>
                    <Textarea
                      id="tradeMessage"
                      placeholder="Add a message to the other team..."
                      value={tradeMessage}
                      onChange={(e) => setTradeMessage(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Trade Players Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Team */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Your Players</h3>
                        <Badge variant="outline">
                          ${(currentTeamSalary / 1000000).toFixed(2)}M → $
                          {(projectedTeamSalary / 1000000).toFixed(2)}M
                        </Badge>
                      </div>
                      <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                        {/* Main Roster */}
                        {teamPlayers.map((player) => (
                          <div
                            key={player.id}
                            className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer ${
                              selectedMyPlayers.includes(player.id) ? "bg-primary/10" : ""
                            }`}
                            onClick={() => {
                              if (selectedMyPlayers.includes(player.id)) {
                                setSelectedMyPlayers(selectedMyPlayers.filter((id) => id !== player.id))
                                // Reset withholding when deselected
                                setCapSpaceWithholding((prev) => {
                                  const updated = { ...prev }
                                  delete updated[player.id]
                                  return updated
                                })
                              } else {
                                setSelectedMyPlayers([...selectedMyPlayers, player.id])
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                  {getPositionAbbreviation(
                                    player.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                  )}
                                </span>
                                {player.season_registrations?.[0]?.secondary_position && (
                                  <>
                                    {" / "}
                                    <span
                                      className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}
                                    >
                                      {getPositionAbbreviation(
                                        player.season_registrations?.[0]?.secondary_position,
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono">${(player.salary / 1000000).toFixed(2)}M</div>
                              {selectedMyPlayers.includes(player.id) && (
                                <Select
                                  value={String(capSpaceWithholding[player.id] || 0)}
                                  onValueChange={(value) => {
                                    setCapSpaceWithholding({
                                      ...capSpaceWithholding,
                                      [player.id]: Number(value),
                                    })
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs w-24">
                                    <SelectValue placeholder="Retain" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getValidWithholdingAmounts(player.salary).map((amount) => (
                                      <SelectItem key={amount} value={String(amount)}>
                                        Retain ${(amount / 1000000).toFixed(2)}M
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* TC Roster Section */}
                        {tcPlayers.length > 0 && (
                          <>
                            <div className="p-2 bg-amber-500/10 text-amber-500 font-medium text-sm text-center border-y border-amber-500/30">
                              TC Roster
                            </div>
                            {tcPlayers.map((player) => (
                              <div
                                key={player.id}
                                className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer bg-amber-500/5 ${
                                  selectedMyPlayers.includes(player.id) ? "bg-primary/10" : ""
                                }`}
                                onClick={() => {
                                  if (selectedMyPlayers.includes(player.id)) {
                                    setSelectedMyPlayers(selectedMyPlayers.filter((id) => id !== player.id))
                                    setCapSpaceWithholding((prev) => {
                                      const updated = { ...prev }
                                      delete updated[player.id]
                                      return updated
                                    })
                                  } else {
                                    setSelectedMyPlayers([...selectedMyPlayers, player.id])
                                  }
                                }}
                              >
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {player.users?.gamer_tag_id || "Unknown Player"}
                                    <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50 text-xs">TC</Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                      {getPositionAbbreviation(
                                        player.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                      )}
                                    </span>
                                    {player.season_registrations?.[0]?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span
                                          className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}
                                        >
                                          {getPositionAbbreviation(
                                            player.season_registrations?.[0]?.secondary_position,
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-muted-foreground">$0</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Other Team */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">
                          {allTeams.find((team) => team.id === selectedTeamForTrade)?.name || "Other Team"} Players
                        </h3>
                      </div>
                      <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                        {selectedTeamPlayers.map((player) => (
                          <div
                            key={player.id}
                            className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer ${
                              selectedOtherPlayers.includes(player.id) ? "bg-primary/10" : ""
                            }`}
                            onClick={() => {
                              if (selectedOtherPlayers.includes(player.id)) {
                                setSelectedOtherPlayers(selectedOtherPlayers.filter((id) => id !== player.id))
                                setCapSpaceWithholding((prev) => {
                                  const updated = { ...prev }
                                  delete updated[player.id]
                                  return updated
                                })
                              } else {
                                setSelectedOtherPlayers([...selectedOtherPlayers, player.id])
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                  {getPositionAbbreviation(
                                    player.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                  )}
                                </span>
                                {player.season_registrations?.[0]?.secondary_position && (
                                  <>
                                    {" / "}
                                    <span
                                      className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}
                                    >
                                      {getPositionAbbreviation(
                                        player.season_registrations?.[0]?.secondary_position,
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono">${(player.salary / 1000000).toFixed(2)}M</div>
                              {selectedOtherPlayers.includes(player.id) && (
                                <Select
                                  value={String(capSpaceWithholding[player.id] || 0)}
                                  onValueChange={(value) => {
                                    setCapSpaceWithholding({
                                      ...capSpaceWithholding,
                                      [player.id]: Number(value),
                                    })
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs w-24" onClick={(e) => e.stopPropagation()}>
                                    <SelectValue placeholder="Retain" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getValidWithholdingAmounts(player.salary).map((amount) => (
                                      <SelectItem key={amount} value={String(amount)}>
                                        Retain ${(amount / 1000000).toFixed(2)}M
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Other Team TC Roster Section */}
                        {selectedTeamTcPlayers.length > 0 && (
                          <>
                            <div className="p-2 bg-amber-500/10 text-amber-500 font-medium text-sm text-center border-y border-amber-500/30">
                              TC Roster
                            </div>
                            {selectedTeamTcPlayers.map((player) => (
                              <div
                                key={player.id}
                                className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer bg-amber-500/5 ${
                                  selectedOtherPlayers.includes(player.id) ? "bg-primary/10" : ""
                                }`}
                                onClick={() => {
                                  if (selectedOtherPlayers.includes(player.id)) {
                                    setSelectedOtherPlayers(selectedOtherPlayers.filter((id) => id !== player.id))
                                  } else {
                                    setSelectedOtherPlayers([...selectedOtherPlayers, player.id])
                                  }
                                }}
                              >
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {player.users?.gamer_tag_id || "Unknown Player"}
                                    <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50 text-xs">TC</Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                                      {getPositionAbbreviation(
                                        player.season_registrations?.[0]?.primary_position || "UNKNOWN",
                                      )}
                                    </span>
                                    {player.season_registrations?.[0]?.secondary_position && (
                                      <>
                                        {" / "}
                                        <span
                                          className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}
                                        >
                                          {getPositionAbbreviation(
                                            player.season_registrations?.[0]?.secondary_position,
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-muted-foreground">$0</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <Badge variant="outline">
                        ${(otherTeamSalary / 1000000).toFixed(2)}M → $
                        {(projectedOtherTeamSalary / 1000000).toFixed(2)}M
                      </Badge>
                    </div>
                  </div>

                  {/* Draft Pick Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* My Picks (sending) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">My Draft Picks (offer)</CardTitle>
                        <CardDescription>Select picks you're sending</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {myPicks.length === 0 && (
                          <div className="text-muted-foreground text-sm">No picks available.</div>
                        )}
                        {myPicks.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedMyPicks.includes(p.id)}
                              onChange={() => setSelectedMyPicks((prev) => toggleFromArray(prev, p.id))}
                            />
                            <span className="text-sm font-medium">{formatPick(p)}</span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Their Picks (request) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Their Draft Picks (request)</CardTitle>
                        <CardDescription>Select picks you're receiving</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {otherTeamPicks.length === 0 && (
                          <div className="text-muted-foreground text-sm">No picks available.</div>
                        )}
                        {otherTeamPicks.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedOtherPicks.includes(p.id)}
                              onChange={() => setSelectedOtherPicks((prev) => toggleFromArray(prev, p.id))}
                            />
                            <span className="text-sm font-medium">{formatPick(p)}</span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trade Validation */}
                  {(tradeError || tradeSuccess) && (
                    <div
                      className={`p-3 rounded-md ${
                        tradeError
                          ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                          : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      }`}
                    >
                      {tradeError || tradeSuccess}
                    </div>
                  )}

                  {/* Submit Trade Button (original inline logic preserved) */}
                  <Button
                    className="w-full"
                    disabled={
                      isSubmittingTrade ||
                      (selectedMyPlayers.length === 0 &&
                        selectedOtherPlayers.length === 0 &&
                        selectedMyPicks.length === 0 &&
                        selectedOtherPicks.length === 0) ||
                      projectedTeamSalary > currentSalaryCap ||
                      projectedOtherTeamSalary > currentSalaryCap
                    }
                    onClick={async () => {
                      try {
                        setIsSubmittingTrade(true)
                        setTradeError(null)
                        setTradeSuccess(null)

                        // Validate trade
                        if (
                          selectedMyPlayers.length === 0 &&
                          selectedOtherPlayers.length === 0 &&
                          selectedMyPicks.length === 0 &&
                          selectedOtherPicks.length === 0
                        ) {
                          setTradeError("Please select at least one player or pick to trade")
                          return
                        }

                        if (projectedTeamSalary > currentSalaryCap) {
                          setTradeError("This trade would put your team over the salary cap")
                          return
                        }

                        if (projectedOtherTeamSalary > currentSalaryCap) {
                          setTradeError("This trade would put the other team over the salary cap")
                          return
                        }

                        // Get player details for the trade (include TC players from both teams)
                        const myAllPlayers = [...teamPlayers, ...tcPlayers]
                        const otherAllPlayers = [...selectedTeamPlayers, ...selectedTeamTcPlayers]
                        const myPlayersToTrade = myAllPlayers.filter((p) => selectedMyPlayers.includes(p.id))
                        const otherPlayersToReceive = otherAllPlayers.filter((p) =>
                          selectedOtherPlayers.includes(p.id),
                        )

                        const fromPlayers = myPlayersToTrade.map((p) => ({
                          id: p.id,
                          name: p.users?.gamer_tag_id || "Unknown Player",
                          position: p.season_registrations?.[0]?.primary_position || "UNKNOWN",
                          salary: p.salary,
                          withholding: capSpaceWithholding[p.id] || 0,
                          is_tc: p.is_tc || false,
                        }))

                        const toPlayers = otherPlayersToReceive.map((p) => ({
                          id: p.id,
                          name: p.users?.gamer_tag_id || "Unknown Player",
                          position: p.season_registrations?.[0]?.primary_position || "UNKNOWN",
                          salary: p.salary,
                          withholding: capSpaceWithholding[p.id] || 0,
                          is_tc: p.is_tc || false,
                        }))

                        // Get other team's managers
                        const { data: otherTeamManagers } = await supabase
                          .from("players")
                          .select("user_id")
                          .eq("team_id", selectedTeamForTrade)
                          .in("role", ["GM", "AGM", "Owner"])

                        if (!otherTeamManagers || otherTeamManagers.length === 0) {
                          setTradeError("Could not find managers for the selected team")
                          return
                        }

                        // Get other team name
                        const otherTeam = allTeams.find((team) => team.id === selectedTeamForTrade)
                        if (!otherTeam) {
                          setTradeError("Could not find the selected team")
                          return
                        }

                        // ---- NEW: block duplicate offers with same players (pending trades) ----
                        const myTeamId = teamData?.id
                        const selectedIdsSet = new Set([...selectedMyPlayers, ...selectedOtherPlayers])

                        // fetch any pending trades that involve either team
                        const { data: pendingTrades, error: pendingErr } = await supabase
                          .from("trades")
                          .select("id, team1_id, team2_id, team1_players, team2_players, status")
                          .eq("status", "pending")
                          .or(
                            `team1_id.eq.${myTeamId},team2_id.eq.${myTeamId},team1_id.eq.${selectedTeamForTrade},team2_id.eq.${selectedTeamForTrade}`
                          )

                        if (pendingErr) {
                          throw pendingErr
                        }

                        const hasOverlap = (pendingTrades || []).some((t: any) => {
                          let t1: any[] = []
                          let t2: any[] = []
                          try {
                            t1 = JSON.parse(t.team1_players || "[]")
                          } catch {}
                          try {
                            t2 = JSON.parse(t.team2_players || "[]")
                          } catch {}
                          const ids = [...t1, ...t2].map((x: any) => x?.id).filter(Boolean)
                          return ids.some((id: string) => selectedIdsSet.has(id))
                        })

                        if (hasOverlap) {
                          setTradeError(
                            "One or more selected players are already part of a pending trade. Please modify your selection."
                          )
                          return
                        }
                        // -----------------------------------------------------------------------

                        // Create trade data object (we'll add tradeId after inserting pending row)
                        const tradeData: any = {
                          fromTeam: teamData?.name,
                          toTeam: otherTeam.name,
                          fromPlayers,
                          toPlayers,
                          fromPicks: selectedMyPicks.map((pickId) => myPicks.find((p) => p.id === pickId)),
                          toPicks: selectedOtherPicks.map((pickId) => otherTeamPicks.find((p) => p.id === pickId)),
                          message: tradeMessage,
                        }

                        // ---- NEW: create a pending row in trades and capture its id ----
                        const { data: pendingTrade, error: tradeInsertError } = await supabase
                          .from("trades")
                          .insert([
                            {
                              team1_id: myTeamId, // proposer
                              team2_id: selectedTeamForTrade, // recipient
                              team1_players: JSON.stringify(fromPlayers ?? []),
                              team2_players: JSON.stringify(toPlayers ?? []),
                              status: "pending",
                              // If you have JSONB pick columns:
                              // team1_picks: JSON.stringify(selectedMyPicks ?? []),
                              // team2_picks: JSON.stringify(selectedOtherPicks ?? []),
                            },
                          ])
                          .select("*")
                          .single()

                        if (tradeInsertError || !pendingTrade?.id) {
                          throw tradeInsertError || new Error("Failed to create pending trade")
                        }

                        tradeData.tradeId = pendingTrade.id
                        // -----------------------------------------------------------------------

                        // Send notifications to other team's managers (with tradeId now embedded)
                        const notifications = otherTeamManagers.map((manager: any) => ({
                          user_id: manager.user_id,
                          title: `Trade Proposal from ${teamData?.name}`,
                          message: `${teamData?.name} wants to trade ${
                            fromPlayers.map((p) => p.name).join(", ") || "players"
                          } and ${tradeData.fromPicks.filter(Boolean).length} pick(s) for ${
                            toPlayers.map((p) => p.name).join(", ") || "players"
                          } and ${
                            tradeData.toPicks.filter(Boolean).length
                          } pick(s). ${tradeMessage ? `Message: ${tradeMessage}` : ""}\n\nTRADE_DATA:${JSON.stringify(
                            tradeData
                          )}`,
                          link: "/management?tab=trades",
                          read: false,
                        }))

                        // Send notification to self for tracking (also embeds tradeId)
                        const selfNotification = {
                          user_id: session.user.id,
                          title: `Trade Proposal to ${otherTeam.name}`,
                          message: `You proposed to trade ${
                            fromPlayers.map((p) => p.name).join(", ") || "players"
                          } and ${tradeData.fromPicks.filter(Boolean).length} pick(s) for ${
                            toPlayers.map((p) => p.name).join(", ") || "players"
                          } and ${
                            tradeData.toPicks.filter(Boolean).length
                          } pick(s). Waiting for response.\n\nTRADE_DATA:${JSON.stringify(tradeData)}`,
                          link: "/management?tab=trades",
                          read: false,
                        }

                        // Insert all notifications
                        const { error: notificationError } = await supabase
                          .from("notifications")
                          .insert([...notifications, selfNotification])

                        if (notificationError) {
                          throw notificationError
                        }

                        setTradeSuccess("Trade proposal sent successfully!")

                        // Reset selections
                        setSelectedMyPlayers([])
                        setSelectedOtherPlayers([])
                        setSelectedMyPicks([])
                        setSelectedOtherPicks([])
                        setTradeMessage("")
                        setCapSpaceWithholding({})

                        // Refresh trade proposals
                        if (teamData?.id && teamData?.name) {
                          await fetchTradeProposals(teamData.id, teamData.name)
                        }

                        // Switch to outgoing tab
                        const tabsElement = document.querySelector('[data-value="outgoing"]') as HTMLElement | null
                        if (tabsElement) {
                          tabsElement.click()
                        }
                      } catch (error: any) {
                        console.error("Error submitting trade:", error)
                        setTradeError(`Failed to submit trade: ${error.message}`)
                      } finally {
                        setIsSubmittingTrade(false)
                      }
                    }}
                  >
                    {isSubmittingTrade ? "Submitting..." : "Propose Trade"}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          {/* INCOMING (original) */}
          <TabsContent value="incoming">
            <div className="space-y-4">
              {incomingTradeProposals.length > 0 ? (
                incomingTradeProposals.map((proposal) => {
                  // Extract trade data from message
                  let tradeData: any = null
                  try {
                    const tradeDataMatch = proposal.message.match(/TRADE_DATA:(.+)$/s)
                    if (tradeDataMatch) {
                      tradeData = JSON.parse(tradeDataMatch[1])
                    }
                  } catch (e) {
                    console.error("Failed to parse trade data:", e)
                  }

                  return (
                    <Card key={proposal.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Trade from {tradeData?.fromTeam || "Unknown Team"}</CardTitle>
                          <CardDescription>
                            {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                            {new Date(proposal.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                          {/* They Offer */}
                          <div className="md:col-span-3">
                            <h3 className="font-medium mb-2">They Offer:</h3>
                            {tradeData?.fromPlayers && tradeData.fromPlayers.length > 0 ? (
                              <ul className="space-y-2">
                                {tradeData.fromPlayers.map((player: any, index: number) => (
                                  <li key={index} className="flex justify-between items-center">
                                    <span>{player.name}</span>
                                    <div className="text-sm text-muted-foreground">
                                      <span>${(player.salary / 1000000).toFixed(2)}M</span>
                                      {player.withholding > 0 && (
                                        <span className="ml-1 text-orange-600">
                                          (Retain ${(player.withholding / 1000000).toFixed(2)}M)
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No players</p>
                            )}
                            {tradeData?.fromPicks && tradeData.fromPicks.length > 0 && (
                              <>
                                <h3 className="font-medium mb-2 mt-3">And Picks:</h3>
                                <ul className="space-y-2">
                                  {tradeData.fromPicks.filter(Boolean).map((pick: DraftPick, index: number) => (
                                    <li key={index} className="flex justify-between items-center">
                                      <span>
                                        {pick.season_number} R{pick.round}
                                      </span>
                                      <div className="text-sm text-muted-foreground">
                                        Original: {pick.original_team?.name || "Unknown"}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>

                          {/* Trade Arrow */}
                          <div className="md:col-span-1 flex justify-center">
                            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                          </div>

                          {/* They Want */}
                          <div className="md:col-span-3">
                            <h3 className="font-medium mb-2">They Want:</h3>
                            {tradeData?.toPlayers && tradeData.toPlayers.length > 0 ? (
                              <ul className="space-y-2">
                                {tradeData.toPlayers.map((player: any, index: number) => (
                                  <li key={index} className="flex justify-between items-center">
                                    <span>{player.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ${(player.salary / 1000000).toFixed(2)}M
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No players</p>
                            )}
                            {tradeData?.toPicks && tradeData.toPicks.length > 0 && (
                              <>
                                <h3 className="font-medium mb-2 mt-3">And Picks:</h3>
                                <ul className="space-y-2">
                                  {tradeData.toPicks.filter(Boolean).map((pick: DraftPick, index: number) => (
                                    <li key={index} className="flex justify-between items-center">
                                      <span>
                                        {pick.season_number} R{pick.round}
                                      </span>
                                      <div className="text-sm text-muted-foreground">
                                        Original: {pick.original_team?.name || "Unknown"}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        </div>

                        {tradeData?.message && (
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <h4 className="font-medium mb-1">Message:</h4>
                            <p className="text-sm">{tradeData.message}</p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleTradeResponse(proposal.id, true)}
                            disabled={isProcessingTradeResponse}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept Trade
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleTradeResponse(proposal.id, false)}
                            disabled={isProcessingTradeResponse}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Trade
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">No incoming trade proposals</div>
              )}
            </div>
          </TabsContent>

          {/* OUTGOING (original) */}
          <TabsContent value="outgoing">
            <div className="space-y-4">
              {outgoingTradeProposals.length > 0 ? (
                outgoingTradeProposals.map((proposal) => {
                  // Extract trade data from message
                  let tradeData: any = null
                  try {
                    const tradeDataMatch = proposal.message.match(/TRADE_DATA:(.+)$/s)
                    if (tradeDataMatch) {
                      tradeData = JSON.parse(tradeDataMatch[1])
                    }
                  } catch (e) {
                    console.error("Failed to parse trade data:", e)
                  }

                  const isCancelling = cancellingTrades.has(proposal.id)

                  return (
                    <Card key={proposal.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Trade to {tradeData?.toTeam || "Unknown Team"}</CardTitle>
                          <CardDescription>
                            {new Date(proposal.created_at).toLocaleDateString()} at{" "}
                            {new Date(proposal.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                          {/* You Offer */}
                          <div className="md:col-span-3">
                            <h3 className="font-medium mb-2">You Offer:</h3>
                            {tradeData?.fromPlayers && tradeData.fromPlayers.length > 0 ? (
                              <ul className="space-y-2">
                                {tradeData.fromPlayers.map((player: any, index: number) => (
                                  <li key={index} className="flex justify-between items-center">
                                    <span>{player.name}</span>
                                    <div className="text-sm text-muted-foreground">
                                      <span>${(player.salary / 1000000).toFixed(2)}M</span>
                                      {player.withholding > 0 && (
                                        <span className="ml-1 text-orange-600">
                                          (Retain ${(player.withholding / 1000000).toFixed(2)}M)
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No players</p>
                            )}
                            {tradeData?.fromPicks && tradeData.fromPicks.length > 0 && (
                              <>
                                <h3 className="font-medium mb-2 mt-3">And Picks:</h3>
                                <ul className="space-y-2">
                                  {tradeData.fromPicks.filter(Boolean).map((pick: DraftPick, index: number) => (
                                    <li key={index} className="flex justify-between items-center">
                                      <span>
                                        {pick.season_number} R{pick.round}
                                      </span>
                                      <div className="text-sm text-muted-foreground">
                                        Original: {pick.original_team?.name || "Unknown"}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>

                          {/* Trade Arrow */}
                          <div className="md:col-span-1 flex justify-center">
                            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                          </div>

                          {/* You Want */}
                          <div className="md:col-span-3">
                            <h3 className="font-medium mb-2">You Want:</h3>
                            {tradeData?.toPlayers && tradeData.toPlayers.length > 0 ? (
                              <ul className="space-y-2">
                                {tradeData.toPlayers.map((player: any, index: number) => (
                                  <li key={index} className="flex justify-between items-center">
                                    <span>{player.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ${(player.salary / 1000000).toFixed(2)}M
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No players</p>
                            )}
                            {tradeData?.toPicks && tradeData.toPicks.length > 0 && (
                              <>
                                <h3 className="font-medium mb-2 mt-3">And Picks:</h3>
                                <ul className="space-y-2">
                                  {tradeData.toPicks.filter(Boolean).map((pick: DraftPick, index: number) => (
                                    <li key={index} className="flex justify-between items-center">
                                      <span>
                                        {pick.season_number} R{pick.round}
                                      </span>
                                      <div className="text-sm text-muted-foreground">
                                        Original: {pick.original_team?.name || "Unknown"}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              try {
                                setCancellingTrades((prev) => new Set(prev).add(proposal.id))

                                // Extract trade data to find the trade id & other team
                                const otherTeamName = tradeData?.toTeam
                                const tradeId: string | undefined = tradeData?.tradeId
                                if (!otherTeamName) {
                                  throw new Error("Could not determine other team")
                                }

                                // Find the other team's ID
                                const otherTeam = allTeams.find((team) => team.name === otherTeamName)
                                if (!otherTeam) {
                                  throw new Error("Could not find other team")
                                }

                                // Get other team's managers
                                const { data: otherTeamManagers, error: managersError } = await supabase
                                  .from("players")
                                  .select("user_id")
                                  .eq("team_id", otherTeam.id)
                                  .in("role", ["GM", "AGM", "Owner"])

                                if (managersError) {
                                  console.error("Error fetching other team managers:", managersError)
                                  throw managersError
                                }

                                // ---- NEW: cancel the actual trade row if we have an id ----
                                if (tradeId) {
                                  const { error: tradeCancelErr } = await supabase
                                    .from("trades")
                                    .update({ status: "cancelled" })
                                    .eq("id", tradeId)
                                  if (tradeCancelErr) {
                                    console.error("Error cancelling trade row:", tradeCancelErr)
                                  }
                                }
                                // -----------------------------------------------------------

                                // Mark the outgoing notification as cancelled (existing)
                                const { error: updateError } = await supabase
                                  .from("notifications")
                                  .update({
                                    message: proposal.message + "\n\nSTATUS: CANCELLED",
                                  })
                                  .eq("id", proposal.id)

                                if (updateError) {
                                  console.error("Error updating outgoing notification:", updateError)
                                  throw updateError
                                }

                                // Update corresponding incoming notifications for the other team (existing best-effort)
                                if (otherTeamManagers && otherTeamManagers.length > 0) {
                                  const { error: incomingUpdateError } = await supabase
                                    .from("notifications")
                                    .update({
                                      message: supabase.raw(`message || '\n\nSTATUS: CANCELLED'`),
                                    })
                                    .in(
                                      "user_id",
                                      otherTeamManagers.map((m: any) => m.user_id),
                                    )
                                    .like("title", `Trade Proposal from ${teamData?.name}`)
                                  if (incomingUpdateError) {
                                    console.error("Error updating incoming notifications:", incomingUpdateError)
                                  }

                                  // ---- NEW: hard-delete their incoming notifications for this tradeId so it disappears ----
                                  if (tradeId) {
                                    // Match the embedded JSON key/value for tradeId in the message payload
                                    const pattern = `%\\"tradeId\\":\\"${tradeId}\\"%`
                                    const { error: deleteIncomingErr } = await supabase
                                      .from("notifications")
                                      .delete()
                                      .in(
                                        "user_id",
                                        otherTeamManagers.map((m: any) => m.user_id),
                                      )
                                      .like("message", pattern)
                                      .like("title", `Trade Proposal from ${teamData?.name}`)
                                    if (deleteIncomingErr) {
                                      console.error("Error deleting incoming notifications for trade:", deleteIncomingErr)
                                    }
                                  }
                                  // --------------------------------------------------------------------------------------------
                                }

                                toast({
                                  title: "Trade Cancelled",
                                  description: "Your trade proposal has been cancelled.",
                                })

                                // Refresh trade proposals
                                if (teamData?.id && teamData?.name) {
                                  await fetchTradeProposals(teamData.id, teamData.name)
                                }
                              } catch (error: any) {
                                console.error("Error cancelling trade:", error)
                                toast({
                                  title: "Error",
                                  description: "Failed to cancel trade: " + error.message,
                                  variant: "destructive",
                                })
                              } finally {
                                setCancellingTrades((prev) => {
                                  const newSet = new Set(prev)
                                  newSet.delete(proposal.id)
                                  return newSet
                                })
                              }
                            }}
                            disabled={isCancelling}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {isCancelling ? "Cancelling..." : "Cancel Trade"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">No outgoing trade proposals</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
