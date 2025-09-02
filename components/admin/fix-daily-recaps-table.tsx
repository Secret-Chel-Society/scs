"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Database, AlertTriangle } from "lucide-react"

export function FixDailyRecapsTable() {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runFix = async () => {
    try {
      setIsRunning(true)
      const response = await fetch("/api/admin/fix-daily-recaps-table", {
        method: "POST"
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Table Fixed",
          description: data.message || "The daily recaps table has been fixed successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to fix table")
      }
    } catch (error: any) {
      console.error("Error fixing table:", error)
      toast({
        title: "Fix Failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Fix Daily Recaps Table
        </CardTitle>
        <CardDescription>
          Fix the daily recaps table structure to use UUID instead of SERIAL primary key
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-400">
              This will drop and recreate the daily_recaps table. Any existing data will be lost.
            </span>
          </div>
          <Button onClick={runFix} disabled={isRunning} variant="destructive">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fixing Table...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Fix Table Structure
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
