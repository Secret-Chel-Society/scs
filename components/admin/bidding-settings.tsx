"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function BiddingSettings() {
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(false)
  const [bidDuration, setBidDuration] = useState(14400) // Default to 14400 seconds (4 hours)
  const [bidIncrement, setBidIncrement] = useState(2000000)
  const [minSalary, setMinSalary] = useState(750000)
  const [maxSalary, setMaxSalary] = useState(15000000)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { toast } = useToast()
  const { supabase, session } = useSupabase()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: settings, error } = await supabase.from("system_settings").select("key, value")

        if (error) {
          console.error("Error loading settings:", error)
          
          // Check if it's a permission error
          if (error.message.includes("permission denied") || error.message.includes("system_settings")) {
            toast({
              title: "Permission Error",
              description: "You don't have permission to access system settings. Please run the SQL script to fix permissions.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error loading settings",
              description: "Failed to load bidding settings.",
              variant: "destructive",
            })
          }
          
          // Set default values when there's an error
          setIsBiddingEnabled(false)
          setBidDuration(14400)
          setBidIncrement(250000)
          setMinSalary(750000)
          setMaxSalary(15000000)
          return
        }

        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        }, {})

        setIsBiddingEnabled(settingsMap.bidding_enabled || false)
        setBidDuration(settingsMap.bidding_duration || 14400)
        setBidIncrement(settingsMap.bidding_increment || 250000)
        setMinSalary(settingsMap.min_salary || 750000)
        setMaxSalary(settingsMap.max_salary || 15000000)
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error loading settings",
          description: "Failed to load bidding settings.",
          variant: "destructive",
        })
        
        // Set default values when there's an error
        setIsBiddingEnabled(false)
        setBidDuration(14400)
        setBidIncrement(250000)
        setMinSalary(750000)
        setMaxSalary(15000000)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [supabase, toast])

  const handleToggleBidding = async () => {
    try {
      setIsSaving(true)
      setAuthError(null)

      console.log("Attempting to toggle bidding from", isBiddingEnabled, "to", !isBiddingEnabled)

      const response = await fetch("/api/admin/bidding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ enabled: !isBiddingEnabled }),
        credentials: "include",
      })

      const responseData = await response.json()
      console.log("Bidding toggle response:", responseData)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAuthError("You don't have permission to change bidding settings. Admin role required.")
        }
        throw new Error(responseData.error || `HTTP ${response.status}: Failed to update bidding status`)
      }

      setIsBiddingEnabled(!isBiddingEnabled)
      toast({
        title: "Bidding settings updated",
        description: `Bidding is now ${!isBiddingEnabled ? "enabled" : "disabled"}.`,
      })
    } catch (error: any) {
      console.error("Error updating bidding status:", error)
      setAuthError(error.message)
      toast({
        title: "Error updating bidding status",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDuration = async () => {
    try {
      setIsSaving(true)
      setAuthError(null)

      const response = await fetch("/api/admin/bidding/duration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ durationSeconds: bidDuration }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update bid duration")
      }

      toast({
        title: "Bid duration updated",
        description: `Bid duration is now ${bidDuration} seconds.`,
      })
    } catch (error) {
      console.error("Error updating bid duration:", error)
      toast({
        title: "Error updating bid duration",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveIncrement = async () => {
    try {
      setIsSaving(true)
      setAuthError(null)

      const response = await fetch("/api/admin/bidding/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ increment: bidIncrement }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update bid increment")
      }

      toast({
        title: "Bid increment updated",
        description: `Minimum bid increment is now $${bidIncrement.toLocaleString()}.`,
      })
    } catch (error) {
      console.error("Error updating bid increment:", error)
      toast({
        title: "Error updating bid increment",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMinSalary = async () => {
    try {
      setIsSaving(true)
      setAuthError(null)

      const response = await fetch("/api/admin/bidding/min-salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ minSalary }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update minimum salary")
      }

      toast({
        title: "Minimum salary updated",
        description: `Minimum salary is now $${minSalary.toLocaleString()}.`,
      })
    } catch (error) {
      console.error("Error updating minimum salary:", error)
      toast({
        title: "Error updating minimum salary",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMaxSalary = async () => {
    try {
      setIsSaving(true)
      setAuthError(null)

      const response = await fetch("/api/admin/bidding/max-salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ maxSalary }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update maximum salary")
      }

      toast({
        title: "Maximum salary updated",
        description: `Maximum salary is now $${maxSalary.toLocaleString()}.`,
      })
    } catch (error) {
      console.error("Error updating maximum salary:", error)
      toast({
        title: "Error updating maximum salary",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetAllBids = async () => {
    if (!confirm("Are you sure you want to reset all bids? This will extend all bid timers to 10 hours.")) {
      return
    }

    try {
      setIsSaving(true)
      setAuthError(null)

      // EMERGENCY DIRECT SQL EXECUTION
      // Using a simplified query that our API will understand
      const sqlQuery = "UPDATE player_bidding SET bid_expires_at = 'RESET_TO_10_HOURS' WHERE TRUE"

      console.log("Executing SQL directly:", sqlQuery)

      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
        credentials: "include",
      })

      // Check for errors
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server response:", errorData)
        throw new Error(errorData.error || "Failed to reset all bids")
      }

      toast({
        title: "All bids reset",
        description: "All bid timers have been extended to 10 hours.",
      })
    } catch (error) {
      console.error("Error resetting all bids:", error)
      toast({
        title: "Error resetting all bids",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleForceEndAllBids = async () => {
    if (
      !confirm(
        "Are you sure you want to force end all bids? This will assign players to the highest bidding teams immediately.",
      )
    ) {
      return
    }

    try {
      setIsSaving(true)
      setAuthError(null)

      // EMERGENCY DIRECT SQL EXECUTION
      // Using a simplified query that our API will understand
      const sqlQuery = "FORCE END ALL BIDS"

      console.log("Executing SQL directly for force end all bids")

      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
        credentials: "include",
      })

      // Check for errors
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server response:", errorData)
        throw new Error(errorData.error || "Failed to force end all bids")
      }

      toast({
        title: "All bids ended",
        description: "All players have been assigned to the highest bidding teams.",
      })
    } catch (error) {
      console.error("Error ending all bids:", error)
      toast({
        title: "Error ending all bids",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Direct Supabase functions for emergency use
  const handleDirectResetAllBids = async () => {
    if (!confirm("EMERGENCY: Reset all bid timers directly using Supabase client?")) {
      return
    }

    try {
      setIsSaving(true)
      setAuthError(null)

      // Calculate new expiration time (10 hours from now)
      const expirationTime = new Date(Date.now() + 36000 * 1000).toISOString()

      // First, let's check the table structure to understand what we're working with
      const { data: tableInfo, error: tableError } = await supabase.from("player_bidding").select("*").limit(1)

      if (tableError) {
        console.error("Error fetching table info:", tableError)
        throw tableError
      }

      console.log("Table structure:", tableInfo)

      // Update all bid timers directly using Supabase client
      // Use a filter that will always be true but doesn't compare with numeric values
      const { error } = await supabase
        .from("player_bidding")
        .update({ bid_expires_at: expirationTime })
        .not("id", "is", null) // This is a safe filter that will match all rows

      if (error) {
        console.error("Error resetting bid timers:", error)
        throw error
      }

      toast({
        title: "All bids reset",
        description: "All bid timers have been extended to 10 hours.",
      })
    } catch (error) {
      console.error("Error in direct reset:", error)
      toast({
        title: "Error resetting all bids",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDirectForceEndAllBids = async () => {
    if (!confirm("EMERGENCY: Force end all bids directly using Supabase client?")) {
      return
    }

    try {
      setIsSaving(true)
      setAuthError(null)

      // First, let's check the table structure to understand what we're working with
      const { data: tableInfo, error: tableError } = await supabase.from("player_bidding").select("*").limit(1)

      if (tableError) {
        console.error("Error fetching table info:", tableError)
        throw tableError
      }

      console.log("Table structure:", tableInfo)

      // First get all active bids
      const { data: activeBids, error: fetchError } = await supabase
        .from("player_bidding")
        .select(`
          id,
          player_id,
          team_id,
          bid_amount,
          bid_expires_at
        `)
        .gt("bid_expires_at", new Date().toISOString())

      if (fetchError) {
        console.error("Error fetching active bids:", fetchError)
        throw fetchError
      }

      console.log(`Found ${activeBids?.length || 0} active bids to process`)

      // Group bids by player_id to find highest bid for each player
      const bidsByPlayer = {}
      activeBids?.forEach((bid) => {
        if (!bidsByPlayer[bid.player_id]) {
          bidsByPlayer[bid.player_id] = []
        }
        bidsByPlayer[bid.player_id].push(bid)
      })

      console.log(`Grouped bids for ${Object.keys(bidsByPlayer).length} players`)

      // Process each player's bids
      let processedCount = 0
      for (const playerId in bidsByPlayer) {
        const playerBids = bidsByPlayer[playerId]

        // Find the highest bid
        const highestBid = playerBids.reduce((prev, current) => {
          return prev.bid_amount > current.bid_amount ? prev : current
        })

        console.log(`Highest bid for player ${playerId}: $${highestBid.bid_amount} from team ${highestBid.team_id}`)

        // Assign player to highest bidding team
        const { error: updatePlayerError } = await supabase
          .from("players")
          .update({
            team_id: highestBid.team_id,
            salary: highestBid.bid_amount,
          })
          .eq("id", playerId)

        if (updatePlayerError) {
          console.error(`Error updating player ${playerId}:`, updatePlayerError)
          continue
        }

        // Mark bid as expired
        const pastTime = new Date(Date.now() - 60000).toISOString() // 1 minute ago
        for (const bid of playerBids) {
          const { error: updateBidError } = await supabase
            .from("player_bidding")
            .update({ bid_expires_at: pastTime })
            .eq("id", bid.id)

          if (updateBidError) {
            console.error(`Error updating bid ${bid.id}:`, updateBidError)
          }
        }

        processedCount++
      }

      toast({
        title: "All bids ended",
        description: `Processed ${processedCount} players successfully. Players have been assigned to the highest bidding teams.`,
      })
    } catch (error) {
      console.error("Error in direct force end:", error)
      toast({
        title: "Error ending all bids",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bidding Settings</CardTitle>
          <CardDescription>Configure free agency bidding settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bidding Settings</CardTitle>
        <CardDescription>Configure free agency bidding settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {authError && authError.includes("permission denied") && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Error</AlertTitle>
            <AlertDescription>
              You don't have permission to access the system_settings table. Please run the SQL script to fix permissions:
              <br />
              <code className="mt-2 block p-2 bg-gray-100 rounded text-sm">
                Run the SQL in fix_system_settings_permissions.sql
              </code>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Enable Bidding</h3>
            <p className="text-sm text-muted-foreground">Allow teams to place bids on free agents</p>
          </div>
          <Switch checked={isBiddingEnabled} onCheckedChange={handleToggleBidding} disabled={isSaving} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Bid Duration</h3>
          <p className="text-sm text-muted-foreground">How long bids last before expiring (in seconds)</p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={bidDuration}
              onChange={(e) => setBidDuration(Number(e.target.value))}
              min={60}
              className="max-w-xs"
            />
            <Button onClick={handleSaveDuration} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Minimum Bid Increment</h3>
          <p className="text-sm text-muted-foreground">Minimum amount a new bid must exceed the current highest bid</p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={bidIncrement}
              onChange={(e) => setBidIncrement(Number(e.target.value))}
              min={1000}
              className="max-w-xs"
            />
            <Button onClick={handleSaveIncrement} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Minimum Salary</h3>
          <p className="text-sm text-muted-foreground">Minimum salary for free agents</p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              min={500000}
              step={50000}
              className="max-w-xs"
            />
            <Button onClick={handleSaveMinSalary} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Maximum Salary</h3>
          <p className="text-sm text-muted-foreground">Maximum salary for free agents</p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(Number(e.target.value))}
              min={1000000}
              step={500000}
              className="max-w-xs"
            />
            <Button onClick={handleSaveMaxSalary} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4">
          <Button onClick={handleResetAllBids} variant="destructive" disabled={isSaving}>
            Reset All Bid Timers
          </Button>
          <Button onClick={handleForceEndAllBids} variant="destructive" disabled={isSaving}>
            Force End All Bids
          </Button>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Emergency Options</AlertTitle>
            <AlertDescription>
              If the buttons above don't work, try these emergency options that use direct database access:
            </AlertDescription>
            <div className="mt-2 flex gap-2">
              <Button
                onClick={handleDirectResetAllBids}
                variant="outline"
                disabled={isSaving}
                className="border-red-500 text-red-500"
              >
                Emergency Reset Timers
              </Button>
              <Button
                onClick={handleDirectForceEndAllBids}
                variant="outline"
                disabled={isSaving}
                className="border-red-500 text-red-500"
              >
                Emergency End Bids
              </Button>
            </div>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
