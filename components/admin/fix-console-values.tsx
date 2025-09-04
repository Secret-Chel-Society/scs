"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Wrench, CheckCircle, AlertCircle } from "lucide-react"

export function FixConsoleValues() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFix = async () => {
    try {
      setIsRunning(true)
      setResults(null)

      const adminKey = localStorage.getItem("scs-admin-key") || prompt("Enter admin key:")
      if (!adminKey) {
        toast({
          title: "Admin key required",
          description: "Please provide an admin key to continue",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/admin/fix-console-values", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix console values")
      }

      setResults(data.results)
      toast({
        title: "Console values fixed",
        description: `Checked ${data.results.checked} users, fixed ${data.results.fixed} console values, created ${data.results.created} database users`,
      })
    } catch (error: any) {
      console.error("Error fixing console values:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fix console values",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="hockey-premium-card">
      <CardHeader>
        <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
          <div className="hockey-feature-icon">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          Fix Console Values
        </CardTitle>
        <CardDescription className="hockey-subtitle text-center">
          Fix console constraint violations for failed user creations with automated detection and repair
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleFix} disabled={isRunning} className="w-full hockey-button-enhanced">
          <Wrench className="mr-2 h-4 w-4" />
          {isRunning ? "Fixing Console Values..." : "Fix Console Values"}
        </Button>

        {results && (
          <div className="space-y-6">
            <h3 className="hockey-title text-xl text-center">Repair Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="hockey-stats-enhanced bg-gradient-to-br from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 border-ice-blue-200 dark:border-ice-blue-700">
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">{results.checked}</div>
                <div className="text-sm text-ice-blue-600 dark:text-ice-blue-400 font-medium">Checked</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-200 dark:border-assist-green-700">
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">{results.fixed}</div>
                <div className="text-sm text-assist-green-600 dark:text-assist-green-400 font-medium">Fixed</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 border-rink-blue-200 dark:border-rink-blue-700">
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">{results.created}</div>
                <div className="text-sm text-rink-blue-600 dark:text-rink-blue-400 font-medium">Created</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="hockey-premium-card bg-gradient-to-br from-goal-red-25 to-goal-red-50 dark:from-goal-red-950/30 dark:to-goal-red-900/30 border-2 border-goal-red-200 dark:border-goal-red-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="hockey-feature-icon bg-gradient-to-r from-goal-red-500 to-goal-red-600">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="hockey-title text-lg text-goal-red-800 dark:text-goal-red-200">
                    Errors ({results.errors.length})
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {results.errors.map((error: string, index: number) => (
                    <div key={index} className="hockey-subtitle text-goal-red-700 dark:text-goal-red-300 bg-goal-red-500/10 p-2 rounded-lg">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.errors.length === 0 && (
              <div className="hockey-premium-card bg-gradient-to-br from-assist-green-25 to-assist-green-50 dark:from-assist-green-950/30 dark:to-assist-green-900/30 border-2 border-assist-green-200 dark:border-assist-green-700">
                <div className="flex items-center gap-3 justify-center">
                  <div className="hockey-feature-icon bg-gradient-to-r from-assist-green-500 to-assist-green-600">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="hockey-title text-lg text-assist-green-800 dark:text-assist-green-200">All operations completed successfully!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
