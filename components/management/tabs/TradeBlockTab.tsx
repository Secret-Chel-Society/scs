"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, Users, ShieldCheck, Tag } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  id: string
  user_id: string
  role: string
  salary?: number
  is_tc?: boolean
  user: {
    id: string
    gamer_tag_id?: string
    email?: string
  }
  season_registration?: {
    position?: string
    role?: string
  }
}

interface TradeBlockEntry {
  id: string
  player_id: string
  team_id: string
  league: string
  is_tc: boolean
  looking_for: string | null
  created_at: string
  player: {
    id: string
    user_id: string
    role: string
    salary?: number
    user: {
      id: string
      gamer_tag_id?: string
      email?: string
    }
  }
  team: {
    id: string
    name: string
    logo_url?: string
  }
  position?: string
}

interface Props {
  teamData: any
  teamPlayers: Player[]
  tcPlayers: Player[]
  session: any
  league: "nhl" | "ecl"
  viewerRole?: string | null
  supabase?: any
}

// ─── Position helper ─────────────────────────────────────────────────────────

const POSITIONS = ["C", "LW", "RW", "LD", "RD", "G", "F", "D"]

function getPositionColor(pos: string) {
  switch (pos?.toUpperCase()) {
    case "C": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "LW": case "RW": return "bg-green-500/20 text-green-400 border-green-500/30"
    case "LD": case "RD": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "G": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

function getPlayerDisplay(p: any) {
  // Management pages store the joined user table as either `user` or `users`
  const u = p?.user ?? p?.users
  return u?.gamer_tag_id || u?.email?.split("@")[0] || p?.gamer_tag_id || "Unknown"
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TradeBlockTab({
  teamData,
  teamPlayers,
  tcPlayers,
  session,
  league,
  viewerRole,
  supabase: supabaseProp,
}: Props) {
  const { supabase: supabaseHook } = useSupabase()
  const supabase = supabaseProp ?? supabaseHook

  // All trade block entries across ALL teams (visible to everyone)
  const [allEntries, setAllEntries] = useState<TradeBlockEntry[]>([])
  // My team's entries on the block
  const [myEntries, setMyEntries] = useState<TradeBlockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [lookingFor, setLookingFor] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // Determine the correct team column based on league
  const teamCol = league === "ecl" ? "team_id_ecl" : "team_id"
  const tcCol = league === "ecl" ? "tc_team_id_ecl" : "tc_team_id"
  const teamsTable = league === "ecl" ? "teams_ecl" : "teams"

  // ── Fetch all trade block entries ────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Get all trade block entries for this league with player + team info
      const { data, error: fetchErr } = await supabase
        .from("trade_block")
        .select(`
          id,
          player_id,
          team_id,
          league,
          is_tc,
          looking_for,
          created_at,
          player:players!trade_block_player_id_fkey(
            id,
            user_id,
            role,
            salary,
            user:users(id, gamer_tag_id, email)
          )
        `)
        .eq("league", league)
        .order("created_at", { ascending: false })

      if (fetchErr) throw fetchErr

      // Fetch team names separately since team_id could be from either table
      const teamIds = [...new Set((data || []).map((e: any) => e.team_id))]
      let teamMap: Record<string, any> = {}
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from(teamsTable)
          .select("id, name, logo_url")
          .in("id", teamIds)
        ;(teamsData || []).forEach((t: any) => { teamMap[t.id] = t })
      }

      // Fetch positions from season_registrations for each player
      const userIds = [...new Set((data || []).map((e: any) => e.player?.user_id).filter(Boolean))]
      let posMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: regData } = await supabase
          .from("season_registrations")
          .select("user_id, primary_position, position")
          .in("user_id", userIds)
        ;(regData || []).forEach((r: any) => { posMap[r.user_id] = r.primary_position || r.position })
      }

      const enriched: TradeBlockEntry[] = (data || []).map((e: any) => ({
        ...e,
        team: teamMap[e.team_id] || { id: e.team_id, name: "Unknown Team" },
        position: posMap[e.player?.user_id] || "",
      }))

      setAllEntries(enriched)
      setMyEntries(
        teamData?.id
          ? enriched.filter((e) => e.team_id === teamData.id)
          : []
      )
    } catch (err: any) {
      setError(err.message || "Failed to load trade block")
    } finally {
      setLoading(false)
    }
  }, [supabase, league, teamData?.id, teamsTable])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // ── Combined roster + TC pool for the "Add" dialog ───────────────────────
  const eligiblePlayers = [
    ...teamPlayers.map((p) => ({ ...p, _isTc: false })),
    ...tcPlayers.map((p) => ({ ...p, _isTc: true })),
  ].filter((p) => {
    // Exclude players already on the block
    return !myEntries.some((e) => e.player_id === p.id)
  })

  // ── Add to trade block ───────────────────────────────────────────────────
  async function handleAdd() {
    if (!selectedPlayerId || !teamData?.id) return
    setSubmitting(true)
    try {
      const player = eligiblePlayers.find((p) => p.id === selectedPlayerId)
      const isTc = (player as any)?._isTc ?? false

      const { error: insertErr } = await supabase
        .from("trade_block")
        .insert({
          player_id: selectedPlayerId,
          team_id: teamData.id,
          league,
          is_tc: isTc,
          looking_for: lookingFor.trim() || null,
        })

      if (insertErr) {
        if (insertErr.code === "23505") {
          // Duplicate — silently ignore, just refresh
        } else {
          throw insertErr
        }
      } else {
        // Notify all Owner/GM/AGM users on the site
        const playerName = getPlayerDisplay(player as Player)
        const teamName = teamData.name || "A team"
        const notifMessage = `${teamName} placed ${playerName} on the Trade Block${lookingFor.trim() ? ` (Looking for: ${lookingFor.trim()})` : ""}`

        // Fetch all Owner/GM/AGM player user_ids across the site
        const mgmtRoles = league === "ecl"
          ? ["ECL Owner", "ECL GM", "ECL AGM", "Owner", "GM", "AGM"]
          : ["Owner", "GM", "AGM"]

        const { data: mgmtPlayers } = await supabase
          .from("players")
          .select("user_id")
          .in("role", mgmtRoles)
          .neq("user_id", session?.user?.id ?? "")

        if (mgmtPlayers && mgmtPlayers.length > 0) {
          const notifications = mgmtPlayers.map((mp: any) => ({
            user_id: mp.user_id,
            message: notifMessage,
            type: "trade_block",
            read: false,
          }))
          // Insert in batches of 50 to avoid payload limits
          for (let i = 0; i < notifications.length; i += 50) {
            await supabase.from("notifications").insert(notifications.slice(i, i + 50))
          }
        }
      }

      setAddOpen(false)
      setSelectedPlayerId("")
      setLookingFor("")
      await fetchEntries()
    } catch (err: any) {
      setError(err.message || "Failed to add player to trade block")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Remove from trade block ──────────────────────────────────────────────
  async function handleRemove(entryId: string) {
    setRemoving(entryId)
    try {
      const { error: delErr } = await supabase
        .from("trade_block")
        .delete()
        .eq("id", entryId)
      if (delErr) throw delErr
      await fetchEntries()
    } catch (err: any) {
      setError(err.message || "Failed to remove from trade block")
    } finally {
      setRemoving(null)
    }
  }

  const canManage =
    viewerRole &&
    ["Site Owner", "Owner", "GM", "AGM", "ECL Owner", "ECL GM", "ECL AGM"].includes(viewerRole)

  // ── Group all entries by team ─────────────────────────────────────────────
  const byTeam = allEntries.reduce<Record<string, TradeBlockEntry[]>>((acc, e) => {
    const key = e.team.id
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  // Put own team first
  const teamOrder = Object.keys(byTeam).sort((a) =>
    a === teamData?.id ? -1 : 1
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trade Block</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Players available for trade — visible to all team managers
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Put on Block
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* My team's entries (quick management strip) */}
      {canManage && myEntries.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Your Team&apos;s Block
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {e.position && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 shrink-0 ${getPositionColor(e.position)}`}
                    >
                      {e.position}
                    </Badge>
                  )}
                  <span className="font-medium text-sm truncate">
                    {getPlayerDisplay(e.player as any)}
                  </span>
                  {e.is_tc && (
                    <Badge variant="outline" className="text-[10px] px-1 shrink-0 text-yellow-400 border-yellow-500/30">
                      TC
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.looking_for && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {e.looking_for}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    disabled={removing === e.id}
                    onClick={() => handleRemove(e.id)}
                  >
                    {removing === e.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All teams on the block */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : teamOrder.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No players are currently on the trade block.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teamOrder.map((tid) => {
            const entries = byTeam[tid]
            const teamInfo = entries[0].team
            const isMyTeam = tid === teamData?.id
            return (
              <Card
                key={tid}
                className={isMyTeam ? "border-primary/30 bg-primary/5" : ""}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {teamInfo.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={teamInfo.logo_url}
                        alt={teamInfo.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    )}
                    <span>{teamInfo.name}</span>
                    {isMyTeam && (
                      <Badge variant="outline" className="text-[10px] px-1.5 ml-auto text-primary border-primary/40">
                        My Team
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entries.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-md border bg-muted/20 px-3 py-2.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {e.position && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 shrink-0 ${getPositionColor(e.position)}`}
                          >
                            {e.position}
                          </Badge>
                        )}
                        <span className="font-medium text-sm">
                          {getPlayerDisplay(e.player as any)}
                        </span>
                        {e.is_tc && (
                          <Badge variant="outline" className="text-[10px] px-1 text-yellow-400 border-yellow-500/30">
                            TC
                          </Badge>
                        )}
                        {e.player?.salary != null && (
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            ${e.player.salary.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {e.looking_for && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-0.5">
                          <Tag className="h-3 w-3 shrink-0" />
                          <span>Looking for: {e.looking_for}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add to Trade Block dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Put Player on Trade Block</DialogTitle>
            <DialogDescription>
              Select a roster or TC player to make available for trade. All managers will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player..." />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePlayers.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No eligible players
                    </SelectItem>
                  ) : (
                    eligiblePlayers.map((p) => {
                      const pos = (p as any).primary_position || (p as any).position || ""
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {pos ? `[${pos}] ` : ""}{getPlayerDisplay(p)}
                          {(p as any)._isTc ? " (TC)" : ""}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Looking For (optional)</Label>
              <Textarea
                placeholder="e.g. RW, LW, LD... describe what you're looking for"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {lookingFor.length}/300
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedPlayerId || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
