"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function RetainedSalaryMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/retained-salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        toast({
          title: "Migration Successful",
          description: "Retained salary columns have been added successfully.",
        })
      } else {
        setResult({ success: false, message: data.error })
        toast({
          title: "Migration Failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to run migration"
      setResult({ success: false, message: errorMessage })
      toast({
        title: "Migration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Retained Salary Columns</CardTitle>
        <CardDescription>
          Adds retained_salary column to players table and total_retained_salary column to teams table for trade salary
          retention functionality.
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
            className={`flex items-center gap-2 p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
