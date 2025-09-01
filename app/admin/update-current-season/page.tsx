"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Clock, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"

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
              <p className="text-white/70 mt-1">Change the active season for registrations and season-specific features</p>
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
                <Clock className="h-5 w-5 text-blue-400" />
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
                  <label className="text-sm font-medium text-white">Current Season</label>
                  <div className="p-3 border border-white/20 rounded-md bg-slate-800/50 text-white">
                    {getCurrentSeasonName()}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="season" className="text-sm font-medium text-white">
                    Select New Season
                  </label>
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
            </CardContent>
            <CardContent className="flex justify-end border-t border-white/20 bg-slate-800/30 px-6 py-4">
              <Button 
                onClick={handleUpdateSeason} 
                disabled={isUpdating || !selectedSeason} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Current Season"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Season Information */}
          {seasons.length > 0 && (
            <Card className="mt-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  Available Seasons
                </CardTitle>
                <CardDescription className="text-white/70">
                  All seasons in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {seasons.map((season) => (
                    <div 
                      key={season.id} 
                      className={`p-3 border rounded-md ${
                        season.id === currentSeason 
                          ? "border-blue-500/30 bg-blue-500/10" 
                          : "border-white/20 bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{season.name}</div>
                          <div className="text-sm text-white/70">ID: {season.id}</div>
                        </div>
                        {season.id === currentSeason && (
                          <div className="text-blue-400 text-sm font-medium">Current</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
