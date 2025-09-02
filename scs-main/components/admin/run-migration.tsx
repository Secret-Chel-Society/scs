"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2 } from "lucide-react"

interface RunMigrationProps {
  title: string
  description: string
  migrationName: string
  buttonText?: string
  successText?: string
}

export function RunMigration({
  title,
  description,
  migrationName,
  buttonText = "Run Migration",
  successText = "Migration completed successfully",
}: RunMigrationProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleRunMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/run-migration/${migrationName}`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Success",
        description: successText,
      })
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Migration completed successfully</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This will create the necessary database tables and functions for the trade system.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleRunMigration}
          disabled={isLoading || isComplete}
          className={isComplete ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Completed
            </>
          ) : (
            buttonText
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
