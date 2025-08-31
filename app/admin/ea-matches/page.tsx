"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Search, Activity, Gamepad2, Users } from "lucide-react"

export default function EAMatchesPage() {
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
        // Navigate to the first result's matches page
        router.push(`/admin/ea-matches/${data.clubs[0].clubId}`)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            EA Sports NHL Matches
          </h1>
          <p className="text-white/70 text-lg">
            View and manage EA Sports NHL match data for teams
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Search EA Teams
            </CardTitle>
            <CardDescription className="text-white/70">
              Search for EA Sports NHL teams by name to view their matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search EA team by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="max-w-md bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-white">{team.name}</CardTitle>
                <div className="text-blue-400">
                  <Activity className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-white/70">EA Club ID: {team.ea_club_id}</CardDescription>
                <Button
                  onClick={() => router.push(`/admin/ea-matches/${team.ea_club_id}`)}
                  variant="outline"
                  className="w-full bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                >
                  View Matches
                </Button>
              </CardContent>
            </Card>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-white/50" />
              <p className="text-white/70">
                No teams with EA Club IDs found. Add EA Club IDs to teams in the Team Management page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
