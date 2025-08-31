"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Calendar, Settings, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function UpdateCurrentSeasonPage() {
  const { supabase } = useSupabase()
  const [seasons, setSeasons] = useState<any[]>([])
  const [currentSeason, setCurrentSeason] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false })

        if (seasonsError) {
          throw new Error(`Error fetching seasons: ${seasonsError.message}`)
        }

        setSeasons(seasonsData || [])

        // Fetch current season setting
        const { data: settingData, error: settingError } = await supabase
          .from("system_settings")
          .select("*")
          .eq("key", "current_season")
          .single()

        if (settingError && !settingError.message.includes("No rows found")) {
          throw new Error(`Error fetching current season: ${settingError.message}`)
        }

        if (settingData) {
          setCurrentSeason(settingData.value)
          setSelectedSeason(settingData.value)
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "An error occurred while fetching data")
        toast({
          title: "Error",
          description: error.message || "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, toast])

  const handleUpdateSeason = async () => {
    if (!selectedSeason) {
      setError("Please select a season")
      return
    }

    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase.from("system_settings").upsert(
        {
          key: "current_season",
          value: selectedSeason,
        },
        { onConflict: "key" },
      )

      if (updateError) {
        throw new Error(`Error updating season: ${updateError.message}`)
      }

      setCurrentSeason(selectedSeason)
      setSuccess("Current season updated successfully")
      toast({
        title: "Success",
        description: "Current season updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating season:", error)
      setError(error.message || "An error occurred while updating the season")
      toast({
        title: "Error",
        description: error.message || "Failed to update season",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getCurrentSeasonName = () => {
    const season = seasons.find((s) => s.id === currentSeason)
    return season ? `${season.name} (${season.id})` : "Unknown"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-400" />
            Update Current Season
          </h1>
          <p className="text-white/70 text-lg">
            Manage the current season for player registrations and season-specific features
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Current Season Management
            </CardTitle>
            <CardDescription className="text-white/70">
              The current season is used for player registrations and other season-specific features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-400">Error</AlertTitle>
                <AlertDescription className="text-red-300/80">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertTitle className="text-green-400">Success</AlertTitle>
                <AlertDescription className="text-green-300/80">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Current Season</Label>
                <div className="p-3 border border-white/20 rounded-md bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Active
                    </Badge>
                    <span className="text-white font-medium">{getCurrentSeasonName()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="text-white">Select New Season</Label>
                <Select value={selectedSeason || ""} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id} className="text-white hover:bg-slate-700">
                        {season.name} ({season.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {seasons.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Available Seasons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seasons.map((season) => (
                    <div 
                      key={season.id} 
                      className={`p-3 rounded-lg border transition-colors ${
                        season.id === currentSeason 
                          ? 'bg-blue-500/20 border-blue-500/30' 
                          : 'bg-slate-800/30 border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{season.name}</div>
                          <div className="text-white/70 text-sm">ID: {season.id}</div>
                        </div>
                        {season.id === currentSeason && (
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpdateSeason} 
              disabled={isUpdating || !selectedSeason} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Current Season
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6">
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Important</AlertTitle>
            <AlertDescription className="text-amber-300/80">
              Changing the current season will affect player registrations, match scheduling, and other season-specific features. 
              Make sure this is the correct season before updating.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
