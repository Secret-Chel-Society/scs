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

interface AhlEaMatchImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: any // row from matches_ahl
  teamId?: string
  eaClubId?: string | null
  homeTeamEaClubId?: string | null
  awayTeamEaClubId?: string | null
  onImportSuccess?: () => void
}

export function AhlEaMatchImportModal({
  open,
  onOpenChange,
  match,
  teamId,
  eaClubId,
  homeTeamEaClubId,
  awayTeamEaClubId,
  onImportSuccess,
}: AhlEaMatchImportModalProps) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  // Always AHL in this component
  const isAhl = true

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

  // For AHL we check the existence of the AHL storage TABLE (not an NHL column)
  const [tableMissing, setTableMissing] = useState(false)
  const [checkingTable, setCheckingTable] = useState(false)

  // Combined?
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
      setTableMissing(false)
      setCheckingTable(false)

      checkEaApiStatus()
      checkAhlStorageTable()

      // Only fetch matches if we have at least one club ID
      if (homeTeamEaClubId || awayTeamEaClubId) {
        fetchRecentMatches()
      }
    }
  }, [open, homeTeamEaClubId, awayTeamEaClubId, match, session])

  // AHL-specific storage check: ensure ea_match_data_ahl table exists/accessible
  const checkAhlStorageTable = async () => {
    try {
      setCheckingTable(true)
      const { error } = await supabase.from("ea_match_data_ahl").select("id").limit(1)
      if (error) {
        if (error.message?.toLowerCase().includes("does not exist") || error.message?.includes("42P01")) {
          setTableMissing(true)
          return false
        }
        console.log("AHL storage check - non-fatal error:", error)
      }
      setTableMissing(false)
      return true
    } catch (err) {
      console.error("Error checking AHL storage table:", err)
      setTableMissing(true)
      return false
    } finally {
      setCheckingTable(false)
    }
  }

  const checkEaApiStatus = async () => {
    try {
      setApiStatus("checking")
      const response = await fetch("/api/ea/check-status", {
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        const data = await response.json()
        setApiStatus(data.available ? "available" : "unavailable")
        if (!data.available) setActiveTab("manual")
      } else {
        setApiStatus("unavailable")
        setActiveTab("manual")
      }
    } catch {
      setApiStatus("unavailable")
      setActiveTab("manual")
    }
  }

  const fetchRecentMatches = async () => {
    if (!homeTeamEaClubId && !awayTeamEaClubId) {
      setError("No EA club IDs available for either team")
      return
    }

    try {
      setLoadingRecentMatches(true)
      setError(null)

      const homeClubId = homeTeamEaClubId || ""
      const awayClubId = awayTeamEaClubId || ""

      const url = `/api/ea/past-matches?homeClubId=${homeClubId}&awayClubId=${awayClubId}&limit=10`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      })

      if (response.status === 429) throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
      if (!response.ok) {
        let msg = `Error ${response.status}: ${response.statusText}`
        try {
          const err = await response.json()
          msg = err.error || err.message || msg
        } catch {
          // swallow
        }
        if (response.status === 502 || response.status === 504) {
          setApiStatus("unavailable")
          setActiveTab("manual")
          throw new Error(`EA API appears to be unavailable (${response.status}). Please try the manual import option.`)
        }
        throw new Error(`Failed to fetch recent matches: ${msg}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`Non-JSON response: ${text.slice(0, 100)}...`)
        throw new Error(`Expected JSON response but got: ${contentType || "unknown content type"}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        const unique = Array.from(new Map(data.map((m) => [m.matchId, m])).values())
        setRecentMatches(unique)
        if (unique.length === 0) {
          if (homeTeamEaClubId && awayTeamEaClubId) {
            setError(`No recent matches found between team IDs ${homeTeamEaClubId} and ${awayTeamEaClubId}. Try manual ID.`)
          } else if (homeTeamEaClubId) setError(`No recent matches found for team ID ${homeTeamEaClubId}. Try manual ID.`)
          else if (awayTeamEaClubId) setError(`No recent matches found for team ID ${awayTeamEaClubId}. Try manual ID.`)
          else setError("No recent matches found. Try manual ID.")
        }
      } else if (data.message) {
        setRecentMatches([])
        setError(data.message)
      } else {
        setRecentMatches([])
        setError("Invalid response format from the EA API")
      }
    } catch (err: any) {
      const newRetry = retryCount + 1
      setRetryCount(newRetry)
      if (err.message.includes("unavailable") || err.message.includes("Rate limited")) {
        setError(err.message)
        setApiStatus("unavailable")
        setActiveTab("manual")
        return
      }
      if (newRetry < 3) {
        setError(`Failed to fetch matches (attempt ${newRetry}). Retrying...`)
        setTimeout(() => fetchRecentMatches(), 2000 * Math.pow(2, newRetry - 1))
      } else {
        setError(`Failed to fetch recent matches after ${newRetry} attempts. Try later or use manual options.`)
        setActiveTab("manual")
      }
    } finally {
      setLoadingRecentMatches(false)
    }
  }

  const handleMatchSelect = (matchId: string, isChecked: boolean) => {
    setSelectedMatches((prev) => (isChecked ? [...prev, matchId] : prev.filter((id) => id !== matchId)))
  }

  const fetchMatchDetails = async (matchId: string, retryCount = 0): Promise<any> => {
    try {
      const params = new URLSearchParams({
        matchId,
        homeClubId: homeTeamEaClubId || "",
        awayClubId: awayTeamEaClubId || "",
      })

      // Direct route through your server
      try {
        const directUrl = `/api/ea/match-details?${params}`
        const response = await fetch(directUrl, { signal: AbortSignal.timeout(30000) })
        if (response.status === 429) throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
        if (!response.ok) {
          if (response.status === 404) {
            const e = await response.json().catch(() => ({}))
            throw new Error(e?.message || `Match ID ${matchId} not found in EA database. Please verify the match ID.`)
          }
          throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`)
        }
        const ct = response.headers.get("content-type")
        if (!ct || !ct.includes("application/json")) {
          const text = await response.text()
          throw new Error(`Expected JSON response but got: ${ct || "unknown content type"} (${text.slice(0, 100)}...)`)
        }
        return await response.json()
      } catch (directError: any) {
        if (directError.message.includes("404") || directError.message.includes("not found")) throw directError
        if (directError.message.includes("Rate limited")) throw directError
      }

      // Proxy fallback
      try {
        const eaApiUrl = `https://proclubs.ea.com/api/nhl/match/details?matchId=${matchId}&platform=common-gen5&matchType=club_private`
        const proxyUrl = `/api/ea/proxy?url=${encodeURIComponent(eaApiUrl)}`
        const proxyResponse = await fetch(proxyUrl, { signal: AbortSignal.timeout(30000) })
        if (proxyResponse.status === 429) throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
        if (!proxyResponse.ok) {
          if (proxyResponse.status === 404) throw new Error(`Match ID ${matchId} not found in EA database. Please verify the match ID.`)
          throw new Error(`Proxy fetch failed: ${proxyResponse.status} ${proxyResponse.statusText}`)
        }
        const ct = proxyResponse.headers.get("content-type")
        if (!ct || !ct.includes("application/json")) {
          const text = await proxyResponse.text()
          throw new Error(`Expected JSON response but got: ${ct || "unknown content type"} (${text.slice(0, 100)}...)`)
        }
        return await proxyResponse.json()
      } catch (proxyError: any) {
        if (proxyError.message.includes("404") || proxyError.message.includes("not found")) throw proxyError
        if (proxyError.message.includes("Rate limited")) throw proxyError
        if (retryCount < 2) {
          await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, retryCount)))
          return fetchMatchDetails(matchId, retryCount + 1)
        }
        throw proxyError
      }
    } catch (error: any) {
      if (
        retryCount < 2 &&
        !error.message.includes("404") &&
        !error.message.includes("not found") &&
        !error.message.includes("Rate limited")
      ) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, retryCount)))
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
        errors.push({ matchId: matchIds[i], error })
        if (error.message.includes("unavailable") || error.message.includes("Rate limited")) break
      }
    }

    setFetchingMatchDetails(false)

    if (results.length > 0) {
      if (errors.length > 0) {
        toast({
          title: "Warning",
          description: `${errors.length} match(es) could not be found. Continuing with ${results.length} available match(es).`,
          variant: "warning",
        })
      }
      return results
    }

    if (errors.length > 0) {
      const hasRateLimit = errors.some((e) => e.error.message.includes("Rate limited"))
      if (hasRateLimit) throw new Error("Rate limited by EA API. Please try again later or use the manual import options.")
      const allNotFound = errors.every((e) => e.error.message.includes("not found") || e.error.message.includes("404"))
      if (allNotFound) throw new Error("None of the selected matches could be found in the EA database. Please verify the match IDs.")
      throw new Error(`Failed to fetch any match details. ${errors.map((e) => e.error.message).join(", ")}`)
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

      const matchesDetails = await fetchAllMatchDetails(selectedMatches)
      setMatchesData(matchesDetails)

      if (matchesDetails.length === 0) throw new Error("No match details could be retrieved. Please try different match IDs.")

      let eaMatchData: any
      let effectiveEaMatchId: string

      if (matchesDetails.length === 1) {
        eaMatchData = matchesDetails[0]
        effectiveEaMatchId = selectedMatches[0]
      } else {
        const combinedMatch = combineEaMatches(matchesDetails)
        debugEaMatchCombination(matchesDetails, combinedMatch)
        if (!combinedMatch) throw new Error("Failed to combine matches")
        eaMatchData = combinedMatch
        effectiveEaMatchId = `combined-${selectedMatches.join("-")}`
      }

      // AHL via unified endpoint
      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          matchId: match.id, // id from matches_ahl
          eaMatchId: effectiveEaMatchId,
          eaMatchData,
          isCombinedMatch: matchesDetails.length > 1,
          league: "AHL",
        }),
      })

      if (!response.ok) {
        let msg = "Failed to import match data"
        try {
          const err = await response.json()
          msg = err.error || msg
          if (msg.toLowerCase().includes("does not exist")) setTableMissing(true)
        } catch {}
        throw new Error(msg)
      }

      setSuccess(true)
      toast({ title: "Success", description: "AHL match data imported successfully" })
      onImportSuccess?.()
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to import match data")
      if (err.message.includes("unavailable") || err.message.includes("Rate limited")) setActiveTab("manual")
      if (err.message.toLowerCase().includes("does not exist")) setTableMissing(true)
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

      const matchDetails = await fetchMatchDetails(eaMatchId)

      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          matchId: match.id,
          eaMatchId,
          eaMatchData: matchDetails,
          league: "AHL",
        }),
      })

      if (!response.ok) {
        let msg = "Failed to import match data"
        try {
          const err = await response.json()
          msg = err.error || msg
          if (msg.toLowerCase().includes("does not exist")) setTableMissing(true)
        } catch {}
        throw new Error(msg)
      }

      setSuccess(true)
      toast({ title: "Success", description: "AHL match data imported successfully" })
      onImportSuccess?.()
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to import match data")
      if (err.message.includes("unavailable")) setActiveTab("json")
      if (err.message.toLowerCase().includes("does not exist")) setTableMissing(true)
    } finally {
      setLoading(false)
    }
  }

  const handleManualJsonImport = async () => {
    try {
      setLoading(true)
      setJsonError(null)
      setError(null)

      let eaMatchData: any
      try {
        eaMatchData = JSON.parse(manualJsonData)
      } catch (err: any) {
        setJsonError(`Invalid JSON: ${err.message}`)
        return
      }

      if (!eaMatchData || typeof eaMatchData !== "object") {
        setJsonError("Invalid match data: Expected an object")
        return
      }
      if (!eaMatchData.clubs || typeof eaMatchData.clubs !== "object") {
        setJsonError("Invalid match data: Missing or invalid 'clubs' property")
        return
      }

      const effectiveEaMatchId = `manual-${Date.now()}`

      const response = await fetch("/api/matches/update-from-ea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          matchId: match.id,
          eaMatchId: effectiveEaMatchId,
          eaMatchData,
          isManualImport: true,
          league: "AHL",
        }),
      })

      if (!response.ok) {
        let msg = "Failed to import match data"
        try {
          const err = await response.json()
          msg = err.error || msg
          if (msg.toLowerCase().includes("does not exist")) setTableMissing(true)
        } catch {}
        throw new Error(msg)
      }

      setSuccess(true)
      toast({ title: "Success", description: "AHL match data imported successfully" })
      onImportSuccess?.()
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to import match data")
      if (err.message.toLowerCase().includes("does not exist")) setTableMissing(true)
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
        JSON.parse(content)
        setManualJsonData(content)
      } catch (err: any) {
        setFileUploadError(`Invalid JSON file: ${err.message}`)
      }
    }
    reader.onerror = () => setFileUploadError("Error reading file")
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import EA Match Data (AHL)</DialogTitle>
          <DialogDescription>
            Import player statistics and match details from EA Sports NHL for AHL matches. Select recent matches, enter an
            EA match ID, or paste JSON data directly.
          </DialogDescription>
        </DialogHeader>

        {tableMissing && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AHL Table Missing</AlertTitle>
            <AlertDescription>
              The required table <span className="font-mono">ea_match_data_ahl</span> is missing or not accessible. Please run the AHL EA Match Data migration.
              <div className="mt-2">
                <Button size="sm" variant="outline" asChild className="bg-white hover:bg-gray-100">
                  <a href="/admin/ahl-ea-match-data-migration" target="_blank" rel="noopener noreferrer">
                    Run Migration
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {checkingTable && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800">Checking Database</AlertTitle>
            <AlertDescription className="text-blue-700">
              Verifying AHL storage table <span className="font-mono">ea_match_data_ahl</span>…
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
              No EA club IDs are set for either team. Set these in team settings to fetch matches automatically, or use the manual import options.
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
            <AlertDescription className="text-green-700">AHL match data imported successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="auto" disabled={apiStatus === "unavailable" || tableMissing} className="text-xs sm:text-sm">
              Auto Import
            </TabsTrigger>
            <TabsTrigger value="manual" disabled={tableMissing} className="text-xs sm:text-sm">
              Manual ID
            </TabsTrigger>
            <TabsTrigger value="json" disabled={tableMissing} className="text-xs sm:text-sm">
              JSON Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto">
            <div className="space-y-6">
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
                    disabled={loadingRecentMatches || (!homeTeamEaClubId && !awayTeamEaClubId) || tableMissing}
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
                          {recentMatches.map((m) => (
                            <tr key={m.matchId} className="border-t hover:bg-muted/30">
                              <td className="py-2 px-2 sm:px-3">
                                <Checkbox
                                  checked={selectedMatches.includes(m.matchId)}
                                  onCheckedChange={(checked) => handleMatchSelect(m.matchId, !!checked)}
                                  disabled={loading || fetchingMatchDetails || tableMissing}
                                />
                              </td>
                              <td className="py-2 px-2 sm:px-3 font-mono text-xs">{m.matchId}</td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                <div className="flex flex-col">
                                  <span>{new Date(m.timestamp * 1000).toLocaleDateString()}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(m.timestamp * 1000).toLocaleTimeString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                <div className="max-w-[120px] sm:max-w-none truncate">
                                  {Object.values(m.clubs || {})
                                    .map((club: any) => club.details?.name || club.name || "Unknown")
                                    .join(" vs ")}
                                </div>
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                                {Object.values(m.clubs || {})
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
                    disabled={loading || fetchingMatchDetails || selectedMatches.length === 0 || tableMissing}
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
                        disabled={loading || fetchingMatchDetails || tableMissing}
                      />
                      <Button onClick={handleManualImport} disabled={loading || fetchingMatchDetails || !eaMatchId || tableMissing}>
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
                    <p className="text-xs text-muted-foreground mt-1">Enter the EA match ID to fetch match data directly from the EA API.</p>
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
                      disabled={loading || tableMissing}
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
                            tableMissing ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
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
                          disabled={loading || tableMissing}
                        />
                        <Button onClick={handleManualJsonImport} disabled={loading || !manualJsonData || tableMissing} className="flex-1">
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
                      Use this option when the EA API is unavailable. Paste the EA match JSON data directly or upload a JSON file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || fetchingMatchDetails || tableMissing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
