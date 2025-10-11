"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Save, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { toast } from "sonner"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

// tiny helper to ensure an integer or null
const toInt = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

interface ManualStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any
  league?: "NHL" | "AHL"
  onSave: () => void
}

interface SkaterStat {
  player_id: string | null
  player_name: string
  team_id: string
  position: string
  goals: number
  assists: number
  plus_minus: number
  time_with_puck: number
  shots: number
  blocks: number
  giveaways: number
  takeaways: number
  interceptions: number
  faceoffs_won: number
  faceoff_pct: number
  pass_complete: number
  pass_attempts: number
  penalties_drawn: number
  ppg: number
  pim: number
  toi: string
}

interface GoalieStat {
  player_id: string | null
  player_name: string
  team_id: string
  toi: string
  save_pct: number
  goals_against: number
  saves: number
}

type UserRow = { id: string; gamer_tag_id?: string | null; username?: string | null }

function PlayerCombobox({
  users,
  value,
  onChange,
  disabled = false,
  placeholder = "Select player",
}: {
  users: UserRow[]
  value?: string | null
  onChange: (id: string, label: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = users.find((u) => u.id === value)
  const label = selected?.gamer_tag_id || selected?.username || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search players…" />
          <CommandList>
            <CommandEmpty>No players found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => {
                const lab = u.gamer_tag_id || u.username || "Unknown"
                return (
                  <CommandItem
                    key={u.id}
                    value={`${lab} ${u.id}`}
                    onSelect={() => {
                      onChange(u.id, lab)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === u.id ? "opacity-100" : "opacity-0")} />
                    {lab}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ManualStatsModal({ open, onOpenChange, match, league = "NHL", onSave }: ManualStatsModalProps) {
  const { supabase } = useSupabase()
  const [users, setUsers] = useState<UserRow[]>([])
  const [skaterStats, setSkaterStats] = useState<SkaterStat[]>([])
  const [goalieStats, setGoalieStats] = useState<GoalieStat[]>([])
  const [saving, setSaving] = useState(false)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null) // <- use season_number

  useEffect(() => {
    if (open) {
      fetchUsers()
      fetchSeasonNumber()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, league])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id, gamer_tag_id, username").order("gamer_tag_id")
      if (error) throw error
      setUsers((data as UserRow[]) || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    }
  }

  // Pull numeric season_number from public.seasons (preferred), with fallbacks
  const fetchSeasonNumber = async () => {
    try {
      // unified seasons table — ask specifically for season_number
      const { data: s1 } = await supabase
        .from("seasons")
        .select("season_number, is_current, league")
        .eq("is_current", true)
        .eq("league", league)
        .maybeSingle()

      const unifiedNum = toInt(s1?.season_number)
      if (unifiedNum !== null) {
        setSeasonNumber(unifiedNum)
        return
      }

      // fallback to league-specific tables (if they expose season_number)
      const table = league === "AHL" ? "seasons_ahl" : "seasons_nhl"
      // @ts-expect-error dynamic table
      const { data: s2 } = await (supabase as any)
        .from(table)
        .select("season_number, is_current")
        .eq("is_current", true)
        .maybeSingle()

      const leagueNum = toInt(s2?.season_number)
      if (leagueNum !== null) {
        setSeasonNumber(leagueNum)
        return
      }

      // last resort: use match.season_id if numeric, else 1
      setSeasonNumber(toInt(match.season_id) ?? 1)
    } catch {
      setSeasonNumber(toInt(match.season_id) ?? 1)
    }
  }

  const addSkaterStat = () => {
    setSkaterStats((prev) => [
      ...prev,
      {
        player_id: null,
        player_name: "",
        team_id: match.home_team_id,
        position: "C",
        goals: 0,
        assists: 0,
        plus_minus: 0,
        time_with_puck: 0,
        shots: 0,
        blocks: 0,
        giveaways: 0,
        takeaways: 0,
        interceptions: 0,
        faceoffs_won: 0,
        faceoff_pct: 0,
        pass_complete: 0,
        pass_attempts: 0,
        penalties_drawn: 0,
        ppg: 0,
        pim: 0,
        toi: "0:00",
      },
    ])
  }

  const addGoalieStat = () => {
    setGoalieStats((prev) => [
      ...prev,
      {
        player_id: null,
        player_name: "",
        team_id: match.home_team_id,
        toi: "60:00",
        save_pct: 0,
        goals_against: 0,
        saves: 0,
      },
    ])
  }

  const removeSkaterStat = (index: number) => setSkaterStats((prev) => prev.filter((_, i) => i !== index))
  const removeGoalieStat = (index: number) => setGoalieStats((prev) => prev.filter((_, i) => i !== index))

  const updateSkaterStat = (index: number, field: keyof SkaterStat, value: any) => {
    setSkaterStats((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const updateGoalieStat = (index: number, field: keyof GoalieStat, value: any) => {
    setGoalieStats((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === "goals_against" || field === "saves") {
        const totalShots = (updated[index].saves || 0) + (updated[index].goals_against || 0)
        updated[index].save_pct = totalShots > 0 ? updated[index].saves / totalShots : 0
      }
      return updated
    })
  }

  // Delete+insert for rows with no player_id to avoid duplicates by (match_id, team_id, player_name)
  const deleteThenInsert = async (table: string, rows: any[]) => {
    for (const r of rows) {
      const del = await supabase
        .from(table)
        .delete()
        .eq("match_id", r.match_id)
        .eq("team_id", r.team_id)
        .eq("player_name", r.player_name)
      if (del.error) throw del.error

      const ins = await supabase.from(table).insert(r)
      if (ins.error) throw ins.error
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const playerStatsTable = league === "AHL" ? "ea_player_stats_ahl" : "ea_player_stats"
      const eaMatchId: string = match.ea_match_id || match.ea_game_id || `manual-${match.id}-${Date.now()}`
      const season_id = toInt(seasonNumber) ?? toInt(match.season_id) ?? 1 // ensure integer

      // SKATERS
      const skaterRows = skaterStats
        .filter((s) => (s.player_name || "").trim().length > 0)
        .map((s) => {
          const pct = Number.isFinite(Number(s.faceoff_pct)) ? Number(s.faceoff_pct) : 0
          const fow = toInt(s.faceoffs_won) ?? 0
          const faceoffsTaken = pct > 0 ? Math.round(fow / (pct / 100)) : 0
          return {
            match_id: match.id,
            ea_match_id: eaMatchId,
            season_id,
            player_name: s.player_name.trim(),
            player_id: s.player_id ? String(s.player_id) : null, // TEXT in schema
            team_id: s.team_id,
            position: s.position,
            goals: toInt(s.goals) ?? 0,
            assists: toInt(s.assists) ?? 0,
            plus_minus: toInt(s.plus_minus) ?? 0,
            time_with_puck: toInt(s.time_with_puck) ?? 0,
            shots: toInt(s.shots) ?? 0,
            blocks: toInt(s.blocks) ?? 0,
            giveaways: toInt(s.giveaways) ?? 0,
            takeaways: toInt(s.takeaways) ?? 0,
            interceptions: toInt(s.interceptions) ?? 0,
            faceoffs_won: fow,
            faceoffs_taken: faceoffsTaken,
            faceoff_pct: pct,
            pass_complete: toInt(s.pass_complete) ?? 0,
            pass_attempts: toInt(s.pass_attempts) ?? 0,
            passing_pct: (toInt(s.pass_attempts) ?? 0) > 0 ? ((toInt(s.pass_complete) ?? 0) / (toInt(s.pass_attempts) ?? 1)) * 100 : 0,
            skpenaltiesdrawn: toInt(s.penalties_drawn) ?? 0,
            ppg: toInt(s.ppg) ?? 0,
            pim: toInt(s.pim) ?? 0,
            toi: s.toi || "0:00",
            shot_attempts: toInt(s.shots) ?? 0,
            shot_pct: 0,
            shg: 0,
          }
        })

      // GOALIES
      const goalieRows = goalieStats
        .filter((g) => (g.player_name || "").trim().length > 0)
        .map((g) => ({
          match_id: match.id,
          ea_match_id: eaMatchId,
          season_id,
          player_name: g.player_name.trim(),
          player_id: g.player_id ? String(g.player_id) : null, // TEXT in schema
          team_id: g.team_id,
          position: "G",
          toi: g.toi || "60:00",
          save_pct: Number.isFinite(Number(g.save_pct)) ? Number(g.save_pct) : 0,
          goals_against: toInt(g.goals_against) ?? 0,
          saves: toInt(g.saves) ?? 0,
          goals: 0,
          assists: 0,
          plus_minus: 0,
          shots: 0,
          hits: 0,
          pim: 0,
          blocks: 0,
        }))

      const allRecords = [...skaterRows, ...goalieRows]

      if (allRecords.length === 0) {
        toast.error("Please add at least one player stat")
        setSaving(false)
        return
      }

      // Split by presence of player_id (TEXT)
      const withId = allRecords.filter((r) => r.player_id && String(r.player_id).trim() !== "")
      const withoutId = allRecords.filter((r) => !r.player_id || String(r.player_id).trim() === "")

      // 1) Upsert those WITH player_id using partial unique index (match_id, player_id)
      if (withId.length > 0) {
        const { error: upErr } = await supabase
          .from(playerStatsTable)
          .upsert(withId, { onConflict: "match_id,player_id" })
          .select()

        if (upErr) {
          console.error("[manual-stats] upsert error", upErr)
          toast.error(upErr.message || "Failed to save stats")
          setSaving(false)
          return
        }
      }

      // 2) For rows WITHOUT player_id, delete+insert by (match_id, team_id, player_name)
      if (withoutId.length > 0) {
        await deleteThenInsert(playerStatsTable, withoutId)
      }

      toast.success(`Saved ${allRecords.length} record(s).`)
      setSkaterStats([])
      setGoalieStats([])
      onSave?.()
      onOpenChange(false)
    } catch (e: any) {
      console.error("[manual-stats] unexpected error", e)
      toast.error(e?.message || "Unexpected error saving stats")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Stats</DialogTitle>
          <DialogDescription>
            Manually enter player statistics for this match. Select players, enter their stats, and click Save.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="skaters" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="skaters">
              Skater Stats {skaterStats.length > 0 && `(${skaterStats.length})`}
            </TabsTrigger>
            <TabsTrigger value="goalies">
              Goalie Stats {goalieStats.length > 0 && `(${goalieStats.length})`}
            </TabsTrigger>
          </TabsList>

          {/* SKATERS */}
          <TabsContent value="skaters" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Skater Statistics</h3>
              <Button onClick={addSkaterStat} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Skater
              </Button>
            </div>

            {skaterStats.map((stat, index) => (
              <Card key={index} className="border-2 border-slate-700">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <div>
                        <Label>Team *</Label>
                        <Select value={stat.team_id} onValueChange={(v) => updateSkaterStat(index, "team_id", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={match.home_team_id}>
                              {match.homeTeam?.name || match.home_team?.name || "Home Team"}
                            </SelectItem>
                            <SelectItem value={match.away_team_id}>
                              {match.awayTeam?.name || match.away_team?.name || "Away Team"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Player *</Label>
                        <PlayerCombobox
                          users={users}
                          value={stat.player_id || null}
                          placeholder={stat.player_name || "Select player"}
                          onChange={(id, label) => {
                            updateSkaterStat(index, "player_id", id) // UUID string -> TEXT is fine
                            updateSkaterStat(index, "player_name", label)
                          }}
                        />
                      </div>

                      <div>
                        <Label>Position *</Label>
                        <Select value={stat.position} onValueChange={(v) => updateSkaterStat(index, "position", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LW">LW</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="RW">RW</SelectItem>
                            <SelectItem value="LD">LD</SelectItem>
                            <SelectItem value="RD">RD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSkaterStat(index)} className="ml-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label>G</Label>
                      <Input
                        type="number"
                        value={stat.goals}
                        onChange={(e) => updateSkaterStat(index, "goals", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>A</Label>
                      <Input
                        type="number"
                        value={stat.assists}
                        onChange={(e) => updateSkaterStat(index, "assists", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>P</Label>
                      <Input type="number" value={stat.goals + stat.assists} disabled />
                    </div>
                    <div>
                      <Label>+/-</Label>
                      <Input
                        type="number"
                        value={stat.plus_minus}
                        onChange={(e) => updateSkaterStat(index, "plus_minus", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <Label>TWP</Label>
                      <Input
                        type="number"
                        value={stat.time_with_puck}
                        onChange={(e) => updateSkaterStat(index, "time_with_puck", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>SH</Label>
                      <Input
                        type="number"
                        value={stat.shots}
                        onChange={(e) => updateSkaterStat(index, "shots", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>BLK</Label>
                      <Input
                        type="number"
                        value={stat.blocks}
                        onChange={(e) => updateSkaterStat(index, "blocks", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>GVA</Label>
                      <Input
                        type="number"
                        value={stat.giveaways}
                        onChange={(e) => updateSkaterStat(index, "giveaways", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>TKA</Label>
                      <Input
                        type="number"
                        value={stat.takeaways}
                        onChange={(e) => updateSkaterStat(index, "takeaways", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <Label>INT</Label>
                      <Input
                        type="number"
                        value={stat.interceptions}
                        onChange={(e) => updateSkaterStat(index, "interceptions", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>FOW</Label>
                      <Input
                        type="number"
                        value={stat.faceoffs_won}
                        onChange={(e) => updateSkaterStat(index, "faceoffs_won", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>FO%</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={stat.faceoff_pct}
                        onChange={(e) => updateSkaterStat(index, "faceoff_pct", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>PassCom</Label>
                      <Input
                        type="number"
                        value={stat.pass_complete}
                        onChange={(e) => updateSkaterStat(index, "pass_complete", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>PassAtt</Label>
                      <Input
                        type="number"
                        value={stat.pass_attempts}
                        onChange={(e) => updateSkaterStat(index, "pass_attempts", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label>PDraws</Label>
                      <Input
                        type="number"
                        value={stat.penalties_drawn}
                        onChange={(e) => updateSkaterStat(index, "penalties_drawn", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>PPG</Label>
                      <Input
                        type="number"
                        value={stat.ppg}
                        onChange={(e) => updateSkaterStat(index, "ppg", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>PIM</Label>
                      <Input
                        type="number"
                        value={stat.pim}
                        onChange={(e) => updateSkaterStat(index, "pim", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>TOI</Label>
                      <Input
                        type="text"
                        placeholder="MM:SS"
                        value={stat.toi}
                        onChange={(e) => updateSkaterStat(index, "toi", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {skaterStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No skater stats added yet. Click "Add Skater" to begin.
              </div>
            )}
          </TabsContent>

          {/* GOALIES */}
          <TabsContent value="goalies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Goalie Statistics</h3>
              <Button onClick={addGoalieStat} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Goalie
              </Button>
            </div>

            {goalieStats.map((stat, index) => (
              <Card key={index} className="border-2 border-slate-700">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <Label>Team *</Label>
                        <Select value={stat.team_id} onValueChange={(v) => updateGoalieStat(index, "team_id", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={match.home_team_id}>
                              {match.homeTeam?.name || match.home_team?.name || "Home Team"}
                            </SelectItem>
                            <SelectItem value={match.away_team_id}>
                              {match.awayTeam?.name || match.away_team?.name || "Away Team"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Player *</Label>
                        <PlayerCombobox
                          users={users}
                          value={stat.player_id || null}
                          placeholder={stat.player_name || "Select player"}
                          onChange={(id, label) => {
                            updateGoalieStat(index, "player_id", id) // UUID string -> TEXT
                            updateGoalieStat(index, "player_name", label)
                          }}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeGoalieStat(index)} className="ml-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <Label>TOI</Label>
                      <Input
                        type="text"
                        placeholder="MM:SS"
                        value={stat.toi}
                        onChange={(e) => updateGoalieStat(index, "toi", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>SV%</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={stat.save_pct}
                        onChange={(e) => updateGoalieStat(index, "save_pct", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>GA</Label>
                      <Input
                        type="number"
                        value={stat.goals_against}
                        onChange={(e) => updateGoalieStat(index, "goals_against", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>SV</Label>
                      <Input
                        type="number"
                        value={stat.saves}
                        onChange={(e) => updateGoalieStat(index, "saves", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>GAA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          (() => {
                            const [m = "0", s = "0"] = (stat.toi || "0:00").split(":")
                            const minutes = parseInt(m) + (parseInt(s) || 0) / 60
                            return minutes > 0 ? ((stat.goals_against * 60) / minutes).toFixed(2) : "0.00"
                          })()
                        }
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {goalieStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No goalie stats added yet. Click "Add Goalie" to begin.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || (skaterStats.length === 0 && goalieStats.length === 0)}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : `Save Stats (${skaterStats.length + goalieStats.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
