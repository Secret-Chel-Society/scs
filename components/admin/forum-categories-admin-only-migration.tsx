"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ForumCategoriesAdminOnlyMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    try {
      const response = await fetch("/api/admin/run-migration/forum-categories-admin-only", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setIsCompleted(true)
        toast({
          title: "Success",
          description: "Forum categories admin-only migration completed successfully",
        })
      } else {
        throw new Error(data.error || "Migration failed")
      }
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Migration failed",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forum Categories Admin-Only Migration</CardTitle>
        <CardDescription>
          Adds admin_only column to forum_categories table and sets up proper permissions for announcement categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runMigration} disabled={isRunning || isCompleted}>
          {isRunning ? "Running Migration..." : isCompleted ? "Migration Completed" : "Run Migration"}
        </Button>
        {isCompleted && <p className="text-green-600 mt-2">✅ Migration completed successfully</p>}
      </CardContent>
    </Card>
  )
}
