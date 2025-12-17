"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, Clock, History } from "lucide-react"
import { SalaryProgress } from "@/components/management/salary-progress"
import { RosterProgress } from "@/components/management/roster-progress"

type Props = {
  currentTeamSalary: number
  currentSalaryCap: number
  projectedSalary: number
  rosterCount?: number
  teamPlayersCount?: number
  projectedRosterSize: number
  teamPlayers?: any[]
  positionFilter: string
  setPositionFilter: (v: string) => void
  nameFilter: string
  setNameFilter: (v: string) => void
  freeAgentsLoading: boolean
  freeAgentsError: string | null
  // Accept both naming conventions
  filteredFreeAgents?: any[]
  freeAgents?: any[]
  freeAgentsRaw?: any[]
  teamData?: any
  playerBids: Record<string, any>
  isBiddingEnabled: boolean
  handleBidClick: (player: any) => void
  handleHistoryClick: (player: any) => void
  formatTimeRemaining: (expiresAt: string) => string
  teamId?: string
  now?: Date
  loadFreeAgents?: () => void
  reloadFreeAgents?: () => void
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string
}

export default function FreeAgentsTab(props: Props) {
  const {
    currentTeamSalary = 0,
    currentSalaryCap = 0,
    projectedSalary = 0,
    rosterCount = 0,
    teamPlayersCount = 0,
    projectedRosterSize = 0,
    teamPlayers = [],
    positionFilter = "all",
    setPositionFilter,
    nameFilter = "",
    setNameFilter,
    freeAgentsLoading = false,
    freeAgentsError = null,
    filteredFreeAgents: filteredFreeAgentsProp,
    freeAgents: freeAgentsProp,
    freeAgentsRaw,
    teamData,
    playerBids = {},
    isBiddingEnabled = false,
    handleBidClick,
    handleHistoryClick,
    formatTimeRemaining,
    now,
    loadFreeAgents,
    reloadFreeAgents,
    getPositionAbbreviation,
    getPositionColor,
  } = props

  // Management page passes: freeAgents={filteredFreeAgents}, freeAgentsRaw={freeAgents}
  // So freeAgentsProp is actually the filtered list, and freeAgentsRaw is the raw list
  const displayList = filteredFreeAgentsProp || freeAgentsProp || []
  const rawList = freeAgentsRaw || freeAgentsProp || []

  const teamId = teamData?.id || props.teamId
  const actualRosterCount = rosterCount || teamPlayersCount || teamPlayers?.length || 0
  const reload = reloadFreeAgents || loadFreeAgents

  const hasFiltered = (displayList?.length ?? 0) > 0
  const noFreeAgents = (rawList?.length ?? 0) === 0

  const positionCounts = { C: 0, LW: 0, RW: 0, LD: 0, RD: 0, G: 0 }
  rawList?.forEach((player: any) => {
    const primaryPos = player?.users?.season_registrations?.[0]?.primary_position
    if (primaryPos && positionCounts.hasOwnProperty(primaryPos)) {
      positionCounts[primaryPos as keyof typeof positionCounts]++
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Free Agents</CardTitle>
        <CardDescription>
          Available players for bidding. {!isBiddingEnabled && "Bidding is currently disabled."} ({rawList?.length || 0}{" "}
          total, {displayList?.length || 0} shown)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Team Salary</h3>
              <SalaryProgress current={currentTeamSalary} max={currentSalaryCap} projected={projectedSalary} />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Roster Size</h3>
              <RosterProgress current={actualRosterCount} max={15} projected={projectedRosterSize} />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Position Breakdown</h3>
              <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-red-400 font-medium">C:</span>
                  <span className="text-white">{positionCounts.C}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400 font-medium">LW:</span>
                  <span className="text-white">{positionCounts.LW}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400 font-medium">RW:</span>
                  <span className="text-white">{positionCounts.RW}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400 font-medium">LD:</span>
                  <span className="text-white">{positionCounts.LD}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400 font-medium">RD:</span>
                  <span className="text-white">{positionCounts.RD}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-400 font-medium">G:</span>
                  <span className="text-white">{positionCounts.G}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="G">Goalie</SelectItem>
                <SelectItem value="C">Center</SelectItem>
                <SelectItem value="LW">Left Wing</SelectItem>
                <SelectItem value="RW">Right Wing</SelectItem>
                <SelectItem value="LD">Left Defense</SelectItem>
                <SelectItem value="RD">Right Defense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => (typeof setNameFilter === "function" ? setNameFilter(e.target.value) : undefined)}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {freeAgentsLoading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading free agents...</div>
          </div>
        ) : freeAgentsError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{freeAgentsError}</div>
            <Button onClick={reload} variant="outline">
              Try Again
            </Button>
          </div>
        ) : hasFiltered ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...(displayList ?? [])]
              .sort((a, b) => (a?.users?.gamer_tag_id || "").localeCompare(b?.users?.gamer_tag_id || ""))
              .map((player) => {
                if (!player?.users) return null
                const currentBid = playerBids?.[player.id]
                const canBid =
                  !!isBiddingEnabled &&
                  (!currentBid || currentBid.team_id !== teamId) &&
                  (projectedRosterSize ?? 0) < 15

                const primaryPos = player?.users?.season_registrations?.[0]?.primary_position
                const secondaryPos = player?.users?.season_registrations?.[0]?.secondary_position

                return (
                  <div key={player.id} className="border rounded-lg p-3 md:p-4 shadow-sm dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2 md:mb-3">
                      <div>
                        <h3 className="font-medium text-sm md:text-base">{player.users?.gamer_tag_id}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`${getPositionColor(primaryPos)} text-xs md:text-sm`}>
                            {getPositionAbbreviation(primaryPos || "UNKNOWN")}
                          </span>
                          {secondaryPos && (
                            <>
                              {" / "}
                              <span className={`${getPositionColor(secondaryPos)} text-xs md:text-sm`}>
                                {getPositionAbbreviation(secondaryPos)}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          {player.users?.console} • ${((player?.salary ?? 0) / 1_000_000).toFixed(2)}M
                        </p>
                      </div>
                    </div>

                    {currentBid && (
                      <div className="mb-2 md:mb-3 p-2 bg-muted rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs md:text-sm font-medium">Current Bid:</span>
                          <span className="font-bold text-xs md:text-sm">
                            ${(currentBid.bid_amount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>By: {currentBid?.teams?.name}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeRemaining(currentBid?.bid_expires_at)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBidClick(player)}
                        className="flex-1 text-xs md:text-sm h-8 md:h-9"
                        size="sm"
                        disabled={!canBid}
                        title={(projectedRosterSize ?? 0) >= 15 ? "Roster limit reached with current bids" : ""}
                      >
                        {currentBid && currentBid.team_id === teamId ? "Extend Bid" : "Place Bid"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHistoryClick(player)}
                        title="View Bid History"
                        className="h-8 md:h-9 w-8 md:w-9 p-0"
                      >
                        <History className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
            {noFreeAgents ? "No free agents available." : "No players match your filter criteria."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
