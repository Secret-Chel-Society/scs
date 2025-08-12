"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase/client"

export function UpdateCurrentSeason() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [currentSetting, setCurrentSetting] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch all seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name, season_number, is_active")
          .order("created_at", { ascending: false })

        if (seasonsError) {
          throw new Error(`Error fetching seasons: ${seasonsError.message}`)
        }

        setSeasons(seasonsData || [])

        // Fetch current season setting
        const { data: settingData, error: settingError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "current_season")
          .single()

        if (settingError && settingError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is fine
          throw new Error(`Error fetching current season setting: ${settingError.message}`)
        }

        const currentSeasonId = settingData?.value || null
        setCurrentSetting(currentSeasonId)

        // If we have a current season, select it in the dropdown
        if (currentSeasonId && seasonsData) {
          const matchingSeason = seasonsData.find((s) => s.id === currentSeasonId)
          if (matchingSeason) {
            setSelectedSeasonId(currentSeasonId)
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "An error occurred")
        toast({
          title: "Error",
          description: error.message || "Failed to load seasons",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, toast])

  const handleUpdate = async () => {
    if (!selectedSeasonId) {
      setError("Please select a season")
      return
    }

    setIsUpdating(true)
    setError(null)
    setResult(null)

    try {
      // Check if setting exists
      const { data: existingSetting, error: checkError } = await supabase
        .from("system_settings")
        .select("id")
        .eq("key", "current_season")
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(`Error checking setting: ${checkError.message}`)
      }

      let updateResult

      if (existingSetting) {
        // Update existing setting
        const { data, error: updateError } = await supabase
          .from("system_settings")
          .update({ value: selectedSeasonId })
          .eq("key", "current_season")
          .select()

        if (updateError) {
          throw new Error(`Error updating setting: ${updateError.message}`)
        }

        updateResult = data
      } else {
        // Insert new setting
        const { data, error: insertError } = await supabase
          .from("system_settings")
          .insert({ key: "current_season", value: selectedSeasonId })
          .select()

        if (insertError) {
          throw new Error(`Error inserting setting: ${insertError.message}`)
        }

        updateResult = data
      }

      setCurrentSetting(selectedSeasonId)
      setResult({
        success: true,
        message: "Current season updated successfully",
        data: updateResult,
      })

      toast({
        title: "Success",
        description: "Current season updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating current season:", error)
      setError(error.message || "An error occurred")
      toast({
        title: "Error",
        description: error.message || "Failed to update current season",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Current Season</CardTitle>
        <CardDescription>Set the active season for player registrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Current Season Setting:</label>
            <span className="text-sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : currentSetting ? (
                <>{seasons.find((s) => s.id === currentSetting)?.name || currentSetting}</>
              ) : (
                "Not set"
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="seasonSelect" className="text-sm font-medium">
            Select Season
          </label>
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger id="seasonSelect" disabled={isLoading}>
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} {season.is_active ? "(Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpdate} disabled={isUpdating || !selectedSeasonId} className="w-full">
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
  )
}
