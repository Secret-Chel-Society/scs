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
import { 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Send, 
  UserPlus, 
  RefreshCw, 
  ShieldAlert,
  Stethoscope,
  Activity,
  Database,
  Shield,
  Settings
} from "lucide-react"

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
    const savedKey = localStorage.getItem("scs-admin-key")
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
      localStorage.setItem("scs-admin-key", adminKey)

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
    <Card className="w-full bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          User Diagnostics
        </CardTitle>
        <CardDescription className="text-white/70">Look up and fix issues with user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <div className="flex mt-1">
                <Input
                  id="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
                <Button 
                  onClick={handleLookup} 
                  disabled={loading || !email.trim()} 
                  className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {loading ? "Searching..." : "Lookup"}
                </Button>
              </div>
            </div>
            <div className="md:w-1/3">
              <Label htmlFor="admin-key" className="text-white">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="mt-1 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          {lookupResults && (
            <Tabs defaultValue="status" className="mt-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-white/20">
                <TabsTrigger value="status" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Status</TabsTrigger>
                <TabsTrigger value="details" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">User Details</TabsTrigger>
                <TabsTrigger value="verification" className="text-white data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">Verification</TabsTrigger>
                <TabsTrigger value="actions" className="text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-white">Auth Status</h3>
                    <div className="flex items-center">
                      <Badge 
                        variant={lookupResults.status.inAuthSystem ? "default" : "destructive"} 
                        className={`mr-2 ${
                          lookupResults.status.inAuthSystem 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {lookupResults.status.inAuthSystem ? "Found" : "Not Found"}
                      </Badge>
                      <span className="text-sm text-white/70">
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
                            className={`mr-2 ${
                              lookupResults.status.isEmailConfirmed 
                                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {lookupResults.status.isEmailConfirmed ? "Verified" : "Not Verified"}
                          </Badge>
                          <span className="text-sm text-white/70">
                            {lookupResults.status.isEmailConfirmed ? "Email is confirmed" : "Email is not confirmed"}
                          </span>
                        </div>
                        {lookupResults.status.hasOwnProperty("isMetadataVerified") && (
                          <div className="flex items-center">
                            <Badge
                              variant={lookupResults.status.isMetadataVerified ? "default" : "destructive"}
                              className={`mr-2 ${
                                lookupResults.status.isMetadataVerified 
                                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              }`}
                            >
                              {lookupResults.status.isMetadataVerified ? "Verified" : "Not Verified"}
                            </Badge>
                            <span className="text-sm text-white/70">
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
                    <h3 className="text-sm font-medium text-white">Database Status</h3>
                    <div className="flex items-center">
                      <Badge 
                        variant={lookupResults.status.inPublicUsers ? "default" : "destructive"} 
                        className={`mr-2 ${
                          lookupResults.status.inPublicUsers 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {lookupResults.status.inPublicUsers ? "Found" : "Not Found"}
                      </Badge>
                      <span className="text-sm text-white/70">
                        {lookupResults.status.inPublicUsers
                          ? "User exists in public.users table"
                          : "User not found in public.users table"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-white">Verification History</h3>
                    <div className="flex items-center">
                      <Badge
                        variant={lookupResults.status.hasVerificationLogs ? "default" : "secondary"}
                        className={`mr-2 ${
                          lookupResults.status.hasVerificationLogs 
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {lookupResults.status.hasVerificationLogs ? "Found" : "None"}
                      </Badge>
                      <span className="text-sm text-white/70">
                        {lookupResults.status.hasVerificationLogs
                          ? `${lookupResults.verificationLogs?.length || 0} verification log entries`
                          : "No verification logs found"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Badge
                        variant={lookupResults.status.hasVerificationTokens ? "default" : "secondary"}
                        className={`mr-2 ${
                          lookupResults.status.hasVerificationTokens 
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {lookupResults.status.hasVerificationTokens ? "Found" : "None"}
                      </Badge>
                      <span className="text-sm text-white/70">
                        {lookupResults.status.hasVerificationTokens
                          ? `${lookupResults.verificationTokens?.length || 0} verification tokens`
                          : "No verification tokens found"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-white">Diagnosis</h3>
                    {lookupResults.status.inAuthSystem && !lookupResults.status.isEmailConfirmed && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertTitle className="text-red-400">Email Not Verified</AlertTitle>
                        <AlertDescription className="text-red-300/80">
                          User exists but email is not verified. Try sending a verification email or use the Fix
                          Verification Status button.
                        </AlertDescription>
                      </Alert>
                    )}

                    {lookupResults.status.inAuthSystem &&
                      lookupResults.status.hasOwnProperty("isMetadataVerified") &&
                      lookupResults.status.isEmailConfirmed !== lookupResults.status.isMetadataVerified && (
                        <Alert variant="warning" className="bg-amber-500/10 border-amber-500/20">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <AlertTitle className="text-amber-400">Verification Status Mismatch</AlertTitle>
                          <AlertDescription className="text-amber-300/80">
                            The email_confirmed_at field and user_metadata.email_verified are not in sync. Use the Fix
                            Verification Status button.
                          </AlertDescription>
                        </Alert>
                      )}

                    {lookupResults.status.inAuthSystem && !lookupResults.status.inPublicUsers && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertTitle className="text-red-400">Missing User Record</AlertTitle>
                        <AlertDescription className="text-red-300/80">
                          User exists in auth but not in the public.users table. Create a user record.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!lookupResults.status.inAuthSystem && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertTitle className="text-red-400">User Not Found</AlertTitle>
                        <AlertDescription className="text-red-300/80">
                          User does not exist in the auth system. They need to register.
                        </AlertDescription>
                      </Alert>
                    )}

                    {lookupResults.status.inAuthSystem &&
                      lookupResults.status.isEmailConfirmed &&
                      (!lookupResults.status.hasOwnProperty("isMetadataVerified") ||
                        lookupResults.status.isMetadataVerified) &&
                      lookupResults.status.inPublicUsers && (
                        <Alert className="bg-green-500/10 border-green-500/20">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <AlertTitle className="text-green-400">User Account Healthy</AlertTitle>
                          <AlertDescription className="text-green-300/80">
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
                    <h3 className="text-sm font-medium text-white">Auth User Details</h3>
                    <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                      <pre className="text-xs text-white/80">{JSON.stringify(lookupResults.authUser, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {lookupResults.publicUser && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Public User Details</h3>
                    <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                      <pre className="text-xs text-white/80">{JSON.stringify(lookupResults.publicUser, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {!lookupResults.authUser && !lookupResults.publicUser && (
                  <Alert className="bg-slate-800/50 border-white/20">
                    <AlertCircle className="h-4 w-4 text-white/70" />
                    <AlertTitle className="text-white">No User Data</AlertTitle>
                    <AlertDescription className="text-white/70">No user details found in either auth or public.users tables.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                {lookupResults.verificationLogs && lookupResults.verificationLogs.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Verification Logs</h3>
                    <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                      <pre className="text-xs text-white/80">{JSON.stringify(lookupResults.verificationLogs, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <Alert className="bg-slate-800/50 border-white/20">
                    <AlertCircle className="h-4 w-4 text-white/70" />
                    <AlertTitle className="text-white">No Verification Logs</AlertTitle>
                    <AlertDescription className="text-white/70">No verification logs found for this user.</AlertDescription>
                  </Alert>
                )}

                {lookupResults.verificationTokens && lookupResults.verificationTokens.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Verification Tokens</h3>
                    <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                      <pre className="text-xs text-white/80">{JSON.stringify(lookupResults.verificationTokens, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <Alert className="bg-slate-800/50 border-white/20">
                    <AlertCircle className="h-4 w-4 text-white/70" />
                    <AlertTitle className="text-white">No Verification Tokens</AlertTitle>
                    <AlertDescription className="text-white/70">No verification tokens found for this user.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                {lookupResults.status.inAuthSystem && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Verification Actions</h3>

                    <Button
                      onClick={handleFixVerificationStatus}
                      disabled={fixVerificationLoading || !lookupResults.status.inAuthSystem}
                      className="w-full mb-2 bg-red-500 hover:bg-red-600 text-white"
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
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                      >
                        Force verify (skip email verification)
                      </label>
                    </div>
                    <Button
                      onClick={handleSendVerification}
                      disabled={verifyLoading || !lookupResults.status.inAuthSystem}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
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
                    <Separator className="bg-white/20" />
                    <h3 className="text-sm font-medium text-white">Create User Record</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gamer-tag" className="text-white">Gamer Tag</Label>
                        <Input
                          id="gamer-tag"
                          value={userData.gamer_tag_id}
                          onChange={(e) => setUserData({ ...userData, gamer_tag_id: e.target.value })}
                          placeholder="Gamer Tag"
                          className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="console" className="text-white">Console</Label>
                        <Select
                          value={userData.console}
                          onValueChange={(value) => setUserData({ ...userData, console: value })}
                        >
                          <SelectTrigger id="console" className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select console" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="Xbox" className="text-white hover:bg-slate-700">Xbox</SelectItem>
                            <SelectItem value="PS5" className="text-white hover:bg-slate-700">PS5</SelectItem>
                            <SelectItem value="XSX" className="text-white hover:bg-slate-700">XSX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primary-position" className="text-white">Primary Position</Label>
                        <Select
                          value={userData.primary_position}
                          onValueChange={(value) => setUserData({ ...userData, primary_position: value })}
                        >
                          <SelectTrigger id="primary-position" className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="Center" className="text-white hover:bg-slate-700">Center</SelectItem>
                            <SelectItem value="Left Wing" className="text-white hover:bg-slate-700">Left Wing</SelectItem>
                            <SelectItem value="Right Wing" className="text-white hover:bg-slate-700">Right Wing</SelectItem>
                            <SelectItem value="Left Defense" className="text-white hover:bg-slate-700">Left Defense</SelectItem>
                            <SelectItem value="Right Defense" className="text-white hover:bg-slate-700">Right Defense</SelectItem>
                            <SelectItem value="Goalie" className="text-white hover:bg-slate-700">Goalie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-position" className="text-white">Secondary Position (Optional)</Label>
                        <Select
                          value={userData.secondary_position || "None"}
                          onValueChange={(value) =>
                            setUserData({ ...userData, secondary_position: value === "None" ? "" : value })
                          }
                        >
                          <SelectTrigger id="secondary-position" className="bg-slate-800/50 border-white/20 text-white">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="None" className="text-white hover:bg-slate-700">None</SelectItem>
                            <SelectItem value="Center" className="text-white hover:bg-slate-700">Center</SelectItem>
                            <SelectItem value="Left Wing" className="text-white hover:bg-slate-700">Left Wing</SelectItem>
                            <SelectItem value="Right Wing" className="text-white hover:bg-slate-700">Right Wing</SelectItem>
                            <SelectItem value="Left Defense" className="text-white hover:bg-slate-700">Left Defense</SelectItem>
                            <SelectItem value="Right Defense" className="text-white hover:bg-slate-700">Right Defense</SelectItem>
                            <SelectItem value="Goalie" className="text-white hover:bg-slate-700">Goalie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateUser}
                      disabled={
                        createLoading || !userData.gamer_tag_id || !userData.primary_position || !userData.console
                      }
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
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
                  <Alert className="bg-slate-800/50 border-white/20">
                    <AlertCircle className="h-4 w-4 text-white/70" />
                    <AlertTitle className="text-white">User Not Found</AlertTitle>
                    <AlertDescription className="text-white/70">
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
