"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EaPlayerMappingsFlexibleMigration() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [columnName, setColumnName] = useState("persona_name")
  const [tableName, setTableName] = useState("ea_player_mappings")

  const runMigration = async () => {
    if (!columnName || !tableName) {
      toast({
        title: "Error",
        description: "Please enter both column name and table name",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRunning(true)
      const response = await fetch("/api/admin/run-migration/ea-player-mappings-flexible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          columnName,
          tableName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      toast({
        title: "Success",
        description: data.message || "Migration completed successfully",
      })
      setIsComplete(true)
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to run migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EA Player Mappings Flexible Migration</CardTitle>
        <CardDescription>
          Create a table to map EA player names to MGHL player profiles with custom column names
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="ea_player_mappings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="columnName">EA Player Name Column</Label>
            <Input
              id="columnName"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="persona_name"
            />
            <p className="text-sm text-muted-foreground">
              This should match the column name used in EA data tables for player identifiers
            </p>
          </div>

          <p className="text-sm">
            This migration will create a new table called <code>{tableName}</code> with a column{" "}
            <code>{columnName}</code> to map EA player names to MGHL player profiles.
          </p>

          <Button onClick={runMigration} disabled={isRunning || isComplete}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : isComplete ? (
              "Migration Complete"
            ) : (
              "Run Migration"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
