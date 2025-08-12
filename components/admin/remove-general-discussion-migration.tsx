"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function RemoveGeneralDiscussionMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/remove-general-discussion", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult("✅ Successfully cleaned up forum categories")
        toast({
          title: "Success",
          description: "Forum categories cleaned up successfully",
        })
      } else {
        setResult(`❌ Error: ${data.error}`)
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setResult(`❌ Error: ${errorMessage}`)
      toast({
        title: "Error",
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
        <CardTitle>Remove General Discussion Category</CardTitle>
        <CardDescription>
          This will remove the automatically created "General Discussion" category and fix admin_only flags on existing
          categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? "Running..." : "Clean Up Categories"}
        </Button>

        {result && (
          <div className="p-4 rounded-md bg-muted">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
