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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sync Missing Users
          </CardTitle>
          <CardDescription>
            Find users who exist in Supabase Auth but are missing from the users table and create their records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Verification Key</Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
          </div>

          <Button onClick={handleSync} disabled={isLoading || !adminKey.trim()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Syncing..." : "Sync Missing Users"}
          </Button>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                  <div className="text-sm text-blue-600">Total Auth Users</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.existing}</div>
                  <div className="text-sm text-green-600">Existing Records</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.missing}</div>
                  <div className="text-sm text-yellow-600">Missing Records</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{results.created}</div>
                  <div className="text-sm text-purple-600">Created Records</div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-700">Errors ({results.errors.length})</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
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
