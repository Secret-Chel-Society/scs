"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function FixBiddingAssignments() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fixAssignments = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const adminKey = localStorage.getItem("scs-admin-key")
      if (!adminKey) {
        throw new Error("Admin key not found. Please set it in the admin panel first.")
      }

      const response = await fetch("/api/admin/fix-bidding-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix bidding assignments")
      }

      setResults(data)
      toast({
        title: "Bidding Assignments Fixed",
        description: `Successfully processed ${data.updatedBids} player assignments`,
      })
    } catch (error: any) {
      console.error("Fix assignments error:", error)
      setError(error.message)
      toast({
        title: "Fix Failed",
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
          <RefreshCw className="h-5 w-5" />
          Fix Bidding Assignments
        </CardTitle>
        <CardDescription>Mark existing player assignments as processed to prevent re-assignment issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">What this fix does:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Finds all players currently assigned to teams</li>
            <li>• Marks their bidding records as processed and completed</li>
            <li>• Identifies and marks winning bids</li>
            <li>• Marks expired bids as processed</li>
            <li>• Prevents automatic re-assignment of existing players</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Fix Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Fix Complete</span>
            </div>
            <div className="text-sm text-green-700 mt-2 space-y-1">
              <p>• Updated bidding records for {results.updatedBids} players</p>
              {results.errors && results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errors encountered:</p>
                  <ul className="list-disc list-inside">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index} className="text-xs">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <Button onClick={fixAssignments} disabled={isRunning} className="w-full">
          {isRunning ? "Fixing Assignments..." : "Fix Bidding Assignments"}
        </Button>
      </CardContent>
    </Card>
  )
}
