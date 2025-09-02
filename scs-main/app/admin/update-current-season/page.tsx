"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Update Current Season</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Current Season</CardTitle>
          <CardDescription>
            The current season is used for player registrations and other season-specific features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Season</label>
            <div className="p-2 border rounded-md bg-muted/50">{getCurrentSeasonName()}</div>
          </div>

          <div className="space-y-2">
            <label htmlFor="season" className="text-sm font-medium">
              Select New Season
            </label>
            <Select value={selectedSeason || ""} onValueChange={setSelectedSeason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} ({season.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateSeason} disabled={isUpdating || !selectedSeason} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Current Season"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
