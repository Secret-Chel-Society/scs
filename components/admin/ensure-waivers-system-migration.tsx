"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function EnsureWaiversSystemMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/ensure-waivers-system", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        toast({
          title: "Migration Successful",
          description: "Waivers system has been set up successfully",
        })
      } else {
        throw new Error(data.error || "Migration failed")
      }
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult({ success: false, message: error.message })
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
        <CardTitle>Ensure Waivers System</CardTitle>
        <CardDescription>
          Set up or verify the complete waivers system including tables, indexes, and RLS policies
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
            "Run Waivers System Migration"
          )}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              result.success
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
