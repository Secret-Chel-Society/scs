"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle, Clock, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

interface Season {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export default function UpdateCurrentSeasonPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeason, setCurrentSeason] = useState<number>(1)
  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Check if user is admin and load seasons
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
        setLoading(true)

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

        // Load seasons from system_settings
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "seasons")
          .single()

        if (seasonsError) throw seasonsError

        // Get current season from system_settings
        const { data: currentSeasonData, error: currentSeasonError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (currentSeasonError) throw currentSeasonError

        const seasonsArray = seasonsData?.value || []
        const currentSeasonId = currentSeasonData?.value || 1

        setSeasons(seasonsArray)
        setCurrentSeason(currentSeasonId)
      } catch (error: any) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  // Handle updating current season
  const handleUpdateSeason = async () => {
    try {
      setUpdating(true)
      setUpdateSuccess(false)

      // Update the current season in system_settings
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "current_season",
          value: currentSeason,
        })

      if (error) throw error

      setUpdateSuccess(true)
      toast({
        title: "Season updated",
        description: `Current season has been updated to Season ${currentSeason}`,
      })
    } catch (error: any) {
      console.error("Error updating season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update current season",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading season management...</p>
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
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Update Current Season
              </h1>
              <p className="text-white/70 mt-1">Set the active season for the system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Season Settings
              </CardTitle>
              <CardDescription className="text-white/70">
                Update the current active season for the league
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {updateSuccess && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertTitle className="text-green-400">Season Updated</AlertTitle>
                  <AlertDescription className="text-green-300">
                    The current season has been successfully updated to Season {currentSeason}.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-white font-medium">Current Season</label>
                <div className="p-3 border border-white/20 rounded-md bg-slate-800/50 text-white">
                  Season {currentSeason}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">Select New Season</label>
                <Select value={currentSeason.toString()} onValueChange={(value) => setCurrentSeason(Number.parseInt(value))}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id.toString()} className="text-white hover:bg-slate-700">
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpdateSeason} 
                disabled={updating}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Current Season"}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Available Seasons</CardTitle>
              <CardDescription className="text-white/70">
                All seasons configured in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {seasons.map((season) => (
                  <div key={season.id} className="flex items-center justify-between p-3 border border-white/20 rounded-md bg-slate-800/50">
                    <span className="text-white">{season.name}</span>
                    {season.is_active && (
                      <span className="text-green-400 text-sm">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

