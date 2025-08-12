"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Brain, Zap, TrendingUp } from "lucide-react"
import DailyRecapDisplay from "@/components/shared/daily-recap-display"

interface RecapData {
  date: string
  team_recaps: any[]
  best_team: any
  worst_team: any
  total_matches: number
  time_window_hours?: number
  generation_timestamp?: number
}

export default function DailyRecap() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [recapData, setRecapData] = useState<RecapData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const generateRecap = async (hoursBack = 24) => {
    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      console.log(`🧠 Starting intelligent recap generation for ${hoursBack} hours...`)

      const response = await fetch(`/api/admin/daily-recap?hours=${hoursBack}&t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Ensure fresh data
      })

      if (!response.ok) {
        throw new Error(`Failed to generate recap: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setRecapData(result.data)

        // Count intelligent features
        const totalPlayers = result.data.team_recaps.reduce(
          (sum: number, team: any) => sum + team.all_players.length,
          0,
        )
        const totalPlayerSummaries = result.data.team_recaps.reduce(
          (sum: number, team: any) => sum + Object.keys(team.player_summaries || {}).length,
          0,
        )

        setSuccess(
          `🧠 Intelligent daily recap generated successfully! Found ${result.data.total_matches} matches from the last ${result.data.time_window_hours} hours. Generated AI-powered analysis for ${result.data.team_recaps.length} teams and ${totalPlayerSummaries}/${totalPlayers} players.`,
        )
      } else {
        throw new Error(result.error || "Failed to generate recap")
      }
    } catch (err: any) {
      console.error("Error generating recap:", err)
      setError(err.message || "Failed to generate daily recap")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveRecap = async () => {
    if (!recapData) {
      setError("No recap data to save")
      return
    }

    // Validate recap data before saving
    if (!recapData.team_recaps || !Array.isArray(recapData.team_recaps)) {
      setError("Invalid recap data: missing team recaps")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const timeWindow = recapData.time_window_hours || 24
      console.log("💾 Saving recap data:", {
        date: recapData.date,
        timeWindow: timeWindow,
        teamCount: recapData.team_recaps.length,
        totalMatches: recapData.total_matches,
      })

      const response = await fetch("/api/daily-recap/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: recapData.date,
          recap_data: recapData,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Save response error:", response.status, errorText)
        throw new Error(`Failed to save recap: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("💾 Save result:", result)

      if (result.success) {
        // Verify the save worked by fetching it back
        console.log("🔍 Verifying save by fetching saved recap...")

        const verifyResponse = await fetch(`/api/daily-recap/saved?refresh=true&t=${Date.now()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json()
          if (verifyResult.success && verifyResult.data) {
            const savedTimeWindow = verifyResult.data.time_window_hours || 24
            console.log("✅ Verification successful - recap is properly saved with time window:", savedTimeWindow)
            setSuccess(
              `✅ ${timeWindow}-hour recap saved and verified successfully! It is now live on the public page (/news/daily-recap) showing exactly the ${timeWindow}-hour analysis you generated. Last updated: ${new Date().toLocaleString()}`,
            )
          } else {
            console.warn("⚠️ Save succeeded but verification failed:", verifyResult)
            setSuccess(
              "✅ Daily recap saved successfully, but verification had issues. Please check the public page to confirm.",
            )
          }
        } else {
          console.warn("⚠️ Save succeeded but verification request failed")
          setSuccess(`✅ ${timeWindow}-hour daily recap saved successfully! It should now appear on the public page.`)
        }
      } else {
        throw new Error(result.error || "Failed to save recap")
      }
    } catch (err: any) {
      console.error("❌ Error saving recap:", err)
      setError(err.message || "Failed to save daily recap")
    } finally {
      setIsSaving(false)
    }
  }

  const loadSavedRecap = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/daily-recap/saved", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load saved recap: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setRecapData(result.data)
        setSuccess("📖 Loaded most recent saved recap with intelligent analysis")
      } else {
        setError("No saved recap found")
      }
    } catch (err: any) {
      console.error("Error loading saved recap:", err)
      setError(err.message || "Failed to load saved recap")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Intelligent Daily Recap Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive AI-powered analysis of recent matches and team performances with unique player
            insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button
              onClick={() => generateRecap(24)}
              disabled={isGenerating || isSaving}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate (24h)
                </>
              )}
            </Button>

            <Button
              onClick={() => generateRecap(48)}
              disabled={isGenerating || isSaving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Generate (48h)
            </Button>

            <Button
              onClick={() => generateRecap(72)}
              disabled={isGenerating || isSaving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Generate (72h)
            </Button>

            <Button onClick={loadSavedRecap} disabled={isGenerating || isSaving} variant="secondary">
              Load Saved
            </Button>
          </div>

          {recapData && (
            <div className="flex gap-2">
              <Button
                onClick={saveRecap}
                disabled={isGenerating || isSaving}
                variant="default"
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Database
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {recapData && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-sm">Intelligent Analysis Generated</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Date:</strong> {recapData.date}
                </div>
                <div>
                  <strong>Time Window:</strong> {recapData.time_window_hours || 24}h
                </div>
                <div>
                  <strong>Teams:</strong> {recapData.team_recaps.length}
                </div>
                <div>
                  <strong>Matches:</strong> {recapData.total_matches}
                </div>
              </div>
              {recapData.generation_timestamp && (
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>Generated:</strong> {new Date(recapData.generation_timestamp).toLocaleString()}
                </div>
              )}

              {/* AI Features Summary */}
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI-Powered Features</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Performance Level Analysis
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Game Trend Detection
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Team Impact Correlation
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Situational Analysis
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Role Context Assessment
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    Unique Player Insights
                  </div>
                </div>
              </div>

              {!success?.includes("saved") && (
                <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-300">
                  ⚠️ This intelligent recap has not been saved yet. Click "Save to Database" to make it available on the
                  public page.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {recapData && (
        <div className="space-y-6">
          <DailyRecapDisplay recapData={recapData} showFullRoster={true} />
        </div>
      )}
    </div>
  )
}
