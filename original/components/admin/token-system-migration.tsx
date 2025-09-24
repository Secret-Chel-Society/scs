"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle, Coins } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TokenSystemMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/token-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(data.message)
      toast({
        title: "Migration Successful",
        description: "Token system has been set up successfully",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message)
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Token System Migration
        </CardTitle>
        <CardDescription>
          Set up the complete token system including tables for tokens, transactions, redeemables, redemptions, and
          raffles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Migration Successful</AlertTitle>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">This migration will create:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• tokens table - track user token balances</li>
            <li>• token_transactions table - track all token activity</li>
            <li>• token_redeemables table - items players can buy</li>
            <li>• token_redemptions table - redemption requests</li>
            <li>• token_raffles table - raffle management</li>
            <li>• token_raffle_entries table - raffle entries</li>
            <li>• Default redeemable items (IR, Trade Request, Unban, etc.)</li>
            <li>• Indexes for performance</li>
            <li>• Functions for token balance management</li>
          </ul>
        </div>

        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Run Token System Migration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
