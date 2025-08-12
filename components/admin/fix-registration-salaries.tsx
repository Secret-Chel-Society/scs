"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function FixRegistrationSalaries() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFixSalaries = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/fix-registration-salaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix salaries")
      }

      setResult(`Success: ${data.message}`)
      toast({
        title: "Salaries Fixed",
        description: data.message,
      })
    } catch (error: any) {
      console.error("Error fixing salaries:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
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
        <CardTitle>Fix Registration Salaries</CardTitle>
        <CardDescription>
          Set all unassigned players (free agents) to have $0 salary instead of $750,000
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFixSalaries} disabled={isRunning} className="w-full">
          {isRunning ? "Fixing Salaries..." : "Fix Registration Salaries"}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.startsWith("Success")
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
            }`}
          >
            <p className="font-medium">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
