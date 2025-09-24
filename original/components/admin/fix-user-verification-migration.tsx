"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle } from "lucide-react"

export default function FixUserVerificationMigration() {
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    if (!adminKey) {
      toast({
        title: "Admin key required",
        description: "Please enter the admin key to run this migration",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsComplete(false)

    try {
      const response = await fetch("/api/admin/run-migration/fix-user-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration successful",
        description: data.message || "User verification status fixed successfully",
      })
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
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
        <CardTitle>Fix User Verification Status</CardTitle>
        <CardDescription>
          This migration fixes verification status for all users by ensuring they are properly verified in the auth
          system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminKey">Admin Key</Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading || isComplete} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Migration...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Migration Complete
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
