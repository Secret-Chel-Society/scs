"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function FixUserRolesConstraint() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/fix-user-roles-constraint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({
        success: true,
        message: data.message || "User roles constraint fixed successfully",
      })

      toast({
        title: "Success",
        description: "User roles constraint has been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error fixing user roles constraint:", error)
      setResult({
        success: false,
        message: error.message || "Failed to fix user roles constraint",
      })

      toast({
        title: "Error",
        description: error.message || "Failed to fix user roles constraint",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix User Roles Constraint</CardTitle>
        <CardDescription>
          Update the database constraint to allow all necessary roles (Player, GM, AGM, Owner, Admin)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This migration will update the constraint on the user_roles table to allow all the necessary roles. Run this
          if you're experiencing errors when assigning roles.
        </p>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              )}
              <div>
                <h3 className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                  {result.success ? "Success" : "Error"}
                </h3>
                <p className={`mt-1 text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>
              </div>
            </div>
          </div>
        )}

        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardContent>
    </Card>
  )
}
