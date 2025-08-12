"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Search, User, Database, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface DebugResult {
  searchEmail: string
  exactMatches: {
    auth: any
    database: any
  }
  similarUsers: {
    auth: any[]
    database: any[]
  }
  recentSignIns: any[]
  verificationTokens: any[]
  totals: {
    authUsers: number
    dbUsers: number
  }
  debug: {
    authUsersPreview: any[]
    dbUsersPreview: any[]
  }
}

export default function DebugUserSession() {
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DebugResult | null>(null)
  const { toast } = useToast()

  const handleDebug = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    if (!adminKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter admin verification key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/debug-user-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to debug user session")
      }

      setResult(data)
      toast({
        title: "Debug Complete",
        description: "User session debug completed successfully",
      })
    } catch (error: any) {
      console.error("Debug error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to debug user session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Debug User Session
          </CardTitle>
          <CardDescription>Debug user authentication and session issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Verification Key</Label>
              <Input
                id="adminKey"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleDebug} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Debug User Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Search Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Search Summary</CardTitle>
              <CardDescription>Results for: {result.searchEmail}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <span>Auth User:</span>
                  {result.exactMatches.auth ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Found
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Database User:</span>
                  {result.exactMatches.database ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Found
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Verification Tokens:</span>
                  <Badge variant={result.verificationTokens.length > 0 ? "default" : "secondary"}>
                    {result.verificationTokens.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Total Auth Users:</span>
                  <Badge variant="outline">{result.totals.authUsers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Database Users:</span>
                  <Badge variant="outline">{result.totals.dbUsers}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exact Matches */}
          {(result.exactMatches.auth || result.exactMatches.database) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Exact Matches Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.exactMatches.auth && (
                  <div>
                    <h4 className="font-semibold mb-2">Auth User</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <p>
                        <strong>ID:</strong> {result.exactMatches.auth.id}
                      </p>
                      <p>
                        <strong>Email:</strong> {result.exactMatches.auth.email}
                      </p>
                      <p>
                        <strong>Created:</strong> {formatDate(result.exactMatches.auth.created_at)}
                      </p>
                      <p>
                        <strong>Last Sign In:</strong>{" "}
                        {result.exactMatches.auth.last_sign_in_at
                          ? formatDate(result.exactMatches.auth.last_sign_in_at)
                          : "Never"}
                      </p>
                      <p>
                        <strong>Email Confirmed:</strong> {result.exactMatches.auth.email_confirmed_at ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}
                {result.exactMatches.database && (
                  <div>
                    <h4 className="font-semibold mb-2">Database User</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <p>
                        <strong>ID:</strong> {result.exactMatches.database.id}
                      </p>
                      <p>
                        <strong>Email:</strong> {result.exactMatches.database.email}
                      </p>
                      <p>
                        <strong>Username:</strong> {result.exactMatches.database.username || "Not set"}
                      </p>
                      <p>
                        <strong>Created:</strong> {formatDate(result.exactMatches.database.created_at)}
                      </p>
                      <p>
                        <strong>Verified:</strong> {result.exactMatches.database.email_verified ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Similar Users */}
          {(result.similarUsers.auth.length > 0 || result.similarUsers.database.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Similar Users Found
                </CardTitle>
                <CardDescription>Users with similar email addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.similarUsers.auth.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Similar Auth Users</h4>
                    <div className="space-y-2">
                      {result.similarUsers.auth.map((user, index) => (
                        <div key={index} className="bg-muted p-2 rounded">
                          <p>
                            <strong>Email:</strong> {user.email}
                          </p>
                          <p>
                            <strong>Last Sign In:</strong>{" "}
                            {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.similarUsers.database.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Similar Database Users</h4>
                    <div className="space-y-2">
                      {result.similarUsers.database.map((user, index) => (
                        <div key={index} className="bg-muted p-2 rounded">
                          <p>
                            <strong>Email:</strong> {user.email}
                          </p>
                          <p>
                            <strong>Username:</strong> {user.username || "Not set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Sign-ins */}
          {result.recentSignIns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Sign-ins (Last 24 Hours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recentSignIns.map((user, index) => (
                    <div key={index} className="bg-muted p-2 rounded">
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p>
                        <strong>Last Sign In:</strong> {formatDate(user.last_sign_in_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Tokens */}
          {result.verificationTokens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.verificationTokens.map((token, index) => (
                    <div key={index} className="bg-muted p-2 rounded">
                      <p>
                        <strong>Token:</strong> {token.token}
                      </p>
                      <p>
                        <strong>Created:</strong> {formatDate(token.created_at)}
                      </p>
                      <p>
                        <strong>Used:</strong> {token.used_at ? formatDate(token.used_at) : "Not used"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>Sample data from the system for debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recent Auth Users Sample</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(result.debug.authUsersPreview, null, 2)}
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recent Database Users Sample</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-sm overflow-x-auto">{JSON.stringify(result.debug.dbUsersPreview, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
