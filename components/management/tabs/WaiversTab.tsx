"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { TeamLogos } from "@/components/management/team-logos"
import { WaiverPriorityDisplay } from "@/components/management/waiver-priority-display"
import { Clock } from "lucide-react"

type Props = {
  now: Date
  teamId?: string
  teamName?: string
  teamPlayers: any[]
  waivers: any[]
  loadingWaivers: boolean
  waiverError: string | null
  loadWaiversData: () => void
  claimingWaivers: Set<string>
  waivingPlayers: Set<string>
  handleClaimPlayer: (waiverId: string) => void
  handleWaivePlayerAction: (playerId: string) => void
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string
}

export default function WaiversTab({
  now,
  teamId,
  teamName,
  teamPlayers,
  waivers,
  loadingWaivers,
  waiverError,
  loadWaiversData,
  claimingWaivers,
  waivingPlayers,
  handleClaimPlayer,
  handleWaivePlayerAction,
  getPositionAbbreviation,
  getPositionColor,
}: Props) {
  const claimablePlayers = useMemo(
    () => teamPlayers.filter((p) => !["Owner", "GM", "AGM"].includes(p.role)),
    [teamPlayers]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiver Wire</CardTitle>
        <CardDescription>
          Waive players from your roster or claim players from other teams. Claims are processed based on waiver
          priority. Waivers are automatically processed when they expire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="available">Available Players</TabsTrigger>
            <TabsTrigger value="waive">Waive Player</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                {loadingWaivers ? (
                  <div className="space-y-4">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="h-20 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                      ))}
                  </div>
                ) : waiverError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">{waiverError}</p>
                    <Button onClick={loadWaiversData} className="mt-4">
                      Try Again
                    </Button>
                  </div>
                ) : waivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No players currently on waivers</div>
                ) : (
                  <div className="space-y-4">
                    {waivers.map((waiver) => {
                      const timeRemaining = new Date(waiver.claim_deadline).getTime() - now.getTime()
                      const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
                      const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)))
                      const isExpired = timeRemaining <= 0
                      const isClaimingThisWaiver = claimingWaivers.has(waiver.id)
                      const hasAlreadyClaimed = waiver.hasTeamClaimed

                      return (
                        <div key={waiver.id} className="border rounded-lg p-4 shadow-sm dark:border-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium">{waiver.players?.users?.gamer_tag_id || "Unknown Player"}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <span
                                  className={getPositionColor(waiver.players?.season_registrations?.[0]?.primary_position)}
                                >
                                  {getPositionAbbreviation(
                                    waiver.players?.season_registrations?.[0]?.primary_position || "UNKNOWN"
                                  )}
                                </span>
                                {waiver.players?.season_registrations?.[0]?.secondary_position && (
                                  <>
                                    {" / "}
                                    <span
                                      className={getPositionColor(
                                        waiver.players?.season_registrations?.[0]?.secondary_position
                                      )}
                                    >
                                      {getPositionAbbreviation(waiver.players?.season_registrations?.[0]?.secondary_position)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Waived by {waiver.waiving_team?.name} • Salary: ${waiver.players?.salary?.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center">
                                <Clock className={`h-4 w-4 mr-1 ${isExpired ? "text-red-500" : "text-muted-foreground"}`} />
                                <span className={`text-sm ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                                  {isExpired ? "Processing..." : `${hoursRemaining}h ${minutesRemaining}m`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {waiver.waiver_claims && waiver.waiver_claims.length > 0 && (
                            <div className="mb-3 p-2 bg-muted rounded-md">
                              <h4 className="text-sm font-medium mb-2">Claiming Teams ({waiver.waiver_claims.length}):</h4>
                              <TeamLogos teams={waiver.waiver_claims.map((claim: any) => claim.teams)} />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleClaimPlayer(waiver.id)}
                              className="flex-1"
                              size="sm"
                              disabled={isExpired || isClaimingThisWaiver || hasAlreadyClaimed || waiver.waiving_team_id === teamId}
                            >
                              {isClaimingThisWaiver
                                ? "Claiming..."
                                : hasAlreadyClaimed
                                ? "Claim Submitted"
                                : waiver.waiving_team_id === teamId
                                ? "Your Waiver"
                                : isExpired
                                ? "Processing..."
                                : "Claim Player"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">{teamId && <WaiverPriorityDisplay teamId={teamId} />}</div>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={loadWaiversData} disabled={loadingWaivers}>
                {loadingWaivers ? "Loading..." : "Refresh Waivers"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="waive">
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Waiver Process</h3>
                <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
                  <li>• Players are placed on waivers for 8 hours</li>
                  <li>• You can cancel within 30 minutes of waiving</li>
                  <li>• Teams can claim players based on waiver priority (worst record gets first priority)</li>
                  <li>• If multiple teams claim, highest priority wins</li>
                  <li>• Winning team moves to bottom of waiver priority</li>
                  <li>• Unclaimed players become free agents</li>
                  <li>• Waivers are automatically processed when they expire</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {claimablePlayers.map((player) => {
                  const isWaivingThisPlayer = waivingPlayers.has(player.id)
                  return (
                    <div key={player.id} className="border rounded-lg p-4 shadow-sm dark:border-gray-800">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{player.users?.gamer_tag_id || "Unknown Player"}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={getPositionColor(player.season_registrations?.[0]?.primary_position)}>
                              {getPositionAbbreviation(player.season_registrations?.[0]?.primary_position || "UNKNOWN")}
                            </span>
                            {player.season_registrations?.[0]?.secondary_position && (
                              <>
                                {" / "}
                                <span className={getPositionColor(player.season_registrations?.[0]?.secondary_position)}>
                                  {getPositionAbbreviation(player.season_registrations?.[0]?.secondary_position)}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">${player.salary?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{player.users?.console}</p>
                        </div>
                        <Badge variant="outline">{player.role}</Badge>
                      </div>
                      <Button
                        onClick={() => handleWaivePlayerAction(player.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={isWaivingThisPlayer}
                      >
                        {isWaivingThisPlayer ? "Waiving..." : "Waive Player"}
                      </Button>
                    </div>
                  )
                })}
              </div>

              {claimablePlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No players available to waive (management roles cannot be waived)
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
