"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FixSeasonIds() {
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  const migrations = [
    {
      id: "fix-null-season-ids",
      title: "Fix Null Season IDs",
      description: "Update season registrations with null season_id but valid season_number",
      endpoint: "/api/admin/run-migration/fix-null-season-ids",
      icon: Calendar,
    },
    {
      id: "fix-season-id-type",
      title: "Fix Season ID Type",
      description: "Ensure season IDs are properly typed as UUIDs",
      endpoint: "/api/admin/run-migration/fix-season-id-type",
      icon: Database,
    },
    {
      id: "fix-season-id-format",
      title: "Fix Season ID Format",
      description: "Fix season ID format and ensure consistency",
      endpoint: "/api/admin/run-migration/fix-season-id-format",
      icon: Database,
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
            <Calendar className="h-5 w-5 text-orange-500" />
            Season IDs Fix Suite
          </CardTitle>
          <CardDescription>
            Comprehensive suite for fixing season ID related issues in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This suite includes all necessary migrations to fix season ID related issues and ensure data consistency.
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
                Run All Season ID Fixes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="migrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="migrations">Individual Fixes</TabsTrigger>
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
                <h4 className="font-semibold mb-2">Fix Null Season IDs</h4>
                <p className="text-sm text-muted-foreground">
                  Updates season registrations that have a null season_id but a valid season_number, 
                  linking them to the correct season.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fix Season ID Type</h4>
                <p className="text-sm text-muted-foreground">
                  Ensures that all season IDs are properly typed as UUIDs and maintains data type consistency.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fix Season ID Format</h4>
                <p className="text-sm text-muted-foreground">
                  Fixes season ID format issues and ensures all season IDs follow the correct format.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
