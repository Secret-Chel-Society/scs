"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function UpdateWaiverPriorityMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/update-waiver-priority-table", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult("Migration completed successfully!")
      toast({
        title: "Migration Successful",
        description: "Waiver priority and claims tables have been created.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult(`Migration failed: ${error.message}`)
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
    <Card>
      <CardHeader>
        <CardTitle>Update Waiver Priority Tables</CardTitle>
        <CardDescription>
          Creates the waiver_priority and waiver_claims tables and initializes team priorities based on current
          standings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-md ${result.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
          >
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
