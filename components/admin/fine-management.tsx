"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign, Trash2, Loader2, Gavel } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSupabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Fine {
  id: string
  team_id: string
  season_id: string
  fine_amount: number
  reason: string
  reason_code: string
  notes: string | null
  created_at: string
  team: {
    id: string
    name: string
    abbreviation: string
    logo_url: string | null
  }
  issuer: {
    id: string
    gamer_tag_id: string
  } | null
}

interface Team {
  id: string
  name: string
  abbreviation: string
  logo_url: string | null
}

const FINE_REASONS = {
  stats_failure: { label: "Failure to Update Stats", amount: 250000 },
  transaction_leak: { label: "Illegal Transaction Leak", amount: 2000000 },
  player_tampering: { label: "Player Tampering", amount: 2000000 },
  forfeit: { label: "Forfeit (FF)", amount: 250000 },
  rule_violation: { label: "Rule Violation (Custom)", amount: 0 },
  other: { label: "Other (Custom)", amount: 0 },
}

const MAX_FINES_PER_SEASON = 3000000

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

function FineManagementPanel({ league, title }: { league: "nhl" | "ahl"; title: string }) {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [fines, setFines] = useState<Fine[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentSeason, setCurrentSeason] = useState("")
  const { toast } = useToast()

  // Form state
  const [selectedTeam, setSelectedTeam] = useState("")
  const [reasonCode, setReasonCode] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [league])

  async function fetchData() {
    setIsLoading(true)
    try {
      // Fetch current season from system settings
      const settingsTable = league === "ahl" ? "system_settings_ahl" : "system_settings"
      const { data: seasonSetting } = await supabase
        .from(settingsTable)
        .select("value")
        .eq("key", "current_season")
        .single()
      
      const season = seasonSetting?.value?.replace(/"/g, "") || (league === "ahl" ? "AHL Season 1" : "Season 12")
      setCurrentSeason(season)

      // Fetch active teams for the current season from team_seasons/team_seasons_ahl
      const teamSeasonsTable = league === "ahl" ? "team_seasons_ahl" : "team_seasons"
      const teamsTable = league === "ahl" ? "teams_ahl" : "teams"
      
      // Get team_ids that are active in the current season
      const { data: activeTeamSeasons } = await supabase
        .from(teamSeasonsTable)
        .select("team_id")
        .eq("season_id", season)
        .eq("is_active", true)
      
      const activeTeamIds = activeTeamSeasons?.map(ts => ts.team_id).filter(Boolean) || []
      
      // Fetch teams that are active
      if (activeTeamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from(teamsTable)
          .select("id, name, logo_url")
          .in("id", activeTeamIds)
          .order("name")
        
        setTeams(teamsData || [])
      } else {
        setTeams([])
      }

      // Fetch fines
      const response = await fetch(`/api/admin/fines?league=${league}&seasonId=${season}`)
      if (response.ok) {
        const data = await response.json()
        setFines(data.fines || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function getTeamTotalFines(teamId: string) {
    return fines
      .filter((f) => f.team_id === teamId)
      .reduce((sum, f) => sum + f.fine_amount, 0)
  }

  function getFineAmount() {
    if (reasonCode && FINE_REASONS[reasonCode as keyof typeof FINE_REASONS]) {
      const baseAmount = FINE_REASONS[reasonCode as keyof typeof FINE_REASONS].amount
      if (baseAmount === 0) {
        return parseInt(customAmount) || 0
      }
      return baseAmount
    }
    return 0
  }

  async function handleIssueFine() {
    if (!selectedTeam || !reasonCode) {
      toast({
        title: "Error",
        description: "Please select a team and reason",
        variant: "destructive",
      })
      return
    }

    const amount = getFineAmount()
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid fine amount",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam,
          seasonId: currentSeason,
          fineAmount: amount,
          reason: FINE_REASONS[reasonCode as keyof typeof FINE_REASONS].label,
          reasonCode,
          notes: notes || null,
          league,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to issue fine")
      }

      toast({
        title: "Fine Issued",
        description: data.draftPickForfeited
          ? `Fine issued. Draft pick forfeited due to exceeding $3M cap.`
          : `Fine of ${formatCurrency(amount)} has been issued.`,
      })

      // Reset form
      setSelectedTeam("")
      setReasonCode("")
      setCustomAmount("")
      setNotes("")
      setIsDialogOpen(false)

      // Refresh data
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteFine(fineId: string) {
    try {
      const response = await fetch("/api/admin/fines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fineId,
          league,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete fine")
      }

      toast({
        title: "Fine Removed",
        description: "The fine has been removed.",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Group fines by team
  const finesByTeam = teams.map((team) => ({
    team,
    fines: fines.filter((f) => f.team_id === team.id),
    totalFines: getTeamTotalFines(team.id),
  })).filter((t) => t.fines.length > 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {title} Fine System
            </CardTitle>
            <CardDescription>
              Season: {currentSeason} | Max fines per season: {formatCurrency(MAX_FINES_PER_SEASON)}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Issue Fine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Issue Team Fine</DialogTitle>
                <DialogDescription>
                  Issue a fine to a team. Fines are deducted from the team&apos;s salary cap.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={reasonCode} onValueChange={setReasonCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FINE_REASONS).map(([code, { label, amount }]) => (
                        <SelectItem key={code} value={code}>
                          {label} {amount > 0 && `(${formatCurrency(amount)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(reasonCode === "rule_violation" || reasonCode === "other") && (
                  <div className="space-y-2">
                    <Label>Custom Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="Enter fine amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Additional details about the fine..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {selectedTeam && (
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current team fines:</span>
                      <span>{formatCurrency(getTeamTotalFines(selectedTeam))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>This fine:</span>
                      <span>{formatCurrency(getFineAmount())}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1 mt-1">
                      <span>New total:</span>
                      <span className={getTeamTotalFines(selectedTeam) + getFineAmount() > MAX_FINES_PER_SEASON ? "text-destructive" : ""}>
                        {formatCurrency(getTeamTotalFines(selectedTeam) + getFineAmount())}
                      </span>
                    </div>
                    {getTeamTotalFines(selectedTeam) + getFineAmount() > MAX_FINES_PER_SEASON && (
                      <div className="flex items-center gap-2 text-destructive text-sm mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Exceeds $3M cap - draft pick will be forfeited</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueFine} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Issue Fine
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {finesByTeam.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fines issued this season.</p>
          ) : (
            <div className="space-y-6">
              {finesByTeam.map(({ team, fines: teamFines, totalFines }) => (
                <div key={team.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {team.logo_url && (
                        <img src={team.logo_url} alt={team.name} className="h-8 w-8 object-contain" />
                      )}
                      <div>
                        <span className="font-medium">{team.name}</span>
                        <span className="text-muted-foreground ml-2">({team.abbreviation})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={totalFines > MAX_FINES_PER_SEASON ? "destructive" : "secondary"}>
                        Total: {formatCurrency(totalFines)}
                      </Badge>
                      {totalFines > MAX_FINES_PER_SEASON && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Over Cap
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Issued By</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamFines.map((fine) => (
                        <TableRow key={fine.id}>
                          <TableCell className="text-sm">
                            {new Date(fine.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{fine.reason}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(fine.fine_amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fine.issuer?.gamer_tag_id || "System"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {fine.notes || "-"}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Fine?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the {formatCurrency(fine.fine_amount)} fine from {team.name}.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteFine(fine.id)}>
                                    Remove Fine
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fine Schedule Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fine Schedule Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>Failure to Update Stats</span>
              <span className="font-medium">{formatCurrency(250000)} per occurrence</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Illegal Transaction Leak / Player Tampering</span>
              <span className="font-medium">{formatCurrency(2000000)} + trade reversal</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Forfeit (FF)</span>
              <span className="font-medium">{formatCurrency(250000)} per occurrence</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Other Rule Violations</span>
              <span className="font-medium">League discretion</span>
            </div>
            <div className="flex justify-between py-2 text-destructive">
              <span>Season Fine Cap</span>
              <span className="font-medium">{formatCurrency(MAX_FINES_PER_SEASON)} (draft picks forfeited if exceeded)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FineManagement() {
  return (
    <Tabs defaultValue="nhl" className="space-y-6">
      <TabsList>
        <TabsTrigger value="nhl">NHL Fines</TabsTrigger>
        <TabsTrigger value="ahl">AHL Fines</TabsTrigger>
      </TabsList>

      <TabsContent value="nhl">
        <FineManagementPanel league="nhl" title="MGHL" />
      </TabsContent>

      <TabsContent value="ahl">
        <FineManagementPanel league="ahl" title="MGAHL" />
      </TabsContent>
    </Tabs>
  )
}
