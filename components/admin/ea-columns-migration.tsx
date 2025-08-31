"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2, Trophy, Users, Gamepad2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function EaColumnsMigration() {
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  const migrations = [
    {
      id: "add-missing-ea-columns",
      title: "Add Missing EA Player Stats Columns",
      description: "Add missing columns to the EA player stats table (skppg, glshots, etc.)",
      endpoint: "/api/admin/run-migration/add-missing-ea-columns",
      icon: Gamepad2,
    },
    {
      id: "add-more-ea-columns",
      title: "Add Additional EA Player Stats Columns",
      description: "Add more columns for additional statistics like zone time, faceoffs, etc.",
      endpoint: "/api/admin/run-migration/add-more-ea-columns",
      icon: Database,
    },
    {
      id: "ea-player-stats-columns",
      title: "EA Player Stats Columns",
      description: "Add new columns to the EA player stats table for additional statistics",
      endpoint: "/api/admin/run-migration/ea-player-stats-columns",
      icon: Users,
    },
  ]

  const runMigration = async (migrationId: string, endpoint: string) => {
    try {
      setIsRunning(migrationId)
      setResults(prev => ({ ...prev, [migrationId]: { success: false, message: "" } }))

      const response = await fetch(endpoint, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      const result = {
        success: true,
        message: data.message || "Migration completed successfully",
      }

      setResults(prev => ({ ...prev, [migrationId]: result }))

      toast({
        title: "Migration Successful",
        description: `${migrations.find(m => m.id === migrationId)?.title} has been completed.`,
      })
    } catch (error: any) {
      console.error(`Migration error for ${migrationId}:`, error)
      const result = {
        success: false,
        message: error.message || "An error occurred while running the migration",
      }

      setResults(prev => ({ ...prev, [migrationId]: result }))

      toast({
        title: "Migration Failed",
        description: error.message || `Failed to run ${migrations.find(m => m.id === migrationId)?.title}`,
        variant: "destructive",
      })
    } finally {
      setIsRunning(null)
    }
  }

  const runAllMigrations = async () => {
    for (const migration of migrations) {
      await runMigration(migration.id, migration.endpoint)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            EA Columns Migration Suite
          </CardTitle>
          <CardDescription>
            Comprehensive migration suite for EA Sports NHL database columns and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This migration suite includes all necessary EA-related column migrations to ensure your database
            has all the required fields for EA Sports NHL statistics and player data.
          </p>
          
          <Button 
            onClick={runAllMigrations} 
            disabled={isRunning !== null}
            className="w-full mb-4"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running All Migrations...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run All EA Migrations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="migrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="migrations">Individual Migrations</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="migrations" className="space-y-4">
          {migrations.map((migration) => {
            const IconComponent = migration.icon
            const result = results[migration.id]
            const isRunningThis = isRunning === migration.id

            return (
              <Card key={migration.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-blue-500" />
                    {migration.title}
                  </CardTitle>
                  <CardDescription>{migration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {result && (
                    <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
                      {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => runMigration(migration.id, migration.endpoint)}
                    disabled={isRunningThis}
                    className="w-full"
                  >
                    {isRunningThis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Migration...
                      </>
                    ) : (
                      "Run Migration"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Migration Overview</CardTitle>
              <CardDescription>What each migration does</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Add Missing EA Player Stats Columns</h4>
                <p className="text-sm text-muted-foreground">
                  Adds missing columns like skppg (short-handed goals per game), glshots (goals against), 
                  and other essential EA Sports NHL statistics that might be missing from the database.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Add Additional EA Player Stats Columns</h4>
                <p className="text-sm text-muted-foreground">
                  Adds advanced statistics including time on ice in different zones, shot attempts, 
                  faceoff percentages, and other detailed player metrics from EA Sports NHL.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">EA Player Stats Columns</h4>
                <p className="text-sm text-muted-foreground">
                  Adds new columns for interceptions, faceoffs, penalties drawn, and other 
                  comprehensive player statistics to support full EA Sports NHL data integration.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
