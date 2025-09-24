"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, AlertCircle, Check, Search, RefreshCw, Info, FileText, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { combineEaMatches } from "@/lib/ea-match-combiner"
import { debugEaMatchCombination } from "@/lib/debug-ea-match-combination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface EaMatchImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any
  teamId?: string
  eaClubId?: string | null
  homeTeamEaClubId?: string | null
  awayTeamEaClubId?: string | null
  onImportSuccess?: () => void
}

export function EaMatchImportModal({
  open,
  onOpenChange,
  match,
  teamId,
  eaClubId,
  homeTeamEaClubId,
  awayTeamEaClubId,
  onImportSuccess,
}: EaMatchImportModalProps) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [eaMatchId, setEaMatchId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [loadingRecentMatches, setLoadingRecentMatches] = useState(false)
  const [selectedMatches, setSelectedMatches] = useState<string[]>([])
  const [matchesData, setMatchesData] = useState<any[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle")
  const [fetchingMatchDetails, setFetchingMatchDetails] = useState(false)
  const [currentMatchDetailIndex, setCurrentMatchDetailIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("auto")
  const [manualJsonData, setManualJsonData] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)
  const [columnMissing, setColumnMissing] = useState(false)
  const [checkingColumn, setCheckingColumn] = useState(false)

  // Check if this is a combined match request
  const isCombinedRequest = selectedMatches && selectedMatches.length > 1

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setEaMatchId("")
      setError(null)
      setSuccess(false)
      setSelectedMatches([])
      setMatchesData([])
      setRetryCount(0)
      setApiStatus("idle")
      setFetchingMatchDetails(false)
      setCurrentMatchDetailIndex(0)
      setManualJsonData("")
      setJsonError(null)
      setFileUploadError(null)
      setColumnMissing(false)
      setCheckingColumn(false)

      console.log("Modal opened, checking EA API status")
      checkEaApiStatus()

      console.log("Modal opened, fetching recent matches")
      console.log("Home team EA club ID:", homeTeamEaClubId)
      console.log("Away team EA club ID:", awayTeamEaClubId)

      // Check if the column exists - but don't block other operations
      checkEaMatchDataColumn()

      // Only fetch matches if we have at least one club ID
      if (homeTeamEaClubId || awayTeamEaClubId) {
        fetchRecentMatches()
      }
    }
  }, [open, homeTeamEaClubId, awayTeamEaClubId, match, session])

  // Update the checkEaMatchDataColumn function to handle errors better
  const checkEaMatchDataColumn = async () => {
    try {
      setCheckingColumn(true)

      // First, try a direct approach using the Supabase client
      try {
        // Try to select the column directly from the matches table
        const { error } = await supabase.from("matches").select("ea_match_data").limit(1)

        // If there's no error, the column exists
        if (!error) {
          setColumnMissing(false)
          return true
        }

        // If the error message indicates the column doesn't exist
        if (error.message && error.message.includes("does not exist")) {
          setColumnMissing(true)
          return false
        }

        // For other errors, try the API approach
        console.log("Direct column check failed:", error)
      } catch (e) {
        console.log("Error in direct column check:", e)
      }

      // Fallback to the API approach
      const response = await fetch("/api/admin/check-column-exists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: "matches",
          column: "ea_match_data",
        }),
      })

      if (!response.ok) {
        console.error("Failed to check column existence:", response.statusText)
        // Assume column is missing if we can't check
        setColumnMissing(true)
        return false
      }

      const data = await response.json()
      setColumnMissing(!data.exists)

      return data.exists
    } catch (err: any) {
      console.error("Error checking column:", err)
      // Assume column is missing if we can't check
      setColumnMissing(true)
      return false
    } finally {
      setCheckingColumn(false)
    }
  }

  const checkEaApiStatus = async () => {
    try {
      setApiStatus("checking")

      // Use our proxy API to check EA API status
      console.log("Checking EA API status via proxy")
      const response = await fetch("/api/ea/check-status", {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        if (data.available) {
          console.log("EA API is available")
          setApiStatus("available")
        } else {
          console.log("EA API is unavailable:", data.message)
          setApiStatus("unavailable")
          // Switch to manual tab if API is unavailable
          setActiveTab("manual")
        }
      } else {
        console.log("EA API status check failed:", response.statusText)
        setApiStatus("unavailable")
        // Switch to manual tab if API is unavailable
        setActiveTab("manual")
      }
    } catch (error: any) {
      console.error("EA API check failed:", error)
      setApiStatus("unavailable")
      // Switch to manual tab if API is unavailable
      setActiveTab("manual")
    }
  }

  const fetchRecentMatches = async () => {
    // Allow fetching with just one club ID
    if (!homeTeamEaClubId && !awayTeamEaClubId) {
      setError("No EA club IDs available for either team")
      return
    }

    try {
      setLoadingRecentMatches(true)
      setError(null)

      // Use both club IDs if available
      const homeClubId = homeTeamEaClubId || ""
      const awayClubId = awayTeamEaClubId || ""

      console.log("Fetching recent matches for home club ID:", homeClubId)
      console.log("Fetching recent matches for away club ID:", awayClubId)

      // Fetch recent matches for both clubs
      const url = `/api/ea/past-matches?homeClubId=${homeClubId}&awayClubId=${awayClubId}&limit=10` // Increased limit
      console.log("Fetching from URL:", url)

      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
      }

      if (!response.ok) {
        let errorText
        try {
          // Try to get the error as JSON first
          const errorData = await response.json()
          errorText = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`
        } catch (e) {
          // If not JSON, get as text
          try {
            errorText = await response.text()
            // Limit the error text length
            if (errorText.length > 100) {
              errorText = errorText.substring(0, 100) + "..."
            }
          } catch (textError) {
            errorText = `Error ${response.status}: ${response.statusText}`
          }
        }

        console.error(`Error response from past-matches API: ${errorText}`)

        // If we get a 502 or 504, the EA API is likely down
        if (response.status === 502 || response.status === 504) {
          setApiStatus("unavailable")
          setActiveTab("manual")
          throw new Error(`EA API appears to be unavailable (${response.status}). Please try the manual import option.`)
        }

        throw new Error(`Failed to fetch recent matches: ${errorText}`)
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`Received non-JSON response: ${text.substring(0, 100)}...`)
        throw new Error(`Expected JSON response but got: ${contentType || "unknown content type"}`)
      }

      const data = await response.json()
      console.log("Recent matches response:", data)

      // Check if we got an array of matches or an object with a message
      if (Array.isArray(data)) {
        // Remove duplicates by match ID
        const uniqueMatches = Array.from(new Map(data.map((match) => [match.matchId, match])).values())

        setRecentMatches(uniqueMatches)
        if (uniqueMatches.length === 0) {
          // More informative error message
          if (homeTeamEaClubId && awayTeamEaClubId) {
            setError(
              `No recent matches found between team IDs ${homeTeamEaClubId} and ${awayTeamEaClubId}. Try using the manual match ID option.`,
            )
          } else if (homeTeamEaClubId) {
            setError(`No recent matches found for team ID ${homeTeamEaClubId}. Try using the manual match ID option.`)
          } else if (awayTeamEaClubId) {
            setError(`No recent matches found for team ID ${awayTeamEaClubId}. Try using the manual match ID option.`)
          } else {
            setError("No recent matches found. Try using the manual match ID option.")
          }
        }
      } else if (data.message) {
        // We got a message from the API
        setRecentMatches([])
        setError(data.message)
      } else {
        setRecentMatches([])
        setError("Invalid response format from the EA API")
      }
    } catch (err: any) {
      console.error("Error fetching recent matches:", err)

      // Increment retry count
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)

      // Check if the error message indicates the EA API is down or rate limited
      if (err.message.includes("EA API appears to be unavailable") || err.message.includes("Rate limited")) {
        setError(err.message)
        setApiStatus("unavailable")
        setActiveTab("manual")
        return
      }

      // If we've tried less than 3 times, try again
      if (newRetryCount < 3) {
        setError(`Failed to fetch matches (attempt ${newRetryCount}). Retrying...`)

        // Wait a bit before retrying
        setTimeout(
          () => {
            fetchRecentMatches()
          },
          2000 * Math.pow(2, newRetryCount - 1),
        ) // Exponential backoff
      } else {
        setError(
          `Failed to fetch recent matches after ${newRetryCount} attempts. Please try again later or use the manual import options.`,
        )

        // If we've failed multiple times, suggest using the manual tab
        setActiveTab("manual")
      }
    } finally {
      setLoadingRecentMatches(false)
    }
  }

  const handleMatchSelect = (matchId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedMatches((prev) => [...prev, matchId])
    } else {
      setSelectedMatches((prev) => prev.filter((id) => id !== matchId))
    }
  }

  const fetchMatchDetails = async (matchId: string, retryCount = 0) => {
    try {
      console.log(`Fetching details for match ${matchId} (attempt ${retryCount + 1})`)

      // Pass both club IDs to help the API find the match
      const params = new URLSearchParams({
        matchId,
        homeClubId: homeTeamEaClubId || "",
        awayClubId: awayTeamEaClubId || "",
      })

      // First try direct fetch
      try {
        const directUrl = `/api/ea/match-details?${params}`
        console.log(`Trying direct fetch from: ${directUrl}`)

        const response = await fetch(directUrl, {
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        // Handle rate limiting specifically
        if (response.status === 429) {
          throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
        }

        if (!response.ok) {
          console.log(`Direct fetch failed with status: ${response.status}`)

          // If we get a 404, the match might not exist - don't retry
          if (response.status === 404) {
            const errorData = await response.json()
            const errorMessage =
              errorData?.message || `Match ID ${matchId} not found in EA database. Please verify the match ID.`
            throw new Error(errorMessage)
          }

          throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`)
        }

        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error(`Received non-JSON response: ${text.substring(0, 100)}...`)
          throw new Error(`Expected JSON response but got: ${contentType || "unknown content type"}`)
        }

        const data = await response.json()
        console.log(`Successfully fetched details for match ${matchId} via direct fetch`)

        return data
      } catch (directError: any) {
        console.error(`Direct fetch failed for match ${matchId}:`, directError)

        // If this is a 404 or "not found" error, don't try the proxy - just throw the error
        if (directError.message.includes("404") || directError.message.includes("not found")) {
          throw directError
        }

        // If this is a rate limiting error, don't try the proxy - just throw the error
        if (directError.message.includes("Rate limited")) {
          throw directError
        }

        // Fall through to try the fallback approach
      }

      // Fallback: Try using the EA proxy endpoint directly
      try {
        const eaApiUrl = `https://proclubs.ea.com/api/nhl/match/details?matchId=${matchId}&platform=common-gen5&matchType=club_private`
        const proxyUrl = `/api/ea/proxy?url=${encodeURIComponent(eaApiUrl)}`

        console.log(`Trying proxy fetch from: ${proxyUrl}`)

        const proxyResponse = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        // Handle rate limiting specifically
        if (proxyResponse.status === 429) {
          throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
        }

        if (!proxyResponse.ok) {
          console.log(`Proxy fetch failed with status: ${proxyResponse.status}`)

          // If we get a 404, the match might not exist - don't retry
          if (proxyResponse.status === 404) {
            throw new Error(`Match ID ${matchId} not found in EA database. Please verify the match ID.`)
          }

          throw new Error(`Proxy fetch failed: ${proxyResponse.status} ${proxyResponse.statusText}`)
        }

        // Check content type to ensure we're getting JSON
        const contentType = proxyResponse.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await proxyResponse.text()
          console.error(`Received non-JSON response from proxy: ${text.substring(0, 100)}...`)
          throw new Error(`Expected JSON response but got: ${contentType || "unknown content type"}`)
        }

        const proxyData = await proxyResponse.json()
        console.log(`Successfully fetched details for match ${matchId} via proxy`)

        return proxyData
      } catch (proxyError: any) {
        console.error(`Proxy fetch failed for match ${matchId}:`, proxyError)

        // If this is a 404 error or "not found" error, we should not retry
        if (proxyError.message.includes("404") || proxyError.message.includes("not found")) {
          throw proxyError
        }

        // If this is a rate limiting error, we should not retry
        if (proxyError.message.includes("Rate limited")) {
          throw proxyError
        }

        // For other errors, we can retry if we haven't exceeded the retry limit
        if (retryCount < 2) {
          console.log(`Retrying fetch for match ${matchId} (attempt ${retryCount + 2})`)
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, retryCount)))
          return fetchMatchDetails(matchId, retryCount + 1)
        }

        throw proxyError
      }
    } catch (error: any) {
      console.error(`Error fetching details for match ${matchId}:`, error)

      // Check if the error message indicates the EA API is down or rate limited
      if (error.message.includes("EA API appears to be unavailable") || error.message.includes("Rate limited")) {
        setApiStatus("unavailable")
        setActiveTab("manual")
        throw error
      }

      // If we've tried less than 3 times and it's not a 404 error or rate limiting, try again
      if (
        retryCount < 2 &&
        !error.message.includes("404") &&
        !error.message.includes("not found") &&
        !error.message.includes("Rate limited")
      ) {
        console.log(`Retrying fetch for match ${matchId} (attempt ${retryCount + 2})`)
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, retryCount)))
        return fetchMatchDetails(matchId, retryCount + 1)
      }

      throw error
    }
  }

  const fetchAllMatchDetails = async (matchIds: string[]) => {
    setFetchingMatchDetails(true)
    setCurrentMatchDetailIndex(0)

    const results: any[] = []
    const errors: { matchId: string; error: any }[] = []

    for (let i = 0; i < matchIds.length; i++) {
      setCurrentMatchDetailIndex(i)
      try {
        const data = await fetchMatchDetails(matchIds[i])
        results.push(data)
      } catch (error: any) {
        console.error(`Failed to fetch details for match ${matchIds[i]}:`, error)
        errors.push({ matchId: matchIds[i], error })

        // If the error indicates the EA API is down or rate limited, stop trying
        if (error.message.includes("EA API appears to be unavailable") || error.message.includes("Rate limited")) {
          break
        }
      }
    }

    setFetchingMatchDetails(false)

    // If we have at least one successful result, continue with those
    if (results.length > 0) {
      // If there were also errors, show a warning toast
      if (errors.length > 0) {
        toast({
          title: "Warning",
          description: `${errors.length} match(es) could not be found. Continuing with ${results.length} available match(es).`,
          variant: "warning",
        })
      }

      return results
    }

    // If all fetches failed, throw an error with a more user-friendly message
    if (errors.length > 0) {
      // Check if any errors are rate limiting errors
      const hasRateLimitError = errors.some((e) => e.error.message.includes("Rate limited"))
      if (hasRateLimitError) {
        throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
      }

      // Check if all errors are "not found" errors
      const allNotFound = errors.every((e) => e.error.message.includes("not found") || e.error.message.includes("404"))

      if (allNotFound) {
        throw new Error(`None of the selected matches could be found in the EA database. Please verify the match IDs.`)
      } else {
        throw new Error(`Failed to fetch any match details. ${errors.map((e) => e.error.message).join(", ")}`)
      }
    }

    return results
  }

  const handleImportSelectedMatches = async () => {
    if (selectedMatches.length === 0) {
      setError("Please select at least one match to import")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch details for all selected matches
      console.log(`Fetching details for ${selectedMatches.length} selected matches`)

      // Use the new sequential fetch function
      const matchesDetails = await fetchAllMatchDetails(selectedMatches)

      console.log("Fetched details for all selected matches:", matchesDetails)
      setMatchesData(matchesDetails)

      // If no matches were found, the error would have been thrown in fetchAllMatchDetails
      if (matchesDetails.length === 0) {
        throw new Error("No match details could be retrieved. Please try different match IDs.")
      }

      let eaMatchData
      let effectiveEaMatchId

      if (matchesDetails.length === 1) {
        // Single match case
        eaMatchData = matchesDetails[0]
        effectiveEaMatchId = selectedMatches[0]
      } else {
        // Multiple matches case - combine them
        console.log(`Combining ${matchesDetails.length} matches...`)

        // Debug the raw match data before combination
        console.log("Raw match data before combination:", JSON.stringify(matchesDetails))

        const combinedMatch = combineEaMatches(matchesDetails)

        // Debug the combination process
        debugEaMatchCombination(matchesDetails, combinedMatch)

        if (!combinedMatch) {
          throw new Error("Failed to combine matches")
        }

        eaMatchData = combinedMatch
        // Use a special ID format to indicate this is a combined match
        effectiveEaMatchId = `combined-${selectedMatches.join("-")}`

        console.log("Combined match data:", eaMatchData)
        console.log("Using combined match ID:", effectiveEaMatchId)
      }

      // Now import the match data (single or combined)
      console.log(`Importing match data for match ID ${match.id} with EA match ID ${effectiveEaMatchId}`)

      // Include credentials to ensure cookies are sent
      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({
          matchId: match.id,
          eaMatchId: effectiveEaMatchId,
          eaMatchData,
          isCombinedMatch: matchesDetails.length > 1,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to import match data"
        let errorDetails = null

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData
          console.error("Error response:", errorData)

          // If this is a column missing error, update the column status
          if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            setColumnMissing(true)
          }
        } catch (e) {
          console.error("Could not parse error response:", e)
        }

        throw new Error(errorMessage)
      }

      setSuccess(true)
      toast({
        title: "Success",
        description: "Match data imported successfully",
        variant: "default",
      })

      // Call the success callback if provided
      if (onImportSuccess) {
        onImportSuccess()
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err: any) {
      console.error("Error importing match data:", err)
      setError(err.message || "Failed to import match data")

      // If the error indicates the EA API is down or rate limited, suggest using the manual tab
      if (err.message.includes("EA API appears to be unavailable") || err.message.includes("Rate limited")) {
        setActiveTab("manual")
      }

      // If the error indicates the column is missing, update the column status
      if (err.message.includes("column") && err.message.includes("does not exist")) {
        setColumnMissing(true)
      }
    } finally {
      setLoading(false)
      setFetchingMatchDetails(false)
    }
  }

  const handleManualImport = async () => {
    if (!eaMatchId) {
      setError("Please enter an EA match ID")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch match details
      console.log(`Manually fetching details for match ${eaMatchId}`)
      const matchDetails = await fetchMatchDetails(eaMatchId)
      console.log("Fetched match details:", matchDetails)

      // Import the match data
      console.log(`Importing match data for match ID ${match.id} with EA match ID ${eaMatchId}`)
      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({
          matchId: match.id,
          eaMatchId,
          eaMatchData: matchDetails,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to import match data"
        let errorDetails = null

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData
          console.error("Error response:", errorData)

          // If this is a column missing error, update the column status
          if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            setColumnMissing(true)
          }
        } catch (e) {
          console.error("Could not parse error response:", e)
        }

        throw new Error(errorMessage)
      }

      setSuccess(true)
      toast({
        title: "Success",
        description: "Match data imported successfully",
        variant: "default",
      })

      // Call the success callback if provided
      if (onImportSuccess) {
        onImportSuccess()
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err: any) {
      console.error("Error importing match data:", err)
      setError(err.message || "Failed to import match data")

      // If the error indicates the EA API is down, suggest using the manual JSON tab
      if (err.message.includes("EA API appears to be unavailable")) {
        setActiveTab("json")
      }

      // If the error indicates the column is missing, update the column status
      if (err.message.includes("column") && err.message.includes("does not exist")) {
        setColumnMissing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManualJsonImport = async () => {
    try {
      setLoading(true)
      setJsonError(null)
      setError(null)

      // Validate JSON
      let eaMatchData
      try {
        eaMatchData = JSON.parse(manualJsonData)
      } catch (err: any) {
        setJsonError(`Invalid JSON: ${err.message}`)
        return
      }

      // Basic validation of the JSON structure
      if (!eaMatchData || typeof eaMatchData !== "object") {
        setJsonError("Invalid match data: Expected an object")
        return
      }

      if (!eaMatchData.clubs || typeof eaMatchData.clubs !== "object") {
        setJsonError("Invalid match data: Missing or invalid 'clubs' property")
        return
      }

      // Generate a fake EA match ID for manual imports
      const effectiveEaMatchId = `manual-${Date.now()}`

      // Import the match data
      console.log(
        `Importing manual JSON data for match ID ${match.id} with generated EA match ID ${effectiveEaMatchId}`,
      )
      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({
          matchId: match.id,
          eaMatchId: effectiveEaMatchId,
          eaMatchData,
          isManualImport: true,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to import match data"
        let errorDetails = null

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData
          console.error("Error response:", errorData)

          // If this is a column missing error, update the column status
          if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            setColumnMissing(true)
          }
        } catch (e) {
          console.error("Could not parse error response:", e)
        }

        throw new Error(errorMessage)
      }

      setSuccess(true)
      toast({
        title: "Success",
        description: "Match data imported successfully",
        variant: "default",
      })

      // Call the success callback if provided
      if (onImportSuccess) {
        onImportSuccess()
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err: any) {
      console.error("Error importing manual JSON data:", err)
      setError(err.message || "Failed to import match data")

      // If the error indicates the column is missing, update the column status
      if (err.message.includes("column") && err.message.includes("does not exist")) {
        setColumnMissing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null)

    const file = event.target.files?.[0]
    if (!file) {
      setFileUploadError("No file selected")
      return
    }

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setFileUploadError("File must be a JSON file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // Validate JSON by parsing it
        JSON.parse(content)
        setManualJsonData(content)
      } catch (err: any) {
        setFileUploadError(`Invalid JSON file: ${err.message}`)
      }
    }
    reader.onerror = () => {
      setFileUploadError("Error reading file")
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import EA Match Data</DialogTitle>
          <DialogDescription>
            Import player statistics and match details from EA Sports NHL. You can select from recent matches, enter a
            match ID manually, or paste JSON data directly.
          </DialogDescription>
        </DialogHeader>

        {columnMissing && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Column Missing</AlertTitle>
            <AlertDescription>
              The required database column 'ea_match_data' is missing. Please ask an administrator to run the EA Match
              Data migration.
              <div className="mt-2">
                <Button size="sm" variant="outline" asChild className="bg-white hover:bg-gray-100">
                  <a href="/admin/ea-match-data-migration" target="_blank" rel="noopener noreferrer">
                    Run Migration
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {checkingColumn && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800">Checking Database</AlertTitle>
            <AlertDescription className="text-blue-700">
              Checking if the required database column exists...
            </AlertDescription>
          </Alert>
        )}

        {apiStatus === "unavailable" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>EA API Unavailable</AlertTitle>
            <AlertDescription>
              The EA Sports API appears to be unavailable at the moment. Please use the manual import options below.
            </AlertDescription>
          </Alert>
        )}

        {apiStatus === "checking" && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800">Checking EA API Status</AlertTitle>
            <AlertDescription className="text-blue-700">Checking if the EA Sports API is available...</AlertDescription>
          </Alert>
        )}

        {!homeTeamEaClubId && !awayTeamEaClubId && (
          <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Missing Club IDs</AlertTitle>
            <AlertDescription className="text-yellow-700">
              No EA club IDs are set for either team. You'll need to set these in the team settings to fetch matches
              automatically. You can still use the manual import options.
            </AlertDescription>
          </Alert>
        )}

        {fetchingMatchDetails && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800">Fetching Match Details</AlertTitle>
            <AlertDescription className="text-blue-700">
              Fetching details for match {currentMatchDetailIndex + 1} of {selectedMatches.length}...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription className="text-green-700">Match data imported successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger
              value="auto"
              disabled={apiStatus === "unavailable" || columnMissing}
              className="text-xs sm:text-sm"
            >
              Auto Import
            </TabsTrigger>
            <TabsTrigger value="manual" disabled={columnMissing} className="text-xs sm:text-sm">
              Manual ID
            </TabsTrigger>
            <TabsTrigger value="json" disabled={columnMissing} className="text-xs sm:text-sm">
              JSON Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto">
            <div className="space-y-6">
              {/* Recent Matches Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Recent Matches</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRetryCount(0)
                      fetchRecentMatches()
                    }}
                    disabled={loadingRecentMatches || (!homeTeamEaClubId && !awayTeamEaClubId) || columnMissing}
                    className="flex items-center"
                  >
                    {loadingRecentMatches ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>

                {loadingRecentMatches ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : recentMatches.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto overflow-x-auto">
                      <table className="w-full min-w-[600px] sm:min-w-0">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="py-2 px-2 sm:px-3 text-left font-medium text-xs sm:text-sm">Select</th>
                            <th className="py-2 px-2 sm:px-3 text-left font-medium text-xs sm:text-sm">Match ID</th>
                            <th className="py-2 px-2 sm:px-3 text-left font-medium text-xs sm:text-sm">Date</th>
                            <th className="py-2 px-2 sm:px-3 text-left font-medium text-xs sm:text-sm">Teams</th>
                            <th className="py-2 px-2 sm:px-3 text-left font-medium text-xs sm:text-sm">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMatches.map((match) => (
                            <tr key={match.matchId} className="border-t hover:bg-muted/30">
                              <td className="py-2 px-2 sm:px-3">
                                <Checkbox
                                  checked={selectedMatches.includes(match.matchId)}
                                  onCheckedChange={(checked) => handleMatchSelect(match.matchId, !!checked)}
                                  disabled={loading || fetchingMatchDetails || columnMissing}
                                />
                              </td>
                              <td className="py-2 px-2 sm:px-3 font-mono text-xs">{match.matchId}</td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                <div className="flex flex-col">
                                  <span>{new Date(match.timestamp * 1000).toLocaleDateString()}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(match.timestamp * 1000).toLocaleTimeString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                <div className="max-w-[120px] sm:max-w-none truncate">
                                  {Object.values(match.clubs || {})
                                    .map((club: any) => club.details?.name || club.name || "Unknown")
                                    .join(" vs ")}
                                </div>
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                {Object.values(match.clubs || {})
                                  .map((club: any) => club.details?.goals || club.goals || 0)
                                  .join(" - ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {loadingRecentMatches ? (
                      "Loading matches..."
                    ) : (
                      <>
                        No recent matches found between these teams. Try refreshing or use one of the manual import
                        options.
                        {apiStatus === "unavailable" && (
                          <div className="mt-2 text-red-500 text-sm">
                            <Info className="h-4 w-4 inline mr-1" />
                            The EA Sports API appears to be unavailable, which may be causing this issue.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={handleImportSelectedMatches}
                    disabled={loading || fetchingMatchDetails || selectedMatches.length === 0 || columnMissing}
                    className="w-full"
                  >
                    {loading || fetchingMatchDetails ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {fetchingMatchDetails
                          ? `Fetching match ${currentMatchDetailIndex + 1} of ${selectedMatches.length}...`
                          : "Importing..."}
                      </>
                    ) : (
                      "Import Selected Matches"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {selectedMatches.length === 0
                      ? "Select one or more matches to import"
                      : selectedMatches.length === 1
                        ? "1 match selected"
                        : `${selectedMatches.length} matches selected - stats will be combined`}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Manual Match ID Import</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ea-match-id">EA Match ID</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="ea-match-id"
                        value={eaMatchId}
                        onChange={(e) => setEaMatchId(e.target.value)}
                        placeholder="Enter EA match ID"
                        disabled={loading || fetchingMatchDetails || columnMissing}
                      />
                      <Button
                        onClick={handleManualImport}
                        disabled={loading || fetchingMatchDetails || !eaMatchId || columnMissing}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the EA match ID to fetch match data directly from the EA API.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">JSON Data Import</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="json-data">Match JSON Data</Label>
                    <Textarea
                      id="json-data"
                      value={manualJsonData}
                      onChange={(e) => setManualJsonData(e.target.value)}
                      placeholder="Paste EA match JSON data here"
                      className="font-mono text-xs h-[150px] sm:h-[200px]"
                      disabled={loading || columnMissing}
                    />

                    {jsonError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>JSON Error</AlertTitle>
                        <AlertDescription>{jsonError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor="file-upload"
                          className={`cursor-pointer flex items-center text-sm px-3 py-2 border rounded-md ${
                            columnMissing ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Upload JSON File
                        </Label>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={loading || columnMissing}
                        />
                        <Button
                          onClick={handleManualJsonImport}
                          disabled={loading || !manualJsonData || columnMissing}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Import JSON Data
                            </>
                          )}
                        </Button>
                      </div>

                      {fileUploadError && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>File Upload Error</AlertTitle>
                          <AlertDescription>{fileUploadError}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Use this option when the EA API is unavailable. Paste the EA match JSON data directly or upload a
                      JSON file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || fetchingMatchDetails || columnMissing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
