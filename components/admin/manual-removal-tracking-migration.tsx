"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Database } from "lucide-react"

export default function ManualRemovalTrackingMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)

    try {
      const adminKey = localStorage.getItem("scs-admin-key")
      if (!adminKey) {
        throw new Error("Admin key not found. Please set it in the admin panel first.")
      }

      const response = await fetch("/api/admin/run-migration/manual-removal-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setIsComplete(true)
      toast({
        title: "Migration Successful",
        description: "Manual removal tracking has been set up successfully.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message)
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Manual Removal Tracking Migration
        </CardTitle>
        <CardDescription>
          Add tracking columns to prevent automatic re-assignment of manually removed players
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What this migration does:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Adds manually_removed and manually_removed_at columns to players table</li>
            <li>• Adds won_bid and processed_at columns to player_bidding table</li>
            <li>• Creates performance indexes for faster queries</li>
            <li>• Marks existing assigned players' bids as processed</li>
            <li>• Prevents automatic re-assignment of manually removed players</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Migration Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Migration Complete</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Manual removal tracking has been successfully set up. Players can now be safely removed without automatic
              re-assignment.
            </p>
          </div>
        )}

        <Button onClick={runMigration} disabled={isRunning || isComplete} className="w-full">
          {isRunning ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardContent>
    </Card>
  )
}
