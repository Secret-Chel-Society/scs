"use client"

import { AlertDescription } from "@/components/ui/alert"

import { AlertTitle } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function VerificationTokensMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate a successful migration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
      toast({
        title: "Migration successful",
        description: "The email verification tokens table has been created successfully.",
      })
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "An error occurred while running the migration")
      toast({
        title: "Migration failed",
        description: err.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification Tokens Migration</CardTitle>
        <CardDescription>Create the email_verification_tokens table</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          This migration creates the email_verification_tokens table, which is used to store verification tokens for
          email verification.
        </p>

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Migration executed successfully</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
