"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"

export function ForumTablesFixedMigration() {
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    if (!adminKey.trim()) {
      setResult({ success: false, message: "Admin verification key is required" })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/forum-tables-fixed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Migration failed" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Forum Tables Fixed Migration
        </CardTitle>
        <CardDescription>
          This migration will create the forum tables with proper user relationships and only General/Announcements
          categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="adminKey" className="block text-sm font-medium mb-2">
            Admin Verification Key
          </label>
          <Input
            id="adminKey"
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin verification key"
            disabled={isLoading}
          />
        </div>

        <Button onClick={runMigration} disabled={isLoading || !adminKey.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Run Forum Tables Fixed Migration
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-500" : "border-red-500"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>This migration will:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Drop and recreate all forum tables with proper relationships</li>
            <li>Create only "General" and "Announcements" categories</li>
            <li>Set up proper foreign key constraints to auth.users</li>
            <li>Configure Row Level Security policies</li>
            <li>Create necessary indexes for performance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
