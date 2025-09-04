"use client"

import { useState } from "react"
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
  Shield,
  Database,
  UserCheck,
  Key,
  Mail,
  Settings,
  Wrench,
  Eye,
  FileText,
  Clock,
  Zap
} from "lucide-react"

export function UserDiagnostics() {
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

  const handleLookup = async () => {
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
        description: "Please enter your admin key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/user-diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey: adminKey.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to lookup user`)
      }

      const data = await response.json()
      setLookupResults(data)

      toast({
        title: "Lookup Complete",
        description: `Found user data for ${email}`,
      })
    } catch (error: any) {
      console.error("Lookup error:", error)
      toast({
        title: "Lookup Failed",
        description: error.message || "An error occurred while looking up the user",
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

    setVerifyLoading(true)
    try {
      const response = await fetch("/api/admin/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
          force: forceVerify,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send verification email")
      }

      const data = await response.json()

      toast({
        title: "Verification Sent",
        description: data.message || "Verification email sent successfully",
      })

      // Refresh the lookup results
      handleLookup()
    } catch (error: any) {
      console.error("Verification error:", error)
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to send verification email",
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

    setFixVerificationLoading(true)
    try {
      const response = await fetch("/api/admin/fix-verification-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fix verification status")
      }

      const data = await response.json()

      toast({
        title: "Verification Fixed",
        description: data.message || "Verification status updated successfully",
      })

      // Refresh the lookup results
      handleLookup()
    } catch (error: any) {
      console.error("Fix verification error:", error)
      toast({
        title: "Fix Failed",
        description: error.message || "Failed to fix verification status",
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
    <div>
      <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                User Diagnostics
              </CardTitle>
              <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                Comprehensive user account analysis and management tools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                User Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hockey-search h-12 text-base border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminKey" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                <Key className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                Admin Key
              </Label>
              <Input
                id="adminKey"
                type="password"
                placeholder="Enter your admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="hockey-search h-12 text-base border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
              />
            </div>
            <Button 
              onClick={handleLookup} 
              disabled={loading || !email || !adminKey} 
              className="w-full h-12 text-lg hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze User
                </>
              )}
            </Button>
          </div>

          {lookupResults && (
            <div>
              <Tabs defaultValue="status" className="mt-6">
                <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <TabsTrigger 
                      value="status" 
                      className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Shield className="h-4 w-4" />
                      Status
                    </TabsTrigger>
                    <TabsTrigger 
                      value="verification" 
                      className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <UserCheck className="h-4 w-4" />
                      Verification
                    </TabsTrigger>
                    <TabsTrigger 
                      value="create" 
                      className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create User
                    </TabsTrigger>
                    <TabsTrigger 
                      value="details" 
                      className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-hockey-silver-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Database className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="status" className="p-6">
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <Database className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Database Status</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-hockey-silver-700 dark:text-hockey-silver-300">In Database:</span>
                              <Badge className={`px-3 py-1 text-sm font-medium ${
                                lookupResults.status.inDatabase 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                              }`}>
                                {lookupResults.status.inDatabase ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-hockey-silver-700 dark:text-hockey-silver-300">In Auth System:</span>
                              <Badge className={`px-3 py-1 text-sm font-medium ${
                                lookupResults.status.inAuthSystem 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                              }`}>
                                {lookupResults.status.inAuthSystem ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {lookupResults.status.inAuthSystem && (
                          <div className="p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                            <div className="flex items-center gap-3 mb-3">
                              <Shield className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                              <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Auth System Status</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Email Confirmed:</span>
                                <Badge className={`px-3 py-1 text-sm font-medium ${
                                  lookupResults.status.emailConfirmed 
                                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                    : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                                }`}>
                                  {lookupResults.status.emailConfirmed ? "Yes" : "No"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Last Sign In:</span>
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                                  {lookupResults.status.lastSignIn ? new Date(lookupResults.status.lastSignIn).toLocaleString() : "Never"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="verification" className="p-6">
                    <div className="space-y-6">
                      {lookupResults.status.inAuthSystem && !lookupResults.status.emailConfirmed && (
                        <div className="p-4 bg-gradient-to-r from-orange-50/30 to-orange-100/30 dark:from-orange-900/10 dark:to-orange-800/10 rounded-lg border border-orange-200/30 dark:border-orange-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Email Not Verified</h3>
                          </div>
                          <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">
                            This user's email is not verified. You can send a verification email or fix the verification status.
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="forceVerify" 
                                checked={forceVerify} 
                                onCheckedChange={setForceVerify}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600 data-[state=checked]:border-ice-blue-500"
                              />
                              <Label htmlFor="forceVerify" className="text-hockey-silver-700 dark:text-hockey-silver-300">
                                Force verification (bypass rate limits)
                              </Label>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={handleSendVerification}
                                disabled={verifyLoading}
                                className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                              >
                                {verifyLoading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Verification
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleFixVerificationStatus}
                                disabled={fixVerificationLoading}
                                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                              >
                                {fixVerificationLoading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Fixing...
                                  </>
                                ) : (
                                  <>
                                    <Wrench className="mr-2 h-4 w-4" />
                                    Fix Status
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {lookupResults.status.inAuthSystem && lookupResults.status.emailConfirmed && (
                        <div className="p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Email Verified</h3>
                          </div>
                          <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                            This user's email is already verified and they can access the platform.
                          </p>
                        </div>
                      )}

                      {!lookupResults.status.inAuthSystem && (
                        <div className="p-4 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-800/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Not in Auth System</h3>
                          </div>
                          <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                            This user is not in the authentication system. They need to register first.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="create" className="p-6">
                    <div className="space-y-6">
                      {lookupResults.status.inAuthSystem && !lookupResults.status.inDatabase && (
                        <div className="p-4 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-800/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <UserPlus className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Create Database User</h3>
                          </div>
                          <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">
                            This user exists in the auth system but not in the database. Create their database record.
                          </p>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="gamerTagId" className="text-hockey-silver-700 dark:text-hockey-silver-300">Gamer Tag ID</Label>
                                <Input
                                  id="gamerTagId"
                                  value={userData.gamer_tag_id}
                                  onChange={(e) => setUserData({ ...userData, gamer_tag_id: e.target.value })}
                                  placeholder="Enter gamer tag ID"
                                  className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="console" className="text-hockey-silver-700 dark:text-hockey-silver-300">Console</Label>
                                <Select value={userData.console} onValueChange={(value) => setUserData({ ...userData, console: value })}>
                                  <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                                    <SelectItem value="Xbox">Xbox</SelectItem>
                                    <SelectItem value="PlayStation">PlayStation</SelectItem>
                                    <SelectItem value="PC">PC</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="primaryPosition" className="text-hockey-silver-700 dark:text-hockey-silver-300">Primary Position</Label>
                                <Select value={userData.primary_position} onValueChange={(value) => setUserData({ ...userData, primary_position: value })}>
                                  <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                                    <SelectItem value="Center">Center</SelectItem>
                                    <SelectItem value="Left Wing">Left Wing</SelectItem>
                                    <SelectItem value="Right Wing">Right Wing</SelectItem>
                                    <SelectItem value="Defense">Defense</SelectItem>
                                    <SelectItem value="Goalie">Goalie</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="secondaryPosition" className="text-hockey-silver-700 dark:text-hockey-silver-300">Secondary Position (Optional)</Label>
                                <Select value={userData.secondary_position} onValueChange={(value) => setUserData({ ...userData, secondary_position: value })}>
                                  <SelectTrigger className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                    <SelectValue placeholder="Select secondary position" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                                    <SelectItem value="">None</SelectItem>
                                    <SelectItem value="Center">Center</SelectItem>
                                    <SelectItem value="Left Wing">Left Wing</SelectItem>
                                    <SelectItem value="Right Wing">Right Wing</SelectItem>
                                    <SelectItem value="Defense">Defense</SelectItem>
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
                              className="w-full h-12 hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                              {createLoading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <UserPlus className="h-4 w-4 mr-2" />
                              )}
                              Create User
                            </Button>
                          </div>
                        </div>
                      )}

                      {lookupResults.status.inDatabase && (
                        <div className="p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">User Exists</h3>
                          </div>
                          <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                            This user already exists in the database.
                          </p>
                        </div>
                      )}

                      {!lookupResults.status.inAuthSystem && (
                        <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                          <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                          <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Cannot Create User</AlertTitle>
                          <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                            User does not exist in the auth system. They need to register before any actions can be taken.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="p-6">
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                            <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">User Information</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Email:</span>
                              <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">{email}</span>
                            </div>
                            {lookupResults.userData && (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Gamer Tag ID:</span>
                                  <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                    {lookupResults.userData.gamer_tag_id || "Not set"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Primary Position:</span>
                                  <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                    {lookupResults.userData.primary_position || "Not set"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Console:</span>
                                  <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                    {lookupResults.userData.console || "Not set"}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {lookupResults.status.inAuthSystem && (
                          <div className="p-4 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                            <div className="flex items-center gap-3 mb-3">
                              <Clock className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                              <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Auth System Details</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Created:</span>
                                <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                  {lookupResults.authData?.created_at ? new Date(lookupResults.authData.created_at).toLocaleString() : "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Last Sign In:</span>
                                <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                  {lookupResults.authData?.last_sign_in_at ? new Date(lookupResults.authData.last_sign_in_at).toLocaleString() : "Never"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Email Confirmed:</span>
                                <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                                  {lookupResults.authData?.email_confirmed_at ? new Date(lookupResults.authData.email_confirmed_at).toLocaleString() : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}