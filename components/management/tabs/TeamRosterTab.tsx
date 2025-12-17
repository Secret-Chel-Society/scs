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

  const [registrationsByUser, setRegistrationsByUser] = useState<Record<string, any>>({})
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null)
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number | null>(null)

  const safePlayers = useMemo(() => (Array.isArray(teamPlayers) ? teamPlayers : []), [teamPlayers])

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
          .select("user_id, primary_position, secondary_position, season_id, season_number, status")
          .in("user_id", userIds)
          .eq("status", "Approved")

        // Filter by active season if we have one
        if (activeSeason?.id) {
          query = query.eq("season_id", activeSeason.id)
        }

        const { data: registrations, error } = await query

        console.log("[v0] TeamRosterTab fetched registrations:", {
          userIds,
          activeSeasonId: activeSeason?.id,
          registrations,
          error,
        })

        if (!cancelled && registrations) {
          const regMap: Record<string, any> = {}
          for (const reg of registrations) {
            regMap[reg.user_id] = reg
          }
          setRegistrationsByUser(regMap)
        }
      } catch (e) {
        console.error("[v0] TeamRosterTab error loading registrations:", e)
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
      }
    }

    // Then check if registration was passed with player data
    const regs = Array.isArray(player?.season_registrations) ? player.season_registrations : []
    if (regs.length > 0) {
      const reg = regs[0]
      return {
        primary: reg?.primary_position,
        secondary: reg?.secondary_position,
      }
    }

    return { primary: null, secondary: null }
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
                      <div className="flex items-center gap-2 mt-1">{renderPosition(player)}</div>
                    </div>
                    <Badge variant={player?.role === "Owner" ? "default" : "outline"} className="text-xs">
                      {player?.role ?? "Player"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{player?.users?.console || "Unknown"}</span>
                    <span className="font-mono font-medium">${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M</span>
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
