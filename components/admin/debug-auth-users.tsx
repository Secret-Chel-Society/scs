"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, RefreshCw, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DebugAuthUsers() {
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

  const handleDebug = async (e: React.FormEvent) => {
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

      const response = await fetch("/api/admin/debug-auth-users", {
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
        throw new Error(data.error || "Failed to debug auth users")
      }

      setResult(data)

      toast({
        title: "Debug Complete",
        description: `Found ${data.debug.totalUsers} total users in auth system`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error debugging auth users:", error)

      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to debug auth users",
      })

      toast({
        title: "Debug Failed",
        description: error instanceof Error ? error.message : "Failed to debug auth users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Debug Auth Users
        </CardTitle>
        <CardDescription>Debug and search for users in the Supabase Auth system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDebug} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Debug Auth Users
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Debug Complete" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.success ? `Found ${result.debug.totalUsers} total users` : result.message}
              </AlertDescription>
            </Alert>

            {result.success && result.debug && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Search Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Total Users:</strong> {result.debug.totalUsers}
                      </div>
                      <div>
                        <strong>Search Email:</strong> {result.debug.searchEmail}
                      </div>
                      <div>
                        <strong>Found by List:</strong>{" "}
                        <span className={result.debug.foundByList ? "text-green-600" : "text-red-600"}>
                          {result.debug.foundByList ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <strong>Found by Direct:</strong>{" "}
                        <span className={result.debug.foundByDirect ? "text-green-600" : "text-red-600"}>
                          {result.debug.foundByDirect ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {result.debug.targetUser && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Target User (Found by List):</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                          {JSON.stringify(result.debug.targetUser, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.debug.directUser && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Direct User (Found by Email):</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                          {JSON.stringify(result.debug.directUser, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.debug.similarEmails && result.debug.similarEmails.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Similar Emails:</h4>
                        <div className="space-y-2">
                          {result.debug.similarEmails.map((user: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <div>
                                <strong>Email:</strong> {user.email}
                              </div>
                              <div>
                                <strong>ID:</strong> {user.id}
                              </div>
                              <div>
                                <strong>Created:</strong> {user.created_at}
                              </div>
                              <div>
                                <strong>Verified:</strong> {user.email_confirmed_at ? "Yes" : "No"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">First 5 Users in System:</h4>
                      <div className="space-y-2">
                        {result.debug.firstFewUsers.map((user: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            <div>
                              <strong>Email:</strong> {user.email}
                            </div>
                            <div>
                              <strong>ID:</strong> {user.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">What this tool does:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Searches for users using direct email lookup</li>
            <li>• Falls back to paginated list search</li>
            <li>• Shows total user count in auth system</li>
            <li>• Finds similar email addresses</li>
            <li>• Displays detailed user information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
