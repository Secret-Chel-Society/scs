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

      const adminKey = localStorage.getItem("mghl-admin-key") || prompt("Enter admin key:")
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Fix Console Values
        </CardTitle>
        <CardDescription>Fix console constraint violations for failed user creations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFix} disabled={isRunning} className="w-full">
          <Wrench className="mr-2 h-4 w-4" />
          {isRunning ? "Fixing Console Values..." : "Fix Console Values"}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.checked}</div>
                <div className="text-sm text-muted-foreground">Checked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.fixed}</div>
                <div className="text-sm text-muted-foreground">Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.created}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errors ({results.errors.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground bg-destructive/10 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.errors.length === 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">All operations completed successfully!</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
