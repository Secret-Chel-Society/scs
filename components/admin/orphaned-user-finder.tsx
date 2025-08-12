"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Search, Trash2, Plus, CheckCircle, X } from "lucide-react"

interface UserDiagnostic {
  email: string
  authUser: any
  customUser: any
  playerRecord: any
  verificationToken: any
  issues: string[]
}

export function OrphanedUserFinder() {
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UserDiagnostic | null>(null)
  const [fixing, setFixing] = useState(false)
  const { toast } = useToast()

  const searchUser = async () => {
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
        description: "Please enter admin key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/find-orphaned-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search user")
      }

      setResult(data.result)

      if (data.result.issues.length === 0) {
        toast({
          title: "No Issues Found",
          description: "User account appears to be properly configured",
        })
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fixUser = async (action: string, actionName: string) => {
    if (!result || !adminKey.trim()) return

    setFixing(true)
    try {
      const response = await fetch("/api/admin/fix-orphaned-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.email,
          action,
          adminKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix user")
      }

      toast({
        title: "Success",
        description: data.message,
      })

      // Refresh the search results
      await searchUser()
    } catch (error: any) {
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orphaned User Finder</CardTitle>
          <CardDescription>
            Find and fix users that exist in Auth but not in the database, or vice versa
          </CardDescription>
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
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={searchUser} disabled={loading} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Searching..." : "Search User"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Issues Summary */}
          {result.issues.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Issues Found:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {result.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Auth User Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Supabase Auth User
                {result.authUser ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Found
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    <X className="mr-1 h-3 w-3" />
                    Not Found
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.authUser ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>ID:</strong> {result.authUser.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.authUser.email}
                  </p>
                  <p>
                    <strong>Confirmed:</strong> {result.authUser.email_confirmed_at ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Created:</strong> {new Date(result.authUser.created_at).toLocaleString()}
                  </p>
                  {result.authUser.last_sign_in_at && (
                    <p>
                      <strong>Last Sign In:</strong> {new Date(result.authUser.last_sign_in_at).toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {!result.authUser.email_confirmed_at && (
                      <Button size="sm" onClick={() => fixUser("verify_email", "Verify Email")} disabled={fixing}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verify Email
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => fixUser("delete_auth_user", "Delete Auth User")}
                      disabled={fixing}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete Auth User
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No auth user found with this email</p>
              )}
            </CardContent>
          </Card>

          {/* Custom User Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Custom Users Table
                {result.customUser ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Found
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    <X className="mr-1 h-3 w-3" />
                    Not Found
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.customUser ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>ID:</strong> {result.customUser.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.customUser.email}
                  </p>
                  <p>
                    <strong>Gamer Tag:</strong> {result.customUser.gamer_tag_id || "Not set"}
                  </p>
                  <p>
                    <strong>Active:</strong> {result.customUser.is_active ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Created:</strong> {new Date(result.customUser.created_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-4">No custom user record found</p>
                  {result.authUser && (
                    <Button
                      size="sm"
                      onClick={() => fixUser("create_custom_user", "Create Custom User")}
                      disabled={fixing}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Create Custom User Record
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Record Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Player Record
                {result.playerRecord ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Found
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    <X className="mr-1 h-3 w-3" />
                    Not Found
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.playerRecord ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>ID:</strong> {result.playerRecord.id}
                  </p>
                  <p>
                    <strong>Role:</strong> {result.playerRecord.role}
                  </p>
                  <p>
                    <strong>Team ID:</strong> {result.playerRecord.team_id || "No team"}
                  </p>
                  <p>
                    <strong>Salary:</strong> ${result.playerRecord.salary?.toLocaleString() || "0"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No player record found</p>
              )}
            </CardContent>
          </Card>

          {/* Verification Tokens */}
          {result.verificationToken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pending Verification Token
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Created:</strong> {new Date(result.verificationToken.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Expires:</strong> {new Date(result.verificationToken.expires_at).toLocaleString()}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fixUser("delete_verification_tokens", "Delete Verification Tokens")}
                    disabled={fixing}
                    className="mt-4"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete Verification Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
