"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Database } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PeriodScoresMigration() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columnExists, setColumnExists] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [migrationMethod, setMigrationMethod] = useState<string | null>(null)

  const checkColumnExists = async () => {
    try {
      setChecking(true)
      setError(null)

      // Try multiple approaches to check if the column exists
      let exists = false

      // Approach 1: Try to select the column directly
      try {
        const { data, error } = await supabase.from("matches").select("id, period_scores").limit(1).single()

        if (!error) {
          console.log("Column check via select succeeded:", data)
          exists = true
        }
      } catch (e) {
        console.log("Select approach failed, trying next method")
      }

      // Approach 2: Try using information_schema
      if (!exists) {
        try {
          const { data, error } = await supabase.rpc("run_sql", {
            query: `
              SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'matches' 
                AND column_name = 'period_scores'
              );
            `,
          })

          if (!error && data && data[0] && data[0].exists) {
            console.log("Column check via information_schema succeeded:", data)
            exists = true
          }
        } catch (e) {
          console.log("Information schema approach failed, trying next method")
        }
      }

      // Approach 3: Try using the column_exists function if it exists
      if (!exists) {
        try {
          const { data, error } = await supabase
            .rpc("column_exists", {
              table_name: "matches",
              column_name: "period_scores",
            })
            .single()

          if (!error && data === true) {
            console.log("Column check via column_exists RPC succeeded:", data)
            exists = true
          }
        } catch (e) {
          console.log("column_exists RPC approach failed")
        }
      }

      // Approach 4: Try a direct API call
      if (!exists) {
        try {
          const response = await fetch("/api/admin/check-column-exists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              table: "matches",
              column: "period_scores",
            }),
            credentials: "include",
          })

          if (response.ok) {
            const data = await response.json()
            if (data.exists) {
              console.log("Column check via API succeeded:", data)
              exists = true
            }
          }
        } catch (e) {
          console.log("API check approach failed")
        }
      }

      setColumnExists(exists)
      return exists
    } catch (error: any) {
      console.error("Error checking column:", error)
      setError(error.message || "Failed to check if column exists")
      setColumnExists(false)
      return false
    } finally {
      setChecking(false)
    }
  }

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setMigrationMethod(null)

      // SQL to add the period_scores column
      const sql = `
        ALTER TABLE matches 
        ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN DEFAULT FALSE;
      `

      // Try multiple approaches to run the SQL
      let migrationSucceeded = false
      let method = ""

      // Approach 1: Try the API endpoint
      try {
        console.log("Trying migration via API endpoint")
        const response = await fetch("/api/admin/run-migration/period-scores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          console.log("API migration response:", data)
          if (data.success) {
            migrationSucceeded = true
            method = data.method || "api"
          }
        }
      } catch (e) {
        console.error("API migration failed:", e)
      }

      // Approach 2: Try direct SQL via run_sql RPC
      if (!migrationSucceeded) {
        try {
          console.log("Trying migration via run_sql RPC")
          const { data, error } = await supabase.rpc("run_sql", { query: sql })
          console.log("run_sql response:", { data, error })

          if (!error) {
            migrationSucceeded = true
            method = "run_sql"
          }
        } catch (e) {
          console.error("run_sql migration failed:", e)
        }
      }

      // Approach 3: Try direct SQL via exec_sql RPC
      if (!migrationSucceeded) {
        try {
          console.log("Trying migration via exec_sql RPC")
          const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })
          console.log("exec_sql response:", { data, error })

          if (!error) {
            migrationSucceeded = true
            method = "exec_sql"
          }
        } catch (e) {
          console.error("exec_sql migration failed:", e)
        }
      }

      // Approach 4: Try direct SQL via a custom function
      if (!migrationSucceeded) {
        try {
          console.log("Trying migration via custom function")
          const createFunctionSql = `
            CREATE OR REPLACE FUNCTION temp_add_period_scores()
            RETURNS void AS $$
            BEGIN
              ALTER TABLE matches 
              ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
              ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN DEFAULT FALSE;
            END;
            $$ LANGUAGE plpgsql;
            
            SELECT temp_add_period_scores();
            
            DROP FUNCTION IF EXISTS temp_add_period_scores();
          `

          const { data, error } = await supabase.rpc("run_sql", { query: createFunctionSql })
          console.log("custom function response:", { data, error })

          if (!error) {
            migrationSucceeded = true
            method = "custom_function"
          }
        } catch (e) {
          console.error("custom function migration failed:", e)
        }
      }

      if (!migrationSucceeded) {
        throw new Error("All migration approaches failed")
      }

      setMigrationMethod(method)

      // Wait a moment before checking if the column exists
      // This gives the database time to complete the operation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Verify the column was added
      const exists = await checkColumnExists()

      if (exists) {
        setSuccess(true)
        toast({
          title: "Migration Successful",
          description: `The period scores columns have been added to the matches table using method: ${method}.`,
        })
      } else {
        // Try one more time after a longer delay
        await new Promise((resolve) => setTimeout(resolve, 5000))
        const existsRetry = await checkColumnExists()

        if (existsRetry) {
          setSuccess(true)
          toast({
            title: "Migration Successful",
            description: `The period scores columns have been added to the matches table using method: ${method}.`,
          })
        } else {
          throw new Error("Migration completed but column still doesn't exist. The database may need time to update.")
        }
      }
    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message || "Failed to run migration")
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to run the migration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if column exists when component mounts
  useEffect(() => {
    checkColumnExists()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Period Scores Migration
        </CardTitle>
        <CardDescription>
          Add period_scores, has_overtime, and has_shootout columns to the matches table
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {error.includes("Migration completed but column still doesn't exist") && (
                <div className="mt-2 text-sm">
                  <p>This may be due to database caching. Try these steps:</p>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Wait a few moments and click "Check Status" again</li>
                    <li>Refresh the page and check again</li>
                    <li>The migration may have actually succeeded despite the error</li>
                  </ol>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              The period scores columns have been added to the matches table.
              {migrationMethod && <div className="text-sm mt-1">Method: {migrationMethod}</div>}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="font-medium">Column Status:</div>
            {checking ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </div>
            ) : columnExists === null ? (
              <div>Unknown</div>
            ) : columnExists ? (
              <div className="text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Exists
              </div>
            ) : (
              <div className="text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Missing
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            This migration adds columns to store period-by-period scores, overtime, and shootout information for
            matches.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkColumnExists} disabled={checking || loading}>
          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Check Status
        </Button>
        <Button onClick={runMigration} disabled={checking || loading || columnExists === true}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
