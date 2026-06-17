"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Team {
  id: string
  name: string
  Division: string | null
  Conference: string | null
}

const NHL_CONFERENCES = ["SCS ICE", "SCS FIRE"]
const AHL_CONFERENCES = ["SCS EAST", "SCS WEST"]
const DIVISIONS = ["ATLANTIC", "PACIFIC", "METRO", "CENTRAL"]

export default function DivisionsConferencesPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [nhlTeams, setNhlTeams] = useState<Team[]>([])
  const [ahlTeams, setAhlTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAuthAndLoadData() {
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
        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        await loadTeams()
      } catch (error: any) {
        console.error("Setup error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred during setup",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  const loadTeams = async () => {
    try {
      // Load NHL teams
      const { data: nhlData, error: nhlError } = await supabase
        .from("teams")
        .select("id, name, Division, Conference")
        .order("name")

      if (nhlError) throw nhlError
      setNhlTeams(nhlData || [])

      // Load AHL teams
      const { data: ahlData, error: ahlError } = await supabase
        .from("teams_ahl")
        .select("id, name, Division, Conference")
        .order("name")

      if (ahlError) throw ahlError
      setAhlTeams(ahlData || [])
    } catch (error: any) {
      console.error("Error loading teams:", error)
      toast({
        title: "Error loading teams",
        description: error.message || "Failed to load teams data.",
        variant: "destructive",
      })
    }
  }

  const updateNHLTeam = (teamId: string, field: "Division" | "Conference", value: string) => {
    setNhlTeams((teams) => teams.map((team) => (team.id === teamId ? { ...team, [field]: value } : team)))
  }

  const updateAHLTeam = (teamId: string, field: "Division" | "Conference", value: string) => {
    setAhlTeams((teams) => teams.map((team) => (team.id === teamId ? { ...team, [field]: value } : team)))
  }

  const saveNHLChanges = async () => {
    try {
      setSaving(true)

      // Update each team
      for (const team of nhlTeams) {
        const { error } = await supabase
          .from("teams")
          .update({
            Division: team.Division,
            Conference: team.Conference,
          })
          .eq("id", team.id)

        if (error) throw error
      }

      toast({
        title: "Changes saved",
        description: "NHL team divisions and conferences have been updated.",
      })
    } catch (error: any) {
      console.error("Error saving NHL changes:", error)
      toast({
        title: "Error saving changes",
        description: error.message || "Failed to save changes.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveAHLChanges = async () => {
    try {
      setSaving(true)

      // Update each team
      for (const team of ahlTeams) {
        const { error } = await supabase
          .from("teams_ahl")
          .update({
            Division: team.Division,
            Conference: team.Conference,
          })
          .eq("id", team.id)

        if (error) throw error
      }

      toast({
        title: "Changes saved",
        description: "AHL team divisions and conferences have been updated.",
      })
    } catch (error: any) {
      console.error("Error saving AHL changes:", error)
      toast({
        title: "Error saving changes",
        description: error.message || "Failed to save changes.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Divisions & Conferences Management</h1>
        <p className="text-muted-foreground">Manage team divisions and conferences for NHL and AHL</p>
      </div>

      <Tabs defaultValue="nhl" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nhl">NHL Teams</TabsTrigger>
          <TabsTrigger value="ahl">AHL Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="nhl">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>NHL Teams</CardTitle>
                  <CardDescription>
                    Assign divisions and conferences to NHL teams
                    <br />
                    <span className="text-xs">
                      Conferences: SCS ICE, SCS FIRE | Divisions: ATLANTIC, PACIFIC, METRO, CENTRAL
                    </span>
                  </CardDescription>
                </div>
                <Button onClick={saveNHLChanges} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Conference</TableHead>
                      <TableHead>Division</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nhlTeams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No NHL teams found
                        </TableCell>
                      </TableRow>
                    ) : (
                      nhlTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <Select
                              value={team.Conference || ""}
                              onValueChange={(value) => updateNHLTeam(team.id, "Conference", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select conference" />
                              </SelectTrigger>
                              <SelectContent>
                                {NHL_CONFERENCES.map((conf) => (
                                  <SelectItem key={conf} value={conf}>
                                    {conf}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={team.Division || ""}
                              onValueChange={(value) => updateNHLTeam(team.id, "Division", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                              <SelectContent>
                                {DIVISIONS.map((div) => (
                                  <SelectItem key={div} value={div}>
                                    {div}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ahl">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AHL Teams</CardTitle>
                  <CardDescription>
                    Assign divisions and conferences to AHL teams
                    <br />
                    <span className="text-xs">
                      Conferences: MGAHL EAST, MGAHL WEST | Divisions: ATLANTIC, PACIFIC, METRO, CENTRAL
                    </span>
                  </CardDescription>
                </div>
                <Button onClick={saveAHLChanges} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Conference</TableHead>
                      <TableHead>Division</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ahlTeams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No AHL teams found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ahlTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <Select
                              value={team.Conference || ""}
                              onValueChange={(value) => updateAHLTeam(team.id, "Conference", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select conference" />
                              </SelectTrigger>
                              <SelectContent>
                                {AHL_CONFERENCES.map((conf) => (
                                  <SelectItem key={conf} value={conf}>
                                    {conf}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={team.Division || ""}
                              onValueChange={(value) => updateAHLTeam(team.id, "Division", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                              <SelectContent>
                                {DIVISIONS.map((div) => (
                                  <SelectItem key={div} value={div}>
                                    {div}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
