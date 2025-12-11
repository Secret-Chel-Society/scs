"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"
import type { TeamStanding } from "@/lib/standings-calculator"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface BracketMatchup {
  id: string
  round: number
  position: number
  team1_id?: number
  team1_name?: string
  team1_seed?: number
  team2_id?: number
  team2_name?: string
  team2_seed?: number
  team1_wins: number
  team2_wins: number
  winner_id?: number
  series_complete: boolean
}

interface PlayoffBracketProps {
  standings: TeamStanding[]
  seasonId: number
  isAdmin: boolean
  season: any // Season object with parent_season_id
}

export default function PlayoffBracket({ standings, seasonId, isAdmin, season }: PlayoffBracketProps) {
  const [bracket, setBracket] = useState<BracketMatchup[]>([])
  const [parentSeasonStandings, setParentSeasonStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMatchup, setEditingMatchup] = useState<BracketMatchup | null>(null)
  const [editingTeams, setEditingTeams] = useState<BracketMatchup | null>(null)
  const [editingSeeding, setEditingSeeding] = useState<BracketMatchup | null>(null)

  const playoffTeams = parentSeasonStandings.slice(0, Math.min(32, parentSeasonStandings.length))
  const bracketSize = playoffTeams.length <= 8 ? 8 : playoffTeams.length <= 16 ? 16 : 32

  useEffect(() => {
    fetchParentSeasonStandings()
  }, [seasonId, season])

  useEffect(() => {
    if (parentSeasonStandings.length > 0) {
      fetchBracket()
    }
  }, [seasonId, parentSeasonStandings])

  const fetchParentSeasonStandings = async () => {
    if (!season?.parent_season_id) {
      console.log("No parent season found, using current standings")
      setParentSeasonStandings(standings)
      return
    }

    try {
      console.log("Fetching parent season standings for season ID:", season.parent_season_id)

      const { data: parentSeason, error: parentSeasonError } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", season.parent_season_id)
        .single()

      if (parentSeasonError || !parentSeason) {
        console.error("Error fetching parent season:", parentSeasonError)
        setParentSeasonStandings(standings)
        return
      }

      console.log("Parent season found:", parentSeason)

      const { data: parentTeams, error: teamsError } = await supabase
        .from("teams")
        .select("*, logo_url")
        .eq("season_id", parentSeason.season_number || parentSeason.number || 1)
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("goal_differential", { ascending: false })

      if (teamsError) {
        console.error("Error fetching parent season teams:", teamsError)
        setParentSeasonStandings(standings)
        return
      }

      if (!parentTeams || parentTeams.length === 0) {
        console.log("No teams found for parent season, using current standings")
        setParentSeasonStandings(standings)
        return
      }

      const parentStandings = parentTeams.map((team, index) => ({
        id: team.id,
        name: team.name,
        logo_url: team.logo_url,
        games_played: team.games_played || 0,
        wins: team.wins || 0,
        losses: team.losses || 0,
        ties: team.ties || 0,
        points: team.points || 0,
        goals_for: team.goals_for || 0,
        goals_against: team.goals_against || 0,
        goal_differential: team.goal_differential || 0,
        position: index + 1,
      }))

      console.log("Parent season standings fetched:", parentStandings)
      setParentSeasonStandings(parentStandings)
    } catch (error) {
      console.error("Error fetching parent season standings:", error)
      setParentSeasonStandings(standings)
    }
  }

  const fetchBracket = async () => {
    try {
      setLoading(true)

      let seasonNumber = season.season_number || season.number

      if (!seasonNumber) {
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("season_number, number")
          .eq("id", seasonId)
          .single()

        if (!seasonError && seasonData) {
          seasonNumber = seasonData.season_number || seasonData.number
        }
      }

      if (!seasonNumber) {
        console.warn("No season number found, defaulting to 1")
        seasonNumber = 1
      }

      console.log("Using season number for bracket:", seasonNumber)

      const { data, error } = await supabase
        .from("playoff_brackets")
        .select("*")
        .eq("season_id", seasonNumber)
        .order("round")
        .order("position")

      if (error) {
        console.error("Error fetching bracket:", error)
        initializeBracket()
        return
      }

      if (!data || data.length === 0) {
        initializeBracket()
        return
      }

      setBracket(data)
    } catch (error) {
      console.error("Error fetching bracket:", error)
      initializeBracket()
    } finally {
      setLoading(false)
    }
  }

  const initializeBracket = () => {
    const rounds = Math.log2(bracketSize)
    const newBracket: BracketMatchup[] = []

    const seededTeams = playoffTeams.map((team, index) => ({
      ...team,
      seed: index + 1,
    }))

    const firstRoundMatches = bracketSize / 2
    for (let i = 0; i < firstRoundMatches; i++) {
      const team1 = seededTeams[i]
      const team2 = seededTeams[bracketSize - 1 - i]

      newBracket.push({
        id: `r1-${i}`,
        round: 1,
        position: i,
        team1_id: team1 ? Number.parseInt(team1.id.toString()) : undefined,
        team1_name: team1?.name,
        team1_seed: team1?.seed,
        team2_id: team2 ? Number.parseInt(team2.id.toString()) : undefined,
        team2_name: team2?.name,
        team2_seed: team2?.seed,
        team1_wins: 0,
        team2_wins: 0,
        series_complete: false,
      })
    }

    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round)
      for (let pos = 0; pos < matchesInRound; pos++) {
        newBracket.push({
          id: `r${round}-${pos}`,
          round,
          position: pos,
          team1_wins: 0,
          team2_wins: 0,
          series_complete: false,
        })
      }
    }

    setBracket(newBracket)
    setLoading(false)
  }

  const updateMatchup = async (matchup: BracketMatchup) => {
    try {
      let seasonNumber = season.season_number || season.number

      if (!seasonNumber) {
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("season_number, number")
          .eq("id", seasonId)
          .single()

        if (!seasonError && seasonData) {
          seasonNumber = seasonData.season_number || seasonData.number
        }
      }

      if (!seasonNumber) {
        console.warn("No season number found for update, defaulting to 1")
        seasonNumber = 1
      }

      console.log("Updating matchup with season number:", seasonNumber)

      const { error } = await supabase.from("playoff_brackets").upsert({
        id: matchup.id,
        season_id: seasonNumber,
        round: matchup.round,
        position: matchup.position,
        team1_id: matchup.team1_id,
        team1_name: matchup.team1_name,
        team1_seed: matchup.team1_seed,
        team2_id: matchup.team2_id,
        team2_name: matchup.team2_name,
        team2_seed: matchup.team2_seed,
        team1_wins: matchup.team1_wins,
        team2_wins: matchup.team2_wins,
        winner_id: matchup.winner_id,
        series_complete: matchup.series_complete,
      })

      if (error) {
        console.error("Error updating matchup:", error)
        return
      }

      setBracket((prev) => prev.map((m) => (m.id === matchup.id ? matchup : m)))

      if (matchup.series_complete && matchup.winner_id) {
        await advanceWinner(matchup)
      }
    } catch (error) {
      console.error("Error updating matchup:", error)
    }
  }

  const advanceWinner = async (completedMatchup: BracketMatchup) => {
    const nextRound = completedMatchup.round + 1
    const nextPosition = Math.floor(completedMatchup.position / 2)

    let nextMatchup = bracket.find((m) => m.round === nextRound && m.position === nextPosition)

    if (!nextMatchup) {
      const totalRounds = Math.log2(bracketSize)
      if (nextRound <= totalRounds) {
        nextMatchup = {
          id: `r${nextRound}-${nextPosition}`,
          round: nextRound,
          position: nextPosition,
          team1_wins: 0,
          team2_wins: 0,
          series_complete: false,
        }

        // Add to bracket state
        setBracket((prev) => [...prev, nextMatchup!])
      } else {
        return
      }
    }

    const isFirstTeam = completedMatchup.position % 2 === 0
    const winnerTeam =
      completedMatchup.winner_id === completedMatchup.team1_id
        ? { id: completedMatchup.team1_id, name: completedMatchup.team1_name, seed: completedMatchup.team1_seed }
        : { id: completedMatchup.team2_id, name: completedMatchup.team2_name, seed: completedMatchup.team2_seed }

    const updatedNextMatchup = {
      ...nextMatchup,
      ...(isFirstTeam
        ? { team1_id: winnerTeam.id, team1_name: winnerTeam.name, team1_seed: winnerTeam.seed }
        : { team2_id: winnerTeam.id, team2_name: winnerTeam.name, team2_seed: winnerTeam.seed }),
    }

    await updateMatchup(updatedNextMatchup)
  }

  const getRoundName = (round: number) => {
    const totalRounds = Math.log2(bracketSize)
    if (round === totalRounds) return "Final"
    if (round === totalRounds - 1) return "Semifinal"
    if (round === totalRounds - 2) return "Quarterfinal"
    return `Round ${round}`
  }

  const assignTeamsToMatchup = async (matchup: BracketMatchup, team1Data: any, team2Data: any) => {
    const updatedMatchup = {
      ...matchup,
      team1_id: team1Data ? Number.parseInt(team1Data.id.toString()) : undefined,
      team1_name: team1Data?.name,
      team1_seed: team1Data?.seed,
      team2_id: team2Data ? Number.parseInt(team2Data.id.toString()) : undefined,
      team2_name: team2Data?.name,
      team2_seed: team2Data?.seed,
    }

    await updateMatchup(updatedMatchup)
    setEditingTeams(null)
  }

  const EditMatchupForm = ({
    matchup,
    onSave,
  }: {
    matchup: BracketMatchup
    onSave: (matchup: BracketMatchup) => void
  }) => {
    const [team1Wins, setTeam1Wins] = useState(matchup.team1_wins.toString())
    const [team2Wins, setTeam2Wins] = useState(matchup.team2_wins.toString())
    const [seriesComplete, setSeriesComplete] = useState(matchup.series_complete)

    const handleSave = () => {
      const t1Wins = Number.parseInt(team1Wins) || 0
      const t2Wins = Number.parseInt(team2Wins) || 0
      const isComplete = seriesComplete || t1Wins >= 4 || t2Wins >= 4
      const winnerId = isComplete ? (t1Wins > t2Wins ? matchup.team1_id : matchup.team2_id) : undefined

      onSave({
        ...matchup,
        team1_wins: t1Wins,
        team2_wins: t2Wins,
        series_complete: isComplete,
        winner_id: winnerId,
      })
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{matchup.team1_name} Wins</Label>
            <Input type="number" min="0" max="4" value={team1Wins} onChange={(e) => setTeam1Wins(e.target.value)} />
          </div>
          <div>
            <Label>{matchup.team2_name} Wins</Label>
            <Input type="number" min="0" max="4" value={team2Wins} onChange={(e) => setTeam2Wins(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="series-complete"
            checked={seriesComplete}
            onChange={(e) => setSeriesComplete(e.target.checked)}
          />
          <Label htmlFor="series-complete">Series Complete</Label>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </div>
    )
  }

  const EditSeedingForm = ({
    matchup,
    onSave,
  }: {
    matchup: BracketMatchup
    onSave: (matchup: BracketMatchup) => void
  }) => {
    const [team1Seed, setTeam1Seed] = useState(matchup.team1_seed?.toString() || "")
    const [team2Seed, setTeam2Seed] = useState(matchup.team2_seed?.toString() || "")

    const handleSave = () => {
      const updatedMatchup = {
        ...matchup,
        team1_seed: team1Seed ? Number.parseInt(team1Seed) : undefined,
        team2_seed: team2Seed ? Number.parseInt(team2Seed) : undefined,
      }

      onSave(updatedMatchup)
      setEditingSeeding(null)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{matchup.team1_name} Seed</Label>
            <Input
              type="number"
              min="1"
              max="32"
              value={team1Seed}
              onChange={(e) => setTeam1Seed(e.target.value)}
              placeholder="Enter seed number"
            />
          </div>
          <div>
            <Label>{matchup.team2_name} Seed</Label>
            <Input
              type="number"
              min="1"
              max="32"
              value={team2Seed}
              onChange={(e) => setTeam2Seed(e.target.value)}
              placeholder="Enter seed number"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Seeding
          </Button>
          <Button variant="outline" onClick={() => setEditingSeeding(null)} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const TeamLogoBanner = ({
    teamName,
    logoUrl,
    seed,
    wins,
    isWinner = false,
  }: {
    teamName?: string
    logoUrl?: string
    seed?: number
    wins: number
    isWinner?: boolean
  }) => (
    <div
      className={`
    relative flex items-center justify-between p-2 rounded-md border transition-all duration-200
    ${
      isWinner
        ? "bg-gradient-to-r from-green-600/20 to-green-500/20 border-green-400 shadow-md shadow-green-500/20"
        : "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-slate-600 hover:border-slate-500"
    }
    ${!teamName ? "border-dashed border-slate-500/50 bg-slate-800/30" : ""}
  `}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center overflow-hidden bg-white/10">
          {logoUrl ? (
            <img
              src={logoUrl || "/placeholder.svg"}
              alt={`${teamName} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to initials if logo fails to load
                e.currentTarget.style.display = "none"
                e.currentTarget.nextElementSibling!.style.display = "flex"
              }}
            />
          ) : null}
          <div
            className={`w-full h-full flex items-center justify-center text-xs font-bold ${logoUrl ? "hidden" : "flex"} ${
              teamName ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-slate-600/50 text-slate-400"
            }`}
          >
            {teamName ? teamName.substring(0, 2).toUpperCase() : "?"}
          </div>
        </div>

        <div className="flex flex-col">
          {seed && (
            <Badge
              variant="outline"
              className="w-5 h-5 text-xs p-0 flex items-center justify-center mb-1 bg-slate-700 border-slate-500"
            >
              {seed}
            </Badge>
          )}
          <span className={`text-xs font-semibold ${teamName ? "text-white" : "text-slate-400"}`}>
            {teamName || "TBD"}
          </span>
        </div>
      </div>

      <div
        className={`
      text-lg font-bold px-2 py-1 rounded-sm
      ${isWinner ? "text-green-400" : "text-slate-300"}
    `}
      >
        {wins}
      </div>
    </div>
  )

  const BracketConnector = ({
    round,
    position,
    totalRounds,
  }: { round: number; position: number; totalRounds: number }) => {
    if (round === totalRounds) return null

    return (
      <div className="flex items-center justify-center px-2">
        <svg width="40" height="80" className="text-slate-600">
          <path
            d="M 0 20 L 20 20 L 20 60 L 40 60"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="drop-shadow-sm"
          />
          <path d="M 0 60 L 20 60" stroke="currentColor" strokeWidth="2" fill="none" className="drop-shadow-sm" />
        </svg>
      </div>
    )
  }

  const MatchupCard = ({ matchup }: { matchup: BracketMatchup }) => {
    const isWinner1 = matchup.series_complete && matchup.winner_id === matchup.team1_id
    const isWinner2 = matchup.series_complete && matchup.winner_id === matchup.team2_id
    const totalRounds = Math.log2(bracketSize)

    const team1Data = parentSeasonStandings.find((t) => t.name === matchup.team1_name)
    const team2Data = parentSeasonStandings.find((t) => t.name === matchup.team2_name)

    return (
      <div className="flex items-center">
        <Card className="w-64 sm:w-72 bg-slate-900/90 border-slate-700 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <CardTitle className="text-center text-slate-200 text-sm font-bold">
              {getRoundName(matchup.round)}
            </CardTitle>
            {matchup.team1_seed && matchup.team2_seed && (
              <p className="text-center text-slate-400 text-xs font-medium">
                {matchup.team1_seed} vs {matchup.team2_seed}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-2 p-3">
            <TeamLogoBanner
              teamName={matchup.team1_name}
              logoUrl={team1Data?.logo_url}
              seed={matchup.team1_seed}
              wins={matchup.team1_wins}
              isWinner={isWinner1}
            />

            <div className="flex justify-center">
              <div className="w-6 h-0.5 bg-gradient-to-r from-slate-600 to-slate-500"></div>
            </div>

            <TeamLogoBanner
              teamName={matchup.team2_name}
              logoUrl={team2Data?.logo_url}
              seed={matchup.team2_seed}
              wins={matchup.team2_wins}
              isWinner={isWinner2}
            />

            {matchup.series_complete && matchup.winner_id && (
              <div className="text-center pt-1">
                <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold px-3 py-1 text-xs shadow-md">
                  🏆 {matchup.winner_id === matchup.team1_id ? matchup.team1_name : matchup.team2_name} Advances
                </Badge>
              </div>
            )}

            {isAdmin && (
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 text-xs px-2 py-1"
                      onClick={() => setEditingTeams(matchup)}
                    >
                      Assign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-slate-200">Assign Teams to Matchup</DialogTitle>
                    </DialogHeader>
                    <TeamAssignmentForm
                      matchup={matchup}
                      availableTeams={parentSeasonStandings}
                      onSave={assignTeamsToMatchup}
                    />
                  </DialogContent>
                </Dialog>

                {matchup.team1_name && matchup.team2_name && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 text-xs px-2 py-1"
                          onClick={() => setEditingSeeding(matchup)}
                        >
                          Seeding
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-slate-200">Edit Team Seeding</DialogTitle>
                        </DialogHeader>
                        <EditSeedingForm matchup={matchup} onSave={updateMatchup} />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 text-xs px-2 py-1"
                          onClick={() => setEditingMatchup(matchup)}
                        >
                          Series
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-slate-200">Edit Series</DialogTitle>
                        </DialogHeader>
                        <EditMatchupForm matchup={matchup} onSave={updateMatchup} />
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <BracketConnector round={matchup.round} position={matchup.position} totalRounds={totalRounds} />
      </div>
    )
  }

  const TeamAssignmentForm = ({
    matchup,
    availableTeams,
    onSave,
  }: {
    matchup: BracketMatchup
    availableTeams: TeamStanding[]
    onSave: (matchup: BracketMatchup, team1: any, team2: any) => void
  }) => {
    const [team1, setTeam1] = useState(matchup.team1_id?.toString() || "")
    const [team2, setTeam2] = useState(matchup.team2_id?.toString() || "")

    const handleSave = () => {
      const team1Data = availableTeams.find((t) => t.id.toString() === team1)
      const team2Data = availableTeams.find((t) => t.id.toString() === team2)

      if (team1Data) {
        team1Data.seed = availableTeams.indexOf(team1Data) + 1
      }
      if (team2Data) {
        team2Data.seed = availableTeams.indexOf(team2Data) + 1
      }

      onSave(matchup, team1Data, team2Data)
    }

    return (
      <div className="space-y-4">
        <div>
          <Label>Team 1</Label>
          <Select value={team1} onValueChange={setTeam1}>
            <SelectTrigger>
              <SelectValue placeholder="Select team 1" />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team, index) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {index + 1}. {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Team 2</Label>
          <Select value={team2} onValueChange={setTeam2}>
            <SelectTrigger>
              <SelectValue placeholder="Select team 2" />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team, index) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {index + 1}. {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={!team1 || !team2}>
          Assign Teams
        </Button>
      </div>
    )
  }

  const createNextRound = async () => {
    try {
      const currentRounds = [...new Set(bracket.map((m) => m.round))].sort((a, b) => a - b)
      const lastRound = Math.max(...currentRounds)
      const nextRound = lastRound + 1
      const totalRounds = Math.log2(bracketSize)

      if (nextRound > totalRounds) {
        console.log("All rounds already created")
        return
      }

      // Get completed matchups from the last round
      const lastRoundMatchups = bracket.filter((m) => m.round === lastRound && m.series_complete && m.winner_id)

      if (lastRoundMatchups.length === 0) {
        console.log("No completed matchups in last round to advance")
        return
      }

      const matchesInNextRound = Math.pow(2, totalRounds - nextRound)
      const newMatchups: BracketMatchup[] = []

      // Create matchups for next round
      for (let pos = 0; pos < matchesInNextRound; pos++) {
        const team1MatchIndex = pos * 2
        const team2MatchIndex = pos * 2 + 1

        const team1Match = lastRoundMatchups[team1MatchIndex]
        const team2Match = lastRoundMatchups[team2MatchIndex]

        let team1Data, team2Data

        if (team1Match) {
          team1Data =
            team1Match.winner_id === team1Match.team1_id
              ? { id: team1Match.team1_id, name: team1Match.team1_name, seed: team1Match.team1_seed }
              : { id: team1Match.team2_id, name: team1Match.team2_name, seed: team1Match.team2_seed }
        }

        if (team2Match) {
          team2Data =
            team2Match.winner_id === team2Match.team1_id
              ? { id: team2Match.team1_id, name: team2Match.team1_name, seed: team2Match.team1_seed }
              : { id: team2Match.team2_id, name: team2Match.team2_name, seed: team2Match.team2_seed }
        }

        const newMatchup: BracketMatchup = {
          id: `r${nextRound}-${pos}`,
          round: nextRound,
          position: pos,
          team1_id: team1Data?.id,
          team1_name: team1Data?.name,
          team1_seed: team1Data?.seed,
          team2_id: team2Data?.id,
          team2_name: team2Data?.name,
          team2_seed: team2Data?.seed,
          team1_wins: 0,
          team2_wins: 0,
          series_complete: false,
        }

        newMatchups.push(newMatchup)
        await updateMatchup(newMatchup)
      }

      console.log(`Created ${newMatchups.length} matchups for round ${nextRound}`)

      // Refresh bracket data
      await fetchBracket()
    } catch (error) {
      console.error("Error creating next round:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-200">Loading Playoff Bracket...</h3>
        </div>
      </div>
    )
  }

  const rounds = bracket.reduce(
    (acc, matchup) => {
      if (!acc[matchup.round]) acc[matchup.round] = []
      acc[matchup.round].push(matchup)
      return acc
    },
    {} as { [round: number]: BracketMatchup[] },
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="text-center mb-6">
        <div className="inline-block">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">
            MGHL
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wider mb-3">PLAYOFFS</h2>
          <div className="flex items-center justify-center gap-3 text-slate-300">
            <Badge variant="outline" className="bg-slate-800 border-slate-600 text-slate-200 px-3 py-1 text-xs">
              {bracketSize} Teams
            </Badge>
            <span className="text-slate-500">•</span>
            <Badge variant="outline" className="bg-slate-800 border-slate-600 text-slate-200 px-3 py-1 text-xs">
              Best of 7 Series
            </Badge>
          </div>
          {season?.parent_season_id && (
            <p className="text-slate-400 mt-2 text-xs">Seeding based on regular season standings</p>
          )}

          {/* Admin controls for creating next round */}
          {isAdmin && (
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={createNextRound} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm">
                Create Next Round
              </Button>
              <Button
                onClick={fetchBracket}
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-700 px-4 py-2 text-sm bg-transparent"
              >
                Refresh Bracket
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-3 sm:gap-4 min-w-max justify-center">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
            .map(([round, matchups]) => (
              <div key={round} className="flex flex-col items-center">
                <div className="mb-4">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-white font-bold px-4 py-1 text-sm"
                  >
                    {getRoundName(Number.parseInt(round)).toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  {matchups.map((matchup) => (
                    <MatchupCard key={matchup.id} matchup={matchup} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
