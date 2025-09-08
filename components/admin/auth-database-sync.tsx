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
    const savedKey = localStorage.getItem("scs-admin-key")
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
      localStorage.setItem("scs-admin-key", adminKey)

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
    <Card className="w-full max-w-lg mx-auto hockey-premium-card">
      <CardHeader>
        <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
          <div className="hockey-feature-icon">
            <Database className="h-5 w-5 text-white" />
          </div>
          Auth to Database Sync
        </CardTitle>
        <CardDescription className="hockey-subtitle text-center">
          Sync a user from Supabase Auth to database tables with enhanced security validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-ice-blue-500" />
              User Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="hockey-form-enhanced"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="admin-key" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-rink-blue-500" />
              Admin Key
            </Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="hockey-form-enhanced"
              required
            />
          </div>

          {result && (
            <Alert 
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "hockey-premium-card border-assist-green-200 dark:border-assist-green-800 bg-assist-green-50 dark:bg-assist-green-900/20" : "hockey-premium-card border-goal-red-200 dark:border-goal-red-800"}
            >
              {result.success ? <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle className={result.success ? "text-assist-green-800 dark:text-assist-green-200" : ""}>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription className={result.success ? "text-assist-green-700 dark:text-assist-green-300" : ""}>
                {result.message}
                {result.details && (
                  <div className="mt-3 space-y-2 text-sm font-medium">
                    <div className="hockey-stats-grid">
                      <div className="hockey-stat-item">
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Auth User ID</div>
                        <div className="font-mono text-xs">{result.details.authUserId}</div>
                      </div>
                      <div className="hockey-stat-item">
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Public User ID</div>
                        <div className="font-mono text-xs">{result.details.publicUserId}</div>
                      </div>
                      <div className="hockey-stat-item">
                        <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Verified</div>
                        <div className={`text-xs font-semibold ${result.details.verified ? 'text-assist-green-600' : 'text-goal-red-600'}`}>
                          {result.details.verified ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full hockey-button-enhanced" disabled={loading}>
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

        <div className="mt-6 p-4 hockey-premium-card bg-gradient-to-br from-ice-blue-25 to-rink-blue-25 dark:from-ice-blue-950/30 dark:to-rink-blue-950/30">
          <h4 className="hockey-title text-lg mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-ice-blue-500" />
            What this tool does:
          </h4>
          <ul className="hockey-subtitle text-sm space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-ice-blue-500 rounded-full"></div>
              Finds user in Supabase Auth system
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-rink-blue-500 rounded-full"></div>
              Creates missing record in public.users table
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-assist-green-500 rounded-full"></div>
              Creates missing record in players table
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-goal-red-500 rounded-full"></div>
              Creates missing record in user_roles table
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-hockey-silver-500 rounded-full"></div>
              Ensures all data is properly synced
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
