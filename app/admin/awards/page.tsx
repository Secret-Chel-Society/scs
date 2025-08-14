"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Medal, Trash2, Plus, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Define the Season interface
interface Season {
  id: string | number // Seasons have UUID as ID
  name: string
  number?: number // Add a number field to represent the sequential season number
}

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  user_id: string
  gamer_tag_id: string
  team_id: string | null
  team_name: string | null
}

interface TeamAward {
  id: string
  team_id: string
  team_name: string
  award_type: string
  season_number: number
  year: number
  description: string | null
  created_at: string
}

interface PlayerAward {
  id: string
  player_id: string
  gamer_tag_id: string
  award_type: string
  season_number: number
  year: number
  description: string | null
  created_at: string
}

// Define default seasons to use as fallback
const DEFAULT_SEASONS: Season[] = [
  { id: "1", name: "Season 1", number: 1 },
  { id: "2", name: "Season 2", number: 2 },
  { id: "3", name: "Season 3", number: 3 },
]

export default function AdminAwardsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teamAwards, setTeamAwards] = useState<TeamAward[]>([])
  const [playerAwards, setPlayerAwards] = useState<PlayerAward[]>([])
  const [seasons, setSeasons] = useState<Season[]>(DEFAULT_SEASONS)

  // Map to convert season IDs to season numbers
  const [seasonIdToNumber, setSeasonIdToNumber] = useState<Map<string, number>>(new Map())

  // Form states
  const [newTeamAward, setNewTeamAward] = useState({
    team_id: "",
    award_type: "",
    season_number: 1,
    year: new Date().getFullYear(),
    description: "",
  })

  const [newPlayerAward, setNewPlayerAward] = useState({
    player_id: "",
    award_type: "",
    season_number: 1,
    year: new Date().getFullYear(),
    description: "",
  })

  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  const [editingTeamAward, setEditingTeamAward] = useState<TeamAward | null>(null)
  const [editingPlayerAward, setEditingPlayerAward] = useState<PlayerAward | null>(null)
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)
  const [isEditPlayerDialogOpen, setIsEditPlayerDialogOpen] = useState(false)

  // Using string for the selected season ID
  const [selectedTeamSeason, setSelectedTeamSeason] = useState<string>("1")
  const [selectedPlayerSeason, setSelectedPlayerSeason] = useState<string>("1")

  const teamAwardTypes = ["President Trophy", "MGHL Cup"]
  const playerAwardTypes = [
    "MVP",
    "Rookie of the Year",
    "Best Defenseman",
    "Best Forward",
    "Best Goalie",
    "Most Improved",
  ]

  useEffect(() => {
    async function checkAuthorization() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        fetchData()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  // Set the selected season when an award is loaded for editing
  useEffect(() => {
    if (editingTeamAward && seasons.length > 0) {
      // Find the season ID that corresponds to this season number
      const season = seasons.find((s) => s.number === editingTeamAward.season_number)
      if (season) {
        setSelectedTeamSeason(String(season.id))
      } else {
        // Default to first season if not found
        setSelectedTeamSeason(String(seasons[0].id))
      }
    }
  }, [editingTeamAward, seasons])

  useEffect(() => {
    if (editingPlayerAward && seasons.length > 0) {
      // Find the season ID that corresponds to this season number
      const season = seasons.find((s) => s.number === editingPlayerAward.season_number)
      if (season) {
        setSelectedPlayerSeason(String(season.id))
      } else {
        // Default to first season if not found
        setSelectedPlayerSeason(String(seasons[0].id))
      }
    }
  }, [editingPlayerAward, seasons])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name").order("name")

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // Fetch players with their gamer tags
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          id, 
          user_id,
          users:user_id (gamer_tag_id),
          team_id,
          teams:team_id (name)
        `)
        .order("id")

      if (playersError) throw playersError

      const formattedPlayers = playersData.map((player) => ({
        id: player.id,
        user_id: player.user_id,
        gamer_tag_id: player.users?.gamer_tag_id || "Unknown",
        team_id: player.team_id,
        team_name: player.teams?.name || null,
      }))

      setPlayers(formattedPlayers || [])

      // Fetch team awards
      const { data: teamAwardsData, error: teamAwardsError } = await supabase
        .from("team_awards")
        .select(`
          id,
          team_id,
          teams:team_id (name),
          award_type,
          season_number,
          year,
          description,
          created_at
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (teamAwardsError) throw teamAwardsError

      const formattedTeamAwards = teamAwardsData.map((award) => ({
        id: award.id,
        team_id: award.team_id,
        team_name: award.teams?.name || "Unknown Team",
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
        created_at: award.created_at,
      }))

      setTeamAwards(formattedTeamAwards || [])

      // Fetch player awards
      const { data: playerAwardsData, error: playerAwardsError } = await supabase
        .from("player_awards")
        .select(`
          id,
          player_id,
          players:player_id (
            users:user_id (gamer_tag_id)
          ),
          award_type,
          season_number,
          year,
          description,
          created_at
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (playerAwardsError) throw playerAwardsError

      const formattedPlayerAwards = playerAwardsData.map((award) => ({
        id: award.id,
        player_id: award.player_id,
        gamer_tag_id: award.players?.users?.gamer_tag_id || "Unknown Player",
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
        created_at: award.created_at,
      }))

      setPlayerAwards(formattedPlayerAwards || [])

      // Fetch seasons
      try {
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name")
          .order("name")

        if (seasonsData && !seasonsError && seasonsData.length > 0) {
          console.log("Fetched seasons from DB:", seasonsData)

          // Extract season numbers from names and sort by those numbers
          const processedSeasons = seasonsData
            .map((season) => {
              // Extract number from season name (e.g., "Season 3" -> 3)
              const nameMatch = season.name.match(/Season\s+(\d+)/i)
              const seasonNumber = nameMatch ? Number.parseInt(nameMatch[1], 10) : null

              return {
                ...season,
                number: seasonNumber, // Use the number from the name
              }
            })
            .sort((a, b) => (a.number || 0) - (b.number || 0)) // Sort by extracted number

          setSeasons(processedSeasons)

          // Create mapping from ID to the actual season number from the name
          const idToNumberMap = new Map<string, number>()
          processedSeasons.forEach((season) => {
            idToNumberMap.set(String(season.id), season.number || 0)
          })
          setSeasonIdToNumber(idToNumberMap)

          console.log("Season ID to Number mapping:", Object.fromEntries(idToNumberMap))
        } else {
          console.log("Using default seasons:", DEFAULT_SEASONS)
          setSeasons(DEFAULT_SEASONS)

          // Create mapping for default seasons
          const defaultMap = new Map<string, number>()
          DEFAULT_SEASONS.forEach((season) => {
            defaultMap.set(String(season.id), season.number || 0)
          })
          setSeasonIdToNumber(defaultMap)
        }
      } catch (error) {
        console.error("Error fetching seasons:", error)
        console.log("Using default seasons due to error:", DEFAULT_SEASONS)
        setSeasons(DEFAULT_SEASONS)

        // Create mapping for default seasons
        const defaultMap = new Map<string, number>()
        DEFAULT_SEASONS.forEach((season) => {
          defaultMap.set(String(season.id), season.number || 0)
        })
        setSeasonIdToNumber(defaultMap)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTeamAward() {
    try {
      // Get the season number from the ID
      const seasonId = newTeamAward.season_number
      let seasonNumber = seasonId

      // If it's a string (UUID), try to convert it to the corresponding number
      if (typeof seasonId === "string" && seasonIdToNumber.has(seasonId)) {
        seasonNumber = seasonIdToNumber.get(seasonId) || 1
      }

      const { data, error } = await supabase
        .from("team_awards")
        .insert([
          {
            team_id: newTeamAward.team_id,
            award_type: newTeamAward.award_type,
            season_number: seasonNumber,
            year: newTeamAward.year,
            description: newTeamAward.description || null,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Award created",
        description: "Team award has been created successfully",
      })

      setIsTeamDialogOpen(false)
      setNewTeamAward({
        team_id: "",
        award_type: "",
        season_number: 1,
        year: new Date().getFullYear(),
        description: "",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error creating award",
        description: error.message || "Failed to create team award",
        variant: "destructive",
      })
    }
  }

  async function handleCreatePlayerAward() {
    try {
      // Get the season number from the ID
      const seasonId = newPlayerAward.season_number
      let seasonNumber = seasonId

      // If it's a string (UUID), try to convert it to the corresponding number
      if (typeof seasonId === "string" && seasonIdToNumber.has(seasonId)) {
        seasonNumber = seasonIdToNumber.get(seasonId) || 1
      }

      const { data, error } = await supabase
        .from("player_awards")
        .insert([
          {
            player_id: newPlayerAward.player_id,
            award_type: newPlayerAward.award_type,
            season_number: seasonNumber,
            year: newPlayerAward.year,
            description: newPlayerAward.description || null,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Award created",
        description: "Player award has been created successfully",
      })

      setIsPlayerDialogOpen(false)
      setNewPlayerAward({
        player_id: "",
        award_type: "",
        season_number: 1,
        year: new Date().getFullYear(),
        description: "",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error creating award",
        description: error.message || "Failed to create player award",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteTeamAward(id: string) {
    try {
      const { error } = await supabase.from("team_awards").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Award deleted",
        description: "Team award has been deleted successfully",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error deleting award",
        description: error.message || "Failed to delete team award",
        variant: "destructive",
      })
    }
  }

  async function handleDeletePlayerAward(id: string) {
    try {
      const { error } = await supabase.from("player_awards").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Award deleted",
        description: "Player award has been deleted successfully",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error deleting award",
        description: error.message || "Failed to delete player award",
        variant: "destructive",
      })
    }
  }

  async function handleEditTeamAward() {
    if (!editingTeamAward) return

    try {
      // Get the season ID that was selected
      const seasonId = selectedTeamSeason

      // Convert season ID to season number using our mapping
      let seasonNumber = 1 // Default to 1 if not found

      if (seasonIdToNumber.has(seasonId)) {
        seasonNumber = seasonIdToNumber.get(seasonId) || 1
      }

      console.log(`Converting season ID ${seasonId} to season number ${seasonNumber}`)
      console.log(`Season mapping:`, Object.fromEntries(seasonIdToNumber))
      console.log(`Available seasons:`, seasons)

      const { error } = await supabase
        .from("team_awards")
        .update({
          team_id: editingTeamAward.team_id,
          award_type: editingTeamAward.award_type,
          season_number: seasonNumber,
          year: editingTeamAward.year,
          description: editingTeamAward.description || null,
        })
        .eq("id", editingTeamAward.id)

      if (error) throw error

      toast({
        title: "Award updated",
        description: "Team award has been updated successfully",
      })

      setIsEditTeamDialogOpen(false)
      setEditingTeamAward(null)
      setSelectedTeamSeason("1") // Reset to default
      fetchData()
    } catch (error: any) {
      console.error("Error updating award:", error)
      toast({
        title: "Error updating award",
        description: error.message || "Failed to update team award",
        variant: "destructive",
      })
    }
  }

  async function handleEditPlayerAward() {
    if (!editingPlayerAward) return

    try {
      // Get the season ID that was selected
      const seasonId = selectedPlayerSeason

      // Convert season ID to season number using our mapping
      let seasonNumber = 1 // Default to 1 if not found

      if (seasonIdToNumber.has(seasonId)) {
        seasonNumber = seasonIdToNumber.get(seasonId) || 1
      }

      console.log(`Converting season ID ${seasonId} to season number ${seasonNumber}`)
      console.log(`Season mapping:`, Object.fromEntries(seasonIdToNumber))
      console.log(`Available seasons:`, seasons)

      const { error } = await supabase
        .from("player_awards")
        .update({
          player_id: editingPlayerAward.player_id,
          award_type: editingPlayerAward.award_type,
          season_number: seasonNumber,
          year: editingPlayerAward.year,
          description: editingPlayerAward.description || null,
        })
        .eq("id", editingPlayerAward.id)

      if (error) throw error

      toast({
        title: "Award updated",
        description: "Player award has been updated successfully",
      })

      setIsEditPlayerDialogOpen(false)
      setEditingPlayerAward(null)
      setSelectedPlayerSeason("1") // Reset to default
      fetchData()
    } catch (error: any) {
      console.error("Error updating award:", error)
      toast({
        title: "Error updating award",
        description: error.message || "Failed to update player award",
        variant: "destructive",
      })
    }
  }

  // Function to get season name by ID
  const getSeasonName = (id: number | string): string => {
    // If id is a number (from the awards table)
    if (typeof id === "number") {
      // Find the season with matching number field
      const season = seasons.find((s) => s.number === id)
      return season ? season.name : `Season ${id}`
    }

    // If id is a string (UUID)
    const strId = String(id)
    const season = seasons.find((s) => String(s.id) === strId)
    return season ? season.name : `Unknown Season`
  }

  // Function to get season number from the ID
  const getSeasonNumber = (id: string): number => {
    return seasonIdToNumber.get(id) || 1
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Awards</h1>

      <Tabs defaultValue="team-awards">
        <TabsList className="mb-4">
          <TabsTrigger value="team-awards">Team Awards</TabsTrigger>
          <TabsTrigger value="player-awards">Player Awards</TabsTrigger>
        </TabsList>

        <TabsContent value="team-awards">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Awards</CardTitle>
                  <CardDescription>Manage team awards like President Trophy and MGHL Cup</CardDescription>
                </div>
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Team Award
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Award</DialogTitle>
                      <DialogDescription>Create a new team award for a specific season</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="team">Team</Label>
                        <Select
                          value={newTeamAward.team_id}
                          onValueChange={(value) => setNewTeamAward({ ...newTeamAward, team_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="award-type">Award Type</Label>
                        <Select
                          value={newTeamAward.award_type}
                          onValueChange={(value) => setNewTeamAward({ ...newTeamAward, award_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select award type" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamAwardTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="season">Season</Label>
                          <Select
                            value={String(newTeamAward.season_number)}
                            onValueChange={(value) => setNewTeamAward({ ...newTeamAward, season_number: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={season.id} value={String(season.id)}>
                                  {season.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="year">Year</Label>
                          <Input
                            type="number"
                            value={newTeamAward.year}
                            onChange={(e) =>
                              setNewTeamAward({
                                ...newTeamAward,
                                year: Number.parseInt(e.target.value, 10) || new Date().getFullYear(),
                              })
                            }
                            min={2000}
                            max={2100}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          value={newTeamAward.description}
                          onChange={(e) => setNewTeamAward({ ...newTeamAward, description: e.target.value })}
                          placeholder="Add details about this award"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTeamAward}>Create Award</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Team Award</DialogTitle>
                      <DialogDescription>Update the team award details</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="team">Team</Label>
                        <Select
                          value={editingTeamAward?.team_id || ""}
                          onValueChange={(value) =>
                            setEditingTeamAward((prev) => (prev ? { ...prev, team_id: value } : null))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="award-type">Award Type</Label>
                        <Select
                          value={editingTeamAward?.award_type || ""}
                          onValueChange={(value) =>
                            setEditingTeamAward((prev) => (prev ? { ...prev, award_type: value } : null))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select award type" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamAwardTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="season">Season</Label>
                        <div className="relative">
                          <Select
                            value={selectedTeamSeason}
                            onValueChange={(value) => {
                              console.log("Selected season value:", value)
                              setSelectedTeamSeason(value)
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select season">{getSeasonName(selectedTeamSeason)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={`season-${season.id}`} value={String(season.id)}>
                                  {season.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          type="number"
                          value={editingTeamAward?.year || ""}
                          onChange={(e) =>
                            setEditingTeamAward((prev) =>
                              prev
                                ? { ...prev, year: Number.parseInt(e.target.value, 10) || new Date().getFullYear() }
                                : null,
                            )
                          }
                          min={2000}
                          max={2100}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          value={editingTeamAward?.description || ""}
                          onChange={(e) =>
                            setEditingTeamAward((prev) => (prev ? { ...prev, description: e.target.value } : null))
                          }
                          placeholder="Add details about this award"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditTeamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditTeamAward}>Update Award</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamAwards.length > 0 ? (
                    teamAwards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {award.award_type === "MGHL Cup" ? (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <Medal className="h-5 w-5 text-blue-500" />
                            )}
                            {award.award_type}
                          </div>
                        </TableCell>
                        <TableCell>{award.team_name}</TableCell>
                        <TableCell>{getSeasonName(award.season_number)}</TableCell>
                        <TableCell>{award.year}</TableCell>
                        <TableCell>{award.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTeamAward(award)
                              // Find the season ID that corresponds to this season number
                              const season = seasons.find((s) => s.number === award.season_number)
                              if (season) {
                                setSelectedTeamSeason(String(season.id))
                              } else {
                                // Default to first season if not found
                                setSelectedTeamSeason(String(seasons[0]?.id || "1"))
                              }
                              setIsEditTeamDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTeamAward(award.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No team awards found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="player-awards">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Player Awards</CardTitle>
                  <CardDescription>Manage player awards like MVP and Rookie of the Year</CardDescription>
                </div>
                <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Player Award
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Player Award</DialogTitle>
                      <DialogDescription>Create a new player award for a specific season</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="player">Player</Label>
                        <Select
                          value={newPlayerAward.player_id}
                          onValueChange={(value) => setNewPlayerAward({ ...newPlayerAward, player_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.gamer_tag_id} {player.team_name ? `(${player.team_name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="award-type">Award Type</Label>
                        <Select
                          value={newPlayerAward.award_type}
                          onValueChange={(value) => setNewPlayerAward({ ...newPlayerAward, award_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select award type" />
                          </SelectTrigger>
                          <SelectContent>
                            {playerAwardTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="season">Season</Label>
                          <Select
                            value={String(newPlayerAward.season_number)}
                            onValueChange={(value) => setNewPlayerAward({ ...newPlayerAward, season_number: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={season.id} value={String(season.id)}>
                                  {season.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="year">Year</Label>
                          <Input
                            type="number"
                            value={newPlayerAward.year}
                            onChange={(e) =>
                              setNewPlayerAward({
                                ...newPlayerAward,
                                year: Number.parseInt(e.target.value, 10) || new Date().getFullYear(),
                              })
                            }
                            min={2000}
                            max={2100}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          value={newPlayerAward.description}
                          onChange={(e) => setNewPlayerAward({ ...newPlayerAward, description: e.target.value })}
                          placeholder="Add details about this award"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPlayerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePlayerAward}>Create Award</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isEditPlayerDialogOpen} onOpenChange={setIsEditPlayerDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Player Award</DialogTitle>
                      <DialogDescription>Update the player award details</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="player">Player</Label>
                        <Select
                          value={editingPlayerAward?.player_id || ""}
                          onValueChange={(value) =>
                            setEditingPlayerAward((prev) => (prev ? { ...prev, player_id: value } : null))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.gamer_tag_id} {player.team_name ? `(${player.team_name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="award-type">Award Type</Label>
                        <Select
                          value={editingPlayerAward?.award_type || ""}
                          onValueChange={(value) =>
                            setEditingPlayerAward((prev) => (prev ? { ...prev, award_type: value } : null))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select award type" />
                          </SelectTrigger>
                          <SelectContent>
                            {playerAwardTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="season">Season</Label>
                        <div className="relative">
                          <Select
                            value={selectedPlayerSeason}
                            onValueChange={(value) => {
                              console.log("Selected player season value:", value)
                              setSelectedPlayerSeason(value)
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select season">
                                {getSeasonName(selectedPlayerSeason)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={`player-season-${season.id}`} value={String(season.id)}>
                                  {season.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          type="number"
                          value={editingPlayerAward?.year || ""}
                          onChange={(e) =>
                            setEditingPlayerAward((prev) =>
                              prev
                                ? { ...prev, year: Number.parseInt(e.target.value, 10) || new Date().getFullYear() }
                                : null,
                            )
                          }
                          min={2000}
                          max={2100}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          value={editingPlayerAward?.description || ""}
                          onChange={(e) =>
                            setEditingPlayerAward((prev) => (prev ? { ...prev, description: e.target.value } : null))
                          }
                          placeholder="Add details about this award"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditPlayerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditPlayerAward}>Update Award</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerAwards.length > 0 ? (
                    playerAwards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Medal className="h-5 w-5 text-yellow-500" />
                            {award.award_type}
                          </div>
                        </TableCell>
                        <TableCell>{award.gamer_tag_id}</TableCell>
                        <TableCell>{getSeasonName(award.season_number)}</TableCell>
                        <TableCell>{award.year}</TableCell>
                        <TableCell>{award.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPlayerAward(award)
                              // Find the season ID that corresponds to this season number
                              const season = seasons.find((s) => s.number === award.season_number)
                              if (season) {
                                setSelectedPlayerSeason(String(season.id))
                              } else {
                                // Default to first season if not found
                                setSelectedPlayerSeason(String(seasons[0]?.id || "1"))
                              }
                              setIsEditPlayerDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlayerAward(award.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No player awards found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
