"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, RefreshCw, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AuthDatabaseSync() {
  const { toast } = useToast()
  const [email, setEmail] = useState("ritchiemonias97@gmail.com")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Load saved admin key if available
  useState(() => {
    const savedKey = localStorage.getItem("mghl-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
    }
  })

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the user's email address",
        variant: "destructive",
      })
      return
    }

    if (!adminKey.trim()) {
      toast({
        title: "Admin key required",
        description: "Please enter your admin key",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      // Save admin key for future use
      localStorage.setItem("mghl-admin-key", adminKey)

      const response = await fetch("/api/admin/sync-auth-to-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync user")
      }

      setResult(data)

      toast({
        title: "Sync Successful",
        description: `User ${email} has been synced successfully`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error syncing user:", error)

      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to sync user",
      })

      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Auth to Database Sync
        </CardTitle>
        <CardDescription>Sync a user from Supabase Auth to database tables</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.details && (
                  <div className="mt-2 text-sm">
                    <p>
                      <strong>Auth User ID:</strong> {result.details.authUserId}
                    </p>
                    <p>
                      <strong>Public User ID:</strong> {result.details.publicUserId}
                    </p>
                    <p>
                      <strong>Email:</strong> {result.details.email}
                    </p>
                    <p>
                      <strong>Verified:</strong> {result.details.verified ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing User...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Sync User
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">What this tool does:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Finds user in Supabase Auth system</li>
            <li>• Creates missing record in public.users table</li>
            <li>• Creates missing record in players table</li>
            <li>• Creates missing record in user_roles table</li>
            <li>• Ensures all data is properly synced</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
