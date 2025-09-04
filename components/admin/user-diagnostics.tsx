"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
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
                Comprehensive diagnostic tool for troubleshooting user account issues
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            {/* Enhanced Search Section */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Email Address
                  </Label>
                  <div className="flex mt-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                      </div>
                      <Input
                        id="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="hockey-search h-12 text-base pl-12 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                      />
                    </div>
                    <Button 
                      onClick={handleLookup} 
                      disabled={loading || !email.trim()} 
                      className="ml-3 h-12 px-6 hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      {loading ? "Searching..." : "Lookup"}
                    </Button>
                  </div>
                </div>
                <div className="md:w-1/3">
                  <Label htmlFor="admin-key" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Key className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    Admin Key
                  </Label>
                  <Input
                    id="admin-key"
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="hockey-search h-12 text-base mt-2 border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

          {lookupResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Tabs defaultValue="status" className="mt-6">
                <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <TabsTrigger 
                      value="status" 
                      className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Status
                    </TabsTrigger>
                    <TabsTrigger 
                      value="details" 
                      className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="verification" 
                      className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verification
                    </TabsTrigger>
                    <TabsTrigger 
                      value="actions" 
                      className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-hockey-silver-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="status" className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Shield className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                            Auth Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center">
                            <Badge 
                              variant={lookupResults.status.inAuthSystem ? "default" : "destructive"} 
                              className={`mr-3 px-3 py-1 text-sm font-medium ${
                                lookupResults.status.inAuthSystem 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                              }`}
                            >
                              {lookupResults.status.inAuthSystem ? "Found" : "Not Found"}
                            </Badge>
                            <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
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
                                  className={`mr-3 px-3 py-1 text-sm font-medium ${
                                    lookupResults.status.isEmailConfirmed 
                                      ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                      : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                                  }`}
                                >
                                  {lookupResults.status.isEmailConfirmed ? "Verified" : "Not Verified"}
                                </Badge>
                                <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                                  {lookupResults.status.isEmailConfirmed ? "Email is confirmed" : "Email is not confirmed"}
                                </span>
                              </div>
                              {lookupResults.status.hasOwnProperty("isMetadataVerified") && (
                                <div className="flex items-center">
                                  <Badge
                                    variant={lookupResults.status.isMetadataVerified ? "default" : "destructive"}
                                    className={`mr-3 px-3 py-1 text-sm font-medium ${
                                      lookupResults.status.isMetadataVerified 
                                        ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                        : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                                    }`}
                                  >
                                    {lookupResults.status.isMetadataVerified ? "Verified" : "Not Verified"}
                                  </Badge>
                                  <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                                    {lookupResults.status.isMetadataVerified
                                      ? "User metadata shows verified"
                                      : "User metadata shows not verified"}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Database className="h-5 w-5 text-rink-blue-600 dark:text-rink-blue-400" />
                            Database Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            <Badge 
                              variant={lookupResults.status.inPublicUsers ? "default" : "destructive"} 
                              className={`mr-3 px-3 py-1 text-sm font-medium ${
                                lookupResults.status.inPublicUsers 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                              }`}
                            >
                              {lookupResults.status.inPublicUsers ? "Found" : "Not Found"}
                            </Badge>
                            <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                              {lookupResults.status.inPublicUsers
                                ? "User exists in public.users table"
                                : "User not found in public.users table"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <FileText className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                            Verification History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center">
                            <Badge
                              variant={lookupResults.status.hasVerificationLogs ? "default" : "secondary"}
                              className={`mr-3 px-3 py-1 text-sm font-medium ${
                                lookupResults.status.hasVerificationLogs 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500 text-white"
                              }`}
                            >
                              {lookupResults.status.hasVerificationLogs ? "Found" : "None"}
                            </Badge>
                            <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                              {lookupResults.status.hasVerificationLogs
                                ? `${lookupResults.verificationLogs?.length || 0} verification log entries`
                                : "No verification logs found"}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <Badge
                              variant={lookupResults.status.hasVerificationTokens ? "default" : "secondary"}
                              className={`mr-3 px-3 py-1 text-sm font-medium ${
                                lookupResults.status.hasVerificationTokens 
                                  ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                                  : "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500 text-white"
                              }`}
                            >
                              {lookupResults.status.hasVerificationTokens ? "Found" : "None"}
                            </Badge>
                            <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                              {lookupResults.status.hasVerificationTokens
                                ? `${lookupResults.verificationTokens?.length || 0} verification tokens`
                                : "No verification tokens found"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Wrench className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                            Diagnosis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {lookupResults.status.inAuthSystem && !lookupResults.status.isEmailConfirmed && (
                            <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                              <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                              <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Email Not Verified</AlertTitle>
                              <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                                User exists but email is not verified. Try sending a verification email or use the Fix
                                Verification Status button.
                              </AlertDescription>
                            </Alert>
                          )}

                          {lookupResults.status.inAuthSystem &&
                            lookupResults.status.hasOwnProperty("isMetadataVerified") &&
                            lookupResults.status.isEmailConfirmed !== lookupResults.status.isMetadataVerified && (
                              <Alert className="border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
                                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                <AlertTitle className="text-orange-800 dark:text-orange-200">Verification Status Mismatch</AlertTitle>
                                <AlertDescription className="text-orange-700 dark:text-orange-300">
                                  The email_confirmed_at field and user_metadata.email_verified are not in sync. Use the Fix
                                  Verification Status button.
                                </AlertDescription>
                              </Alert>
                            )}

                          {lookupResults.status.inAuthSystem && !lookupResults.status.inPublicUsers && (
                            <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                              <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                              <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Missing User Record</AlertTitle>
                              <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                                User exists in auth but not in the public.users table. Create a user record.
                              </AlertDescription>
                            </Alert>
                          )}

                          {!lookupResults.status.inAuthSystem && (
                            <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                              <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                              <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">User Not Found</AlertTitle>
                              <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                                User does not exist in the auth system. They need to register.
                              </AlertDescription>
                            </Alert>
                          )}

                          {lookupResults.status.inAuthSystem &&
                            lookupResults.status.isEmailConfirmed &&
                            (!lookupResults.status.hasOwnProperty("isMetadataVerified") ||
                              lookupResults.status.isMetadataVerified) &&
                            lookupResults.status.inPublicUsers && (
                              <Alert className="border-2 border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-r from-assist-green-50/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-800/20">
                                <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                                <AlertTitle className="text-assist-green-800 dark:text-assist-green-200">User Account Healthy</AlertTitle>
                                <AlertDescription className="text-assist-green-700 dark:text-assist-green-300">
                                  User exists, is verified, and has a complete user record. No issues detected.
                                </AlertDescription>
                              </Alert>
                            )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
              </TabsContent>

                  <TabsContent value="details" className="space-y-6 p-6">
                    {lookupResults.authUser && (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Shield className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                            Auth User Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 p-4 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                            <pre className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(lookupResults.authUser, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {lookupResults.publicUser && (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Database className="h-5 w-5 text-rink-blue-600 dark:text-rink-blue-400" />
                            Public User Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 p-4 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                            <pre className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(lookupResults.publicUser, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!lookupResults.authUser && !lookupResults.publicUser && (
                      <Alert className="border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
                        <AlertCircle className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">No User Data</AlertTitle>
                        <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">No user details found in either auth or public.users tables.</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="verification" className="space-y-6 p-6">
                    {lookupResults.verificationLogs && lookupResults.verificationLogs.length > 0 ? (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <FileText className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                            Verification Logs
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 p-4 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                            <pre className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(lookupResults.verificationLogs, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert className="border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
                        <AlertCircle className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">No Verification Logs</AlertTitle>
                        <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">No verification logs found for this user.</AlertDescription>
                      </Alert>
                    )}

                    {lookupResults.verificationTokens && lookupResults.verificationTokens.length > 0 ? (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Key className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                            Verification Tokens
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 p-4 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                            <pre className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{JSON.stringify(lookupResults.verificationTokens, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert className="border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20">
                        <AlertCircle className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">No Verification Tokens</AlertTitle>
                        <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">No verification tokens found for this user.</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-6 p-6">
                    {lookupResults.status.inAuthSystem && (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <Settings className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                            Verification Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            onClick={handleFixVerificationStatus}
                            disabled={fixVerificationLoading || !lookupResults.status.inAuthSystem}
                            className="w-full h-12 hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            {fixVerificationLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 mr-2" />
                            )}
                            {fixVerificationLoading ? "Fixing..." : "Fix Verification Status"}
                          </Button>

                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                            <Checkbox
                              id="force-verify"
                              checked={forceVerify}
                              onCheckedChange={(checked) => setForceVerify(checked as boolean)}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600 data-[state=checked]:border-ice-blue-500"
                            />
                            <label
                              htmlFor="force-verify"
                              className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Force verify (skip email verification)
                            </label>
                          </div>
                          <Button
                            onClick={handleSendVerification}
                            disabled={verifyLoading || !lookupResults.status.inAuthSystem}
                            className="w-full h-12 hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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
                        </CardContent>
                      </Card>
                    )}

                    {lookupResults.status.inAuthSystem && !lookupResults.status.inPublicUsers && (
                      <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                            <UserPlus className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                            Create User Record
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="gamer-tag" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Gamer Tag</Label>
                              <Input
                                id="gamer-tag"
                                value={userData.gamer_tag_id}
                                onChange={(e) => setUserData({ ...userData, gamer_tag_id: e.target.value })}
                                placeholder="Gamer Tag"
                                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="console" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Console</Label>
                              <Select
                                value={userData.console}
                                onValueChange={(value) => setUserData({ ...userData, console: value })}
                              >
                                <SelectTrigger id="console" className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                  <SelectValue placeholder="Select console" />
                                </SelectTrigger>
                                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                                  <SelectItem value="Xbox">Xbox</SelectItem>
                                  <SelectItem value="PS5">PS5</SelectItem>
                                  <SelectItem value="XSX">XSX</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="primary-position" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Primary Position</Label>
                              <Select
                                value={userData.primary_position}
                                onValueChange={(value) => setUserData({ ...userData, primary_position: value })}
                              >
                                <SelectTrigger id="primary-position" className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
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
                              <Label htmlFor="secondary-position" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Secondary Position (Optional)</Label>
                              <Select
                                value={userData.secondary_position || "None"}
                                onValueChange={(value) =>
                                  setUserData({ ...userData, secondary_position: value === "None" ? "" : value })
                                }
                              >
                                <SelectTrigger id="secondary-position" className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
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
                            className="w-full h-12 hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            {createLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {createLoading ? "Creating..." : "Create User Record"}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {!lookupResults.status.inAuthSystem && (
                      <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                        <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                        <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">User Not Found</AlertTitle>
                        <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                          User does not exist in the auth system. They need to register before any actions can be taken.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}
