"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Users, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SyncMissingUsers() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [adminKey, setAdminKey] = useState("")
  const { toast } = useToast()

  const handleSync = async () => {
    if (!adminKey.trim()) {
      toast({
        title: "Admin key required",
        description: "Please enter your admin verification key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/admin/sync-missing-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync users")
      }

      setResults(data.results)

      toast({
        title: "Sync completed",
        description: `Created ${data.results.created} missing user records`,
      })
    } catch (error: any) {
      console.error("Error syncing users:", error)
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync missing users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="hockey-premium-card">
        <CardHeader>
          <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
            <div className="hockey-feature-icon">
              <Users className="h-5 w-5 text-white" />
            </div>
            Sync Missing Users
          </CardTitle>
          <CardDescription className="hockey-subtitle text-center">
            Find users who exist in Supabase Auth but are missing from the users table and create their records with intelligent detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="admin-key" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-ice-blue-500" />
              Admin Verification Key
            </Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="hockey-form-enhanced"
            />
          </div>

          <Button onClick={handleSync} disabled={isLoading || !adminKey.trim()} className="w-full hockey-button-enhanced">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Syncing..." : "Sync Missing Users"}
          </Button>

          {results && (
            <div className="mt-8 space-y-6">
              <h3 className="hockey-title text-xl text-center">Sync Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="hockey-stats-enhanced bg-gradient-to-br from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">{results.total}</div>
                  <div className="text-sm text-ice-blue-600 dark:text-ice-blue-400 font-medium">Total Auth Users</div>
                </div>
                <div className="hockey-stats-enhanced bg-gradient-to-br from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-200 dark:border-assist-green-700">
                  <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">{results.existing}</div>
                  <div className="text-sm text-assist-green-600 dark:text-assist-green-400 font-medium">Existing Records</div>
                </div>
                <div className="hockey-stats-enhanced bg-gradient-to-br from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 border-rink-blue-200 dark:border-rink-blue-700">
                  <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">{results.missing}</div>
                  <div className="text-sm text-rink-blue-600 dark:text-rink-blue-400 font-medium">Missing Records</div>
                </div>
                <div className="hockey-stats-enhanced bg-gradient-to-br from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border-goal-red-200 dark:border-goal-red-700">
                  <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">{results.created}</div>
                  <div className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">Created Records</div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="hockey-premium-card bg-gradient-to-br from-goal-red-25 to-goal-red-50 dark:from-goal-red-950/30 dark:to-goal-red-900/30 border-2 border-goal-red-200 dark:border-goal-red-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="hockey-feature-icon bg-gradient-to-r from-goal-red-500 to-goal-red-600">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <span className="hockey-title text-lg text-goal-red-800 dark:text-goal-red-200">
                      Errors ({results.errors.length})
                    </span>
                  </div>
                  <ul className="hockey-subtitle text-goal-red-700 dark:text-goal-red-300 space-y-2">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-goal-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
