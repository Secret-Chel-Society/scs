"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AvatarUrlMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/avatar-url", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration Complete",
        description: "The avatar_url column has been added to the users table.",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Migration Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Add Avatar URL Column
          {isComplete && <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>Adds the avatar_url column to the users table for profile pictures</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This migration adds an avatar_url column to the users table, allowing users to have profile pictures.
        </p>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Migration Error</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning || isComplete}>
          {isRunning ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
