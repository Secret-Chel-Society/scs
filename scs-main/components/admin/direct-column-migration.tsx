"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"

interface DirectColumnMigrationProps {
  onComplete: () => void
}

export function DirectColumnMigration({ onComplete }: DirectColumnMigrationProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)

  const runMigration = async () => {
    try {
      setIsRunning(true)

      // First, check if the column already exists
      try {
        const { data, error } = await supabase.from("teams").select("ea_club_id").limit(1)

        if (!error) {
          // Column already exists
          toast({
            title: "Column already exists",
            description: "The ea_club_id column already exists in the teams table.",
          })
          onComplete()
          return
        }
      } catch (error) {
        console.log("Expected error checking column:", error)
      }

      // Try to add the column using a direct SQL query
      // This uses the PostgreSQL extension that Supabase provides
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: "ALTER TABLE teams ADD COLUMN IF NOT EXISTS ea_club_id TEXT;",
      })

      if (error) {
        console.error("SQL execution error:", error)

        // Try a different approach - create a temporary team with the column
        try {
          const { error: insertError } = await supabase.from("teams").insert({
            name: "TEMP_MIGRATION_ROW",
            logo_url: null,
            wins: 0,
            losses: 0,
            otl: 0,
            goals_for: 0,
            goals_against: 0,
            season_id: 1,
            ea_club_id: "TEMP",
          })

          if (insertError) {
            throw new Error(`Insert approach failed: ${insertError.message}`)
          }

          // Delete the temporary row
          await supabase.from("teams").delete().eq("name", "TEMP_MIGRATION_ROW")

          toast({
            title: "Migration successful",
            description: "EA Club ID column has been added to the teams table.",
          })
          onComplete()
          return
        } catch (insertError) {
          console.error("Insert approach error:", insertError)
          throw new Error("All migration approaches failed")
        }
      }

      toast({
        title: "Migration successful",
        description: "EA Club ID column has been added to the teams table.",
      })
      onComplete()
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
        description: error.message || "Failed to run migration. Please check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={runMigration} disabled={isRunning}>
      {isRunning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      Run Migration
    </Button>
  )
}
