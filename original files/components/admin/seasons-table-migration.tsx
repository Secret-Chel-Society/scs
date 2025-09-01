"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SeasonsTableMigration() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/run-migration/seasons-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      toast({
        title: "Success",
        description: "Seasons table migration completed successfully",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to run migration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasons Table</CardTitle>
        <CardDescription>
          Create the seasons table if it doesn't exist. This table stores information about league seasons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This migration will create the seasons table if it doesn't already exist. The table includes fields for name,
          start date, end date, and active status.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading ? "Running..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
