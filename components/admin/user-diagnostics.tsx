"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Search, Send, UserPlus, RefreshCw, ShieldAlert } from "lucide-react"

export default function UserDiagnostics() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [lookupResults, setLookupResults] = useState<any>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [forceVerify, setForceVerify] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [fixVerificationLoading, setFixVerificationLoading] = useState(false)
  const [userData, setUserData] = useState({
    gamer_tag_id: "",
    primary_position: "Center",
    secondary_position: "",
    console: "Xbox",
  })

  // Load saved admin key if available
  useEffect(() => {
    const savedKey = localStorage.getItem("mghl-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
    }
  }, [])

  const handleLookup = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to look up",
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
      setLookupResults(null)

      // Save admin key for future use
      localStorage.setItem("mghl-admin-key", adminKey)

      console.log("Looking up user:", email)
      const response = await fetch("/api/admin/lookup-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
        }),
      })

      console.log("Lookup response status:", response.status)
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (e) {
          // If not JSON, use the text directly
          throw new Error(`Server error: ${errorText || response.status}`)
        }
      }

      const data = await response.json()
      setLookupResults(data.results)

      // If user is found in auth but not in public.users, pre-fill the create form
      if (data.results.status.inAuthSystem && !data.results.status.inPublicUsers) {
        const authUser = data.results.authUser
        const metadata = authUser.user_metadata || {}

        setUserData({
          gamer_tag_id: metadata.gamer_tag_id || authUser.email?.split("@")[0] || "",
          primary_position: metadata.primary_position || "Center",
          secondary_position: metadata.secondary_position || "",
          console: metadata.console || "Xbox",
        })
      }
    } catch (error) {
      console.error("Error looking up user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to look up user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendVerification = async () => {
    if (!email.trim() || !lookupResults) {
      return
    }

    try {
      setVerifyLoading(true)

      const response = await fetch("/api/admin/manual-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
          forceVerify,
        }),
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (e) {
          // If not JSON, use the text directly
          throw new Error(`Server error: ${errorText || response.status}`)
        }
      }

      const data = await response.json()

      toast({
        title: forceVerify ? "User Verified" : "Verification Email Sent",
        description: data.message,
        variant: "default",
      })

      // If we have a verification URL (for simulated emails), show it
      if (data.verificationUrl) {
        toast({
          title: "Verification URL (Development Only)",
          description: data.verificationUrl,
          variant: "default",
        })
      }

      // Refresh the lookup results
      handleLookup()
    } catch (error) {
      console.error("Error verifying user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify user",
        variant: "destructive",
      })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleFixVerificationStatus = async () => {
    if (!email.trim() || !lookupResults || !lookupResults.status.inAuthSystem) {
      return
    }

    try {
      setFixVerificationLoading(true)

      const response = await fetch("/api/admin/fix-verification-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          userId: lookupResults.authUser?.id,
          adminKey,
        }),
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (e) {
          // If not JSON, use the text directly
          throw new Error(`Server error: ${errorText || response.status}`)
        }
      }

      const data = await response.json()

      toast({
        title: "Verification Status Fixed",
        description: data.message,
        variant: "default",
      })

      // Refresh the lookup results
      handleLookup()
    } catch (error) {
      console.error("Error fixing verification status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix verification status",
        variant: "destructive",
      })
    } finally {
      setFixVerificationLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!email.trim() || !lookupResults || !lookupResults.status.inAuthSystem) {
      return
    }

    try {
      setCreateLoading(true)

      const response = await fetch("/api/admin/create-missing-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
          userData: {
            ...userData,
            secondary_position: userData.secondary_position || null,
          },
        }),
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (e) {
          // If not JSON, use the text directly
          throw new Error(`Server error: ${errorText || response.status}`)
        }
      }

      const data = await response.json()

      toast({
        title: "User Created",
        description: data.message,
        variant: "default",
      })

      // Refresh the lookup results
      handleLookup()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Diagnostics</CardTitle>
        <CardDescription>Look up and fix issues with user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex mt-1">
                <Input
                  id="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleLookup} disabled={loading || !email.trim()} className="ml-2">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {loading ? "Searching..." : "Lookup"}
                </Button>
              </div>
            </div>
            <div className="md:w-1/3">
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {lookupResults && (
            <Tabs defaultValue="status" className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Auth Status</h3>
                    <div className="flex items-center">
                      <Badge variant={lookupResults.status.inAuthSystem ? "default" : "destructive"} className="mr-2">
                        {lookupResults.status.inAuthSystem ? "Found" : "Not Found"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lookupResults.status.inAuthSystem
                          ? "User exists in auth system"
                          : "User not found in auth system"}
                      </span>
                    </div>

                    {lookupResults.status.inAuthSystem && (
                      <>
                        <div className="flex items-center">
                          <Badge
                            variant={lookupResults.status.isEmailConfirmed ? "default" : "destructive"}
                            className="mr-2"
                          >
                            {lookupResults.status.isEmailConfirmed ? "Verified" : "Not Verified"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {lookupResults.status.isEmailConfirmed ? "Email is confirmed" : "Email is not confirmed"}
                          </span>
                        </div>
                        {lookupResults.status.hasOwnProperty("isMetadataVerified") && (
                          <div className="flex items-center">
                            <Badge
                              variant={lookupResults.status.isMetadataVerified ? "default" : "destructive"}
                              className="mr-2"
                            >
                              {lookupResults.status.isMetadataVerified ? "Verified" : "Not Verified"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {lookupResults.status.isMetadataVerified
                                ? "User metadata shows verified"
                                : "User metadata shows not verified"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Database Status</h3>
                    <div className="flex items-center">
                      <Badge variant={lookupResults.status.inPublicUsers ? "default" : "destructive"} className="mr-2">
                        {lookupResults.status.inPublicUsers ? "Found" : "Not Found"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lookupResults.status.inPublicUsers
                          ? "User exists in public.users table"
                          : "User not found in public.users table"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Verification History</h3>
                    <div className="flex items-center">
                      <Badge
                        variant={lookupResults.status.hasVerificationLogs ? "default" : "secondary"}
                        className="mr-2"
                      >
                        {lookupResults.status.hasVerificationLogs ? "Found" : "None"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lookupResults.status.hasVerificationLogs
                          ? `${lookupResults.verificationLogs?.length || 0} verification log entries`
                          : "No verification logs found"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Badge
                        variant={lookupResults.status.hasVerificationTokens ? "default" : "secondary"}
                        className="mr-2"
                      >
                        {lookupResults.status.hasVerificationTokens ? "Found" : "None"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lookupResults.status.hasVerificationTokens
                          ? `${lookupResults.verificationTokens?.length || 0} verification tokens`
                          : "No verification tokens found"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Diagnosis</h3>
                    {lookupResults.status.inAuthSystem && !lookupResults.status.isEmailConfirmed && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Email Not Verified</AlertTitle>
                        <AlertDescription>
                          User exists but email is not verified. Try sending a verification email or use the Fix
                          Verification Status button.
                        </AlertDescription>
                      </Alert>
                    )}

                    {lookupResults.status.inAuthSystem &&
                      lookupResults.status.hasOwnProperty("isMetadataVerified") &&
                      lookupResults.status.isEmailConfirmed !== lookupResults.status.isMetadataVerified && (
                        <Alert variant="warning">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Verification Status Mismatch</AlertTitle>
                          <AlertDescription>
                            The email_confirmed_at field and user_metadata.email_verified are not in sync. Use the Fix
                            Verification Status button.
                          </AlertDescription>
                        </Alert>
                      )}

                    {lookupResults.status.inAuthSystem && !lookupResults.status.inPublicUsers && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Missing User Record</AlertTitle>
                        <AlertDescription>
                          User exists in auth but not in the public.users table. Create a user record.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!lookupResults.status.inAuthSystem && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>User Not Found</AlertTitle>
                        <AlertDescription>
                          User does not exist in the auth system. They need to register.
                        </AlertDescription>
                      </Alert>
                    )}

                    {lookupResults.status.inAuthSystem &&
                      lookupResults.status.isEmailConfirmed &&
                      (!lookupResults.status.hasOwnProperty("isMetadataVerified") ||
                        lookupResults.status.isMetadataVerified) &&
                      lookupResults.status.inPublicUsers && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>User Account Healthy</AlertTitle>
                          <AlertDescription>
                            User exists, is verified, and has a complete user record. No issues detected.
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {lookupResults.authUser && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Auth User Details</h3>
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(lookupResults.authUser, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {lookupResults.publicUser && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Public User Details</h3>
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(lookupResults.publicUser, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {!lookupResults.authUser && !lookupResults.publicUser && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No User Data</AlertTitle>
                    <AlertDescription>No user details found in either auth or public.users tables.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                {lookupResults.verificationLogs && lookupResults.verificationLogs.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Verification Logs</h3>
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(lookupResults.verificationLogs, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Verification Logs</AlertTitle>
                    <AlertDescription>No verification logs found for this user.</AlertDescription>
                  </Alert>
                )}

                {lookupResults.verificationTokens && lookupResults.verificationTokens.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Verification Tokens</h3>
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(lookupResults.verificationTokens, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Verification Tokens</AlertTitle>
                    <AlertDescription>No verification tokens found for this user.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                {lookupResults.status.inAuthSystem && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Verification Actions</h3>

                    <Button
                      onClick={handleFixVerificationStatus}
                      disabled={fixVerificationLoading || !lookupResults.status.inAuthSystem}
                      className="w-full mb-2"
                      variant="destructive"
                    >
                      {fixVerificationLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 mr-2" />
                      )}
                      {fixVerificationLoading ? "Fixing..." : "Fix Verification Status"}
                    </Button>

                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                        id="force-verify"
                        checked={forceVerify}
                        onCheckedChange={(checked) => setForceVerify(checked as boolean)}
                      />
                      <label
                        htmlFor="force-verify"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Force verify (skip email verification)
                      </label>
                    </div>
                    <Button
                      onClick={handleSendVerification}
                      disabled={verifyLoading || !lookupResults.status.inAuthSystem}
                      className="w-full"
                    >
                      {verifyLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {verifyLoading
                        ? forceVerify
                          ? "Verifying..."
                          : "Sending..."
                        : forceVerify
                          ? "Force Verify User"
                          : "Send Verification Email"}
                    </Button>
                  </div>
                )}

                {lookupResults.status.inAuthSystem && !lookupResults.status.inPublicUsers && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-sm font-medium">Create User Record</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gamer-tag">Gamer Tag</Label>
                        <Input
                          id="gamer-tag"
                          value={userData.gamer_tag_id}
                          onChange={(e) => setUserData({ ...userData, gamer_tag_id: e.target.value })}
                          placeholder="Gamer Tag"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="console">Console</Label>
                        <Select
                          value={userData.console}
                          onValueChange={(value) => setUserData({ ...userData, console: value })}
                        >
                          <SelectTrigger id="console">
                            <SelectValue placeholder="Select console" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Xbox">Xbox</SelectItem>
                            <SelectItem value="PS5">PS5</SelectItem>
                            <SelectItem value="XSX">XSX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primary-position">Primary Position</Label>
                        <Select
                          value={userData.primary_position}
                          onValueChange={(value) => setUserData({ ...userData, primary_position: value })}
                        >
                          <SelectTrigger id="primary-position">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Center">Center</SelectItem>
                            <SelectItem value="Left Wing">Left Wing</SelectItem>
                            <SelectItem value="Right Wing">Right Wing</SelectItem>
                            <SelectItem value="Left Defense">Left Defense</SelectItem>
                            <SelectItem value="Right Defense">Right Defense</SelectItem>
                            <SelectItem value="Goalie">Goalie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-position">Secondary Position (Optional)</Label>
                        <Select
                          value={userData.secondary_position || "None"}
                          onValueChange={(value) =>
                            setUserData({ ...userData, secondary_position: value === "None" ? "" : value })
                          }
                        >
                          <SelectTrigger id="secondary-position">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Center">Center</SelectItem>
                            <SelectItem value="Left Wing">Left Wing</SelectItem>
                            <SelectItem value="Right Wing">Right Wing</SelectItem>
                            <SelectItem value="Left Defense">Left Defense</SelectItem>
                            <SelectItem value="Right Defense">Right Defense</SelectItem>
                            <SelectItem value="Goalie">Goalie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateUser}
                      disabled={
                        createLoading || !userData.gamer_tag_id || !userData.primary_position || !userData.console
                      }
                      className="w-full"
                    >
                      {createLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      {createLoading ? "Creating..." : "Create User Record"}
                    </Button>
                  </div>
                )}

                {!lookupResults.status.inAuthSystem && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>User Not Found</AlertTitle>
                    <AlertDescription>
                      User does not exist in the auth system. They need to register before any actions can be taken.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
