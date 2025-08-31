"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Loader2, 
  Search, 
  GamepadIcon as GameController,
  BarChart3,
  Database,
  Activity,
  Zap
} from "lucide-react"

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading EA Stats management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EA Sports NHL Stats
              </h1>
              <p className="text-white/70 mt-2">Manage and view EA Sports NHL team statistics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Search Section */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Search EA Teams</h3>
            </div>
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
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Teams with EA Club IDs
            </CardTitle>
            <CardDescription className="text-white/70">
              View and manage EA Sports NHL statistics for connected teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                    <Activity className="h-8 w-8 text-amber-400" />
                  </div>
                </div>
                <p className="text-white/50 mb-2">No teams with EA Club IDs found</p>
                <p className="text-white/30 text-sm">
                  Add EA Club IDs to teams in the Team Management page to view their statistics here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <Card 
                    key={team.id} 
                    className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 group hover:scale-105"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg text-white">{team.name}</CardTitle>
                      <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <GameController className="h-5 w-5 text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-white/70 text-sm mb-2">EA Club ID:</p>
                        <p className="text-white font-mono text-sm bg-slate-800/50 px-2 py-1 rounded border border-white/10">
                          {team.ea_club_id}
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/admin/ea-stats/${team.ea_club_id}`)}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10 group/btn"
                      >
                        <Zap className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                        View Stats
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
