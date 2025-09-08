"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Search, GamepadIcon as GameController } from "lucide-react"

export default function EAStatsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

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
            description: "You don't have permission to access this page.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        loadTeams()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase.from("teams").select("*").order("name").not("ea_club_id", "is", null)

      if (error) {
        throw error
      }

      setTeams(data || [])
    } catch (error: any) {
      console.error("Error loading teams:", error)
      toast({
        title: "Error",
        description: "Failed to load teams with EA Club IDs",
        variant: "destructive",
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/ea/search-teams?clubName=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error("Failed to search EA teams")
      }

      const data = await response.json()

      if (data.clubs && data.clubs.length > 0) {
        // Navigate to the first result's stats page
        router.push(`/admin/ea-stats/${data.clubs[0].clubId}`)
      } else {
        toast({
          title: "No teams found",
          description: "No EA teams found with that name",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error searching EA teams:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while searching",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">EA Sports NHL Stats</h1>

      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search EA team by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <div className="text-primary">
                <GameController className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">EA Club ID: {team.ea_club_id}</CardDescription>
              <Button
                onClick={() => router.push(`/admin/ea-stats/${team.ea_club_id}`)}
                variant="outline"
                className="w-full"
              >
                View Stats
              </Button>
            </CardContent>
          </Card>
        ))}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              No teams with EA Club IDs found. Add EA Club IDs to teams in the Team Management page.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
