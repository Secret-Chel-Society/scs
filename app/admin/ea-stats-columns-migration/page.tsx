"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Database, Loader2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"

export default function EaStatsColumnsMigrationPage() {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setResult(null)

      // Execute the migration SQL directly
      const { data, error: sqlError } = await supabase.rpc("exec_sql", {
        sql_query: `
        -- Check if the table exists first
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ea_player_stats') THEN
                -- Check if the glga column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glga') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN glga TEXT;
                END IF;
                
                -- Check if the glsaves column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glsaves') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN glsaves TEXT;
                END IF;
                
                -- Check if the glsavepct column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glsavepct') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN glsavepct TEXT;
                END IF;
                
                -- Check if the glshots column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glshots') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN glshots TEXT;
                END IF;
                
                -- Check if the glgaa column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'glgaa') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN glgaa TEXT;
                END IF;
                
                -- Check if the toiseconds column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'toiseconds') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN toiseconds TEXT;
                END IF;
                
                -- Check if the skinterceptions column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skinterceptions') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skinterceptions TEXT;
                END IF;
                
                -- Check if the skfow column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skfow') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skfow TEXT;
                END IF;
                
                -- Check if the skfol column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skfol') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skfol TEXT;
                END IF;
                
                -- Check if the skpenaltiesdrawn column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skpenaltiesdrawn') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skpenaltiesdrawn TEXT;
                END IF;
                
                -- Check if the skpasses column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skpasses') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skpasses TEXT;
                END IF;
                
                -- Check if the skpassattempts column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skpassattempts') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skpassattempts TEXT;
                END IF;
                
                -- Check if the skpossession column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skpossession') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skpossession TEXT;
                END IF;
                
                -- Check if the skppg column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skppg') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skppg TEXT;
                END IF;
                
                -- Check if the skshg column exists
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ea_player_stats' AND column_name = 'skshg') THEN
                    ALTER TABLE ea_player_stats ADD COLUMN skshg TEXT;
                END IF;
            END IF;
        END $$;
        `,
      })

      if (sqlError) {
        throw new Error(`Failed to run migration: ${sqlError.message}`)
      }

      // Verify the columns were added
      const { data: columns, error: columnsError } = await supabase.rpc("get_table_info", {
        table_name: "ea_player_stats",
      })

      if (columnsError) {
        throw new Error(`Failed to verify columns: ${columnsError.message}`)
      }

      setResult(columns)
      setSuccess(true)
    } catch (err: any) {
      console.error("Error running migration:", err)
      setError(err.message || "An error occurred while running the migration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>EA Stats Columns Migration</CardTitle>
          <CardDescription>
            Add missing columns to the ea_player_stats table to support all EA NHL API data fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This migration will add the following columns to the ea_player_stats table if they don't already exist:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-1">
            <li>glga - Goalie goals against</li>
            <li>glsaves - Goalie saves</li>
            <li>glsavepct - Goalie save percentage</li>
            <li>glshots - Goalie shots against</li>
            <li>glgaa - Goalie goals against average</li>
            <li>toiseconds - Time on ice in seconds</li>
            <li>skinterceptions - Skater interceptions</li>
            <li>skfow - Skater faceoffs won</li>
            <li>skfol - Skater faceoffs lost</li>
            <li>skpenaltiesdrawn - Skater penalties drawn</li>
            <li>skpasses - Skater passes completed</li>
            <li>skpassattempts - Skater pass attempts</li>
            <li>skpossession - Skater possession time</li>
            <li>skppg - Skater power play goals</li>
            <li>skshg - Skater short-handed goals</li>
          </ul>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Migration completed successfully. The ea_player_stats table now has all required columns.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Table Columns:</h3>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">
                  {result.map((col: any) => `${col.column_name} (${col.data_type})`).join("\n")}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runMigration} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run Migration
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
