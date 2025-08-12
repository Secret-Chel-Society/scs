"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function FeaturedColumnMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      const response = await fetch("/api/admin/run-migration/featured-column")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Migration successful",
          description: data.message || "The featured column was added successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to run migration")
      }
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration failed",
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
        <CardTitle>Featured Column Migration</CardTitle>
        <CardDescription>
          Add the 'featured' column to the matches table to enable featured games functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardContent>
    </Card>
  )
}
