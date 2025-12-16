"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSupabase } from "@/lib/supabase/client"

type Props = {
  teamPlayers: any[]
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string
}

export default function TeamRosterTab({ teamPlayers, getPositionAbbreviation, getPositionColor }: Props) {
  const { supabase } = useSupabase()

  // We capture BOTH season id and number to handle schemas that use either in season_registrations.
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null)
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadActiveSeason = async () => {
      try {
        // Prefer system_settings.current_season_number if present
        const { data: settings } = await supabase
          .from("system_settings")
          .select("current_season_number")
          .maybeSingle()

        if (settings?.current_season_number != null) {
          setActiveSeasonNumber(settings.current_season_number)
        }

        // Also fetch the active season row so we have the season *id* as well
        const { data: season, error: seasonErr } = await supabase
          .from("seasons")
          .select("id, season_number, is_active")
          .eq("is_active", true)
          .maybeSingle()

        if (!cancelled) {
          if (!seasonErr && season) {
            setActiveSeasonId(season.id ?? null)
            // Keep number from seasons too (even if system_settings missing)
            if (activeSeasonNumber == null && season.season_number != null) {
              setActiveSeasonNumber(season.season_number)
            }
          }
        }
      } catch (e) {
        // Silent fail; component will just fall back to first registration if present
        if (!cancelled) {
          setActiveSeasonId(null)
          // don't force number to null; if we had one from settings, keep it
        }
      }
    }
    loadActiveSeason()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const safePlayers = useMemo(() => (Array.isArray(teamPlayers) ? teamPlayers : []), [teamPlayers])

  // Choose the season registration for the active season by id OR number.
  const getDisplayRegistration = (player: any) => {
    const regs = Array.isArray(player?.season_registrations) ? player.season_registrations : []
    if (!regs.length) return null

    // 1) Exact match by season_id (most reliable if your regs store season_id)
    if (activeSeasonId) {
      const byId = regs.find((r: any) => r?.season_id === activeSeasonId)
      if (byId) return byId
    }

    // 2) Exact match by season_number (if your regs store season_number)
    if (activeSeasonNumber != null) {
      const byNumber = regs.find((r: any) => r?.season_number === activeSeasonNumber)
      if (byNumber) return byNumber
    }

    // 3) Fallback: if neither id nor number matched, use the first available registration
    //    so we don't render UNKNOWN when data exists.
    return regs[0] ?? null
  }

  const renderPosition = (player: any) => {
    const reg = getDisplayRegistration(player)
    const primary = reg?.primary_position ?? "UNKNOWN"
    const secondary = reg?.secondary_position ?? null

    return (
      <div className="flex items-center justify-center gap-1">
        <span className={getPositionColor(primary)}>{getPositionAbbreviation(primary)}</span>
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
                    <TableHead className="text-center">Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safePlayers.map((player) => (
                    <TableRow key={player.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-medium">{player?.users?.gamer_tag_id || "Unknown Player"}</div>
                      </TableCell>
                      <TableCell className="text-center">{renderPosition(player)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={player?.role === "Owner" ? "default" : "outline"}>
                          {player?.role ?? "Player"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{player?.users?.console || "Unknown"}</TableCell>
                      <TableCell className="text-center font-mono">
                        ${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {safePlayers.map((player) => (
                <div key={player.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{player?.users?.gamer_tag_id || "Unknown Player"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {/* reuse the same rendering for consistency */}
                        {renderPosition(player)}
                      </div>
                    </div>
                    <Badge variant={player?.role === "Owner" ? "default" : "outline"} className="text-xs">
                      {player?.role ?? "Player"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{player?.users?.console || "Unknown"}</span>
                    <span className="font-mono font-medium">
                      ${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No players on this team.</div>
        )}
      </CardContent>
    </Card>
  )
}
