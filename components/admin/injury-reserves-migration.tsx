"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function InjuryReservesMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/injury-reserves-table", {
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
          description: "Injury reserves table has been created successfully.",
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
      const errorMessage = error.message || "Unknown error occurred"
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
        <CardTitle>Injury Reserves Table Migration</CardTitle>
        <CardDescription>
          Create the injury_reserves table with proper schema and RLS policies for managing player injury reserve
          requests.
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
            "Run Injury Reserves Migration"
          )}
        </Button>

        {result && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md ${
              result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
