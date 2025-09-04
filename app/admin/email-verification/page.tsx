"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertCircle, Info, Key, Mail, Shield, Zap, Database, Users, Settings, Globe, Target, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the form schemas with Zod
const debugFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

const verifyFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  adminKey: z.string().min(1, { message: "Admin key is required" }),
})

type DebugFormValues = z.infer<typeof debugFormSchema>
type VerifyFormValues = z.infer<typeof verifyFormSchema>

export default function AdminEmailVerificationPage() {
  const { toast } = useToast()
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const [isVerifyLoading, setIsVerifyLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [adminKeyValue, setAdminKeyValue] = useState("")
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)

  // Initialize forms with react-hook-form
  const {
    register: registerDebug,
    handleSubmit: handleDebugSubmit,
    formState: { errors: debugErrors },
  } = useForm<DebugFormValues>({
    resolver: zodResolver(debugFormSchema),
    defaultValues: {
      email: "",
    },
  })

  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors },
    setValue: setVerifyValue,
    watch: watchVerify,
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      email: "",
      adminKey: "",
    },
  })

  // Watch the email field for changes
  const emailValue = watchVerify("email")

  // Load admin key from localStorage if available
  useEffect(() => {
    const savedKey = localStorage.getItem("scs-admin-key")
    if (savedKey) {
      setAdminKeyValue(savedKey)
      setVerifyValue("adminKey", savedKey)
    }
  }, [])

  // Handle debug form submission
  const onDebugSubmit = async (data: DebugFormValues) => {
    setIsDebugLoading(true)
    setDebugResult(null)

    try {
      const response = await fetch("/api/debug-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to debug email")
      }

      setDebugResult(result)

      toast({
        title: "Email diagnostics completed",
        description: "Check the results below",
      })
    } catch (error: any) {
      console.error("Error debugging email:", error)
      toast({
        title: "Failed to debug email",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDebugLoading(false)
    }
  }

  // Add this function after the onVerifySubmit function
  const saveAdminKey = (key: string) => {
    if (typeof window !== "undefined" && key) {
      localStorage.setItem("scs-admin-key", key)
    }
  }

  // Handle verify form submission
  const onVerifySubmit = async (data: VerifyFormValues) => {
    setIsVerifyLoading(true)
    setVerifyResult(null)
    setVerifyError(null)
    setVerifiedEmail(null)

    try {
      const response = await fetch("/api/manual-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          adminKey: data.adminKey,
          forceVerify: true, // Always force verify
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setVerifyError("Unauthorized: Invalid admin key")
          throw new Error("Unauthorized: Invalid admin key")
        } else {
          setVerifyError(result.error || "Failed to verify user")
          throw new Error(result.error || "Failed to verify user")
        }
      }

      setVerifyResult(result)
      setVerifiedEmail(result.email || data.email) // Store the email that was actually verified
      setAdminKeyValue(data.adminKey) // Save admin key for other tabs
      saveAdminKey(data.adminKey)

      toast({
        title: result.alreadyVerified ? "User already verified" : "User verified successfully",
        description: result.alreadyVerified
          ? "This user's email was already confirmed"
          : `User ${result.email || data.email} has been manually verified`,
        variant: result.alreadyVerified ? "default" : "default",
      })
    } catch (error: any) {
      console.error("Error verifying user:", error)
      toast({
        title: "Failed to verify user",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsVerifyLoading(false)
    }
  }

  // Function to directly verify a user using the direct-verify endpoint
  const handleDirectVerify = async (email: string, adminKey: string) => {
    setIsVerifyLoading(true)
    setVerifyResult(null)
    setVerifyError(null)
    setVerifiedEmail(null)

    try {
      const response = await fetch("/api/direct-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, adminKey }),
      })

      const result = await response.json()

      if (!response.ok) {
        setVerifyError(result.error || "Failed to verify user")
        throw new Error(result.error || "Failed to verify user")
      }

      setVerifyResult(result)
      setVerifiedEmail(result.email || email) // Store the email that was actually verified
      setAdminKeyValue(adminKey) // Save admin key for other tabs
      saveAdminKey(adminKey)

      toast({
        title: "User verified successfully",
        description: `User ${result.email || email} has been verified using the direct method`,
      })
    } catch (error: any) {
      console.error("Error with direct verification:", error)
      toast({
        title: "Failed to verify user",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsVerifyLoading(false)
    }
  }

  // Function to copy admin key between tabs
  const handleTabChange = (value: string) => {
    if (value === "verify" || value === "direct") {
      // Copy admin key to the selected tab
      if (adminKeyValue) {
        if (value === "verify") {
          setVerifyValue("adminKey", adminKeyValue)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <Mail className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            Admin Email Verification Tools
          </h1>
          <p className="hockey-subtitle mb-8">
            Diagnose and manage email verification issues for user accounts
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Email Diagnostics</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/50 dark:border-assist-green-700/50">
              <Shield className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Manual Verification</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-rink-blue-100/50 to-rink-blue-100/50 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-rink-blue-200/50 dark:border-rink-blue-700/50">
              <Zap className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Direct Verification</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <Users className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">User Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
        <Tabs defaultValue="debug" onValueChange={handleTabChange}>
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg rounded-xl p-2 mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger 
                value="debug" 
                className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
              >
                <Database className="mr-2 h-4 w-4" />
                Debug Email
              </TabsTrigger>
              <TabsTrigger 
                value="verify" 
                className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
              >
                <Shield className="mr-2 h-4 w-4" />
                Manual Verification
              </TabsTrigger>
              <TabsTrigger 
                value="direct" 
                className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
              >
                <Zap className="mr-2 h-4 w-4" />
                Direct Verification
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="debug">
          <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                Email Verification Diagnostics
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Check the status of a user's email verification</CardDescription>
            </CardHeader>
            <form onSubmit={handleDebugSubmit(onDebugSubmit)}>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="debug-email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    Email Address
                  </Label>
                  <Input
                    id="debug-email"
                    type="email"
                    placeholder="user.email@example.com"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500"
                    {...registerDebug("email")}
                  />
                  {debugErrors.email && <p className="text-sm text-goal-red-600 dark:text-goal-red-400">{debugErrors.email.message}</p>}
                </div>

                {debugResult && (
                  <div className="mt-6 space-y-6">
                    <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                      <Target className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                      Diagnostic Results
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Alert variant={debugResult.userExists ? "default" : "destructive"} className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">User Status</AlertTitle>
                        <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                          {debugResult.userExists
                            ? `User exists (created ${new Date(debugResult.userDetails.createdAt).toLocaleString()})`
                            : "User does not exist in the auth system"}
                        </AlertDescription>
                      </Alert>

                      {debugResult.userExists && (
                        <Alert variant={debugResult.userDetails.emailConfirmed ? "default" : "destructive"} className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                          <Info className="h-4 w-4" />
                          <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Email Verification Status</AlertTitle>
                          <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                            {debugResult.userDetails.emailConfirmed ? "Email is verified" : "Email is NOT verified"}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Alert variant={debugResult.smtpConfigured ? "default" : "destructive"} className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                        <Settings className="h-4 w-4" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">SMTP Configuration</AlertTitle>
                        <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                          {debugResult.smtpConfigured
                            ? "SMTP appears to be configured"
                            : "SMTP configuration is missing or incomplete"}
                        </AlertDescription>
                      </Alert>

                      <Alert variant={debugResult.testEmailSent ? "default" : "destructive"} className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20">
                        <Globe className="h-4 w-4" />
                        <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Test Email</AlertTitle>
                        <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                          {debugResult.testEmailSent
                            ? "Test password reset email was sent successfully"
                            : `Failed to send test email: ${debugResult.testEmailError}`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isDebugLoading}
                  className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {isDebugLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="verify">
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                Manual Email Verification
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Manually verify a user's email address (admin only)</CardDescription>
            </CardHeader>
            <form onSubmit={handleVerifySubmit(onVerifySubmit)}>
              <CardContent className="pt-6 space-y-6">
                <Alert className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                  <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Admin Only</AlertTitle>
                  <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    This tool should only be used by administrators when users cannot verify their email through normal
                    means.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label htmlFor="verify-email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    User Email
                  </Label>
                  <Input
                    id="verify-email"
                    type="email"
                    placeholder="user.email@example.com"
                    className="hockey-search border-assist-green-200/50 dark:border-assist-green-700/50 focus:ring-assist-green-500/20 focus:border-assist-green-500"
                    {...registerVerify("email")}
                  />
                  {verifyErrors.email && <p className="text-sm text-goal-red-600 dark:text-goal-red-400">{verifyErrors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="admin-key" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Key className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    Admin Key
                  </Label>
                  <Input 
                    id="admin-key" 
                    type="password" 
                    className="hockey-search border-assist-green-200/50 dark:border-assist-green-700/50 focus:ring-assist-green-500/20 focus:border-assist-green-500"
                    {...registerVerify("adminKey")} 
                  />
                  {verifyErrors.adminKey && <p className="text-sm text-goal-red-600 dark:text-goal-red-400">{verifyErrors.adminKey.message}</p>}
                </div>

                {verifyError && (
                  <Alert variant="destructive" className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                    <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Verification Failed</AlertTitle>
                    <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{verifyError}</AlertDescription>
                  </Alert>
                )}

                {verifyResult && (
                  <Alert variant="default" className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">
                      {verifyResult.alreadyVerified ? "Already Verified" : "Verification Successful"}
                    </AlertTitle>
                    <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      {verifyResult.alreadyVerified
                        ? "This user's email was already confirmed."
                        : `User ${verifiedEmail || emailValue} has been manually verified.`}
                      {verifiedEmail && verifiedEmail !== emailValue && (
                        <p className="mt-2 font-medium text-amber-500">
                          Note: The verified email ({verifiedEmail}) is different from what you entered ({emailValue}).
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isVerifyLoading}
                  className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {isVerifyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Manually Verify User
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="direct">
          <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                Direct Verification (Fallback Method)
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Use this method if the standard verification fails</CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const email = formData.get("direct-email") as string
                const adminKey = formData.get("direct-admin-key") as string
                handleDirectVerify(email, adminKey)
              }}
            >
              <CardContent className="pt-6 space-y-6">
                <Alert variant="warning" className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                  <Key className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Alternative Method</AlertTitle>
                  <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    This is an alternative verification method that bypasses the standard flow. Use only if the regular
                    verification method fails. This method will work even if the user cannot be found through the normal
                    API.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label htmlFor="direct-email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    User Email
                  </Label>
                  <Input
                    id="direct-email"
                    name="direct-email"
                    type="email"
                    placeholder="user.email@example.com"
                    className="hockey-search border-goal-red-200/50 dark:border-goal-red-700/50 focus:ring-goal-red-500/20 focus:border-goal-red-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="direct-admin-key" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Key className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    Admin Key
                  </Label>
                  <Input
                    id="direct-admin-key"
                    name="direct-admin-key"
                    type="password"
                    defaultValue={adminKeyValue}
                    className="hockey-search border-goal-red-200/50 dark:border-goal-red-700/50 focus:ring-goal-red-500/20 focus:border-goal-red-500"
                    required
                  />
                </div>

                {verifyError && (
                  <Alert variant="destructive" className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                    <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Verification Failed</AlertTitle>
                    <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{verifyError}</AlertDescription>
                  </Alert>
                )}

                {verifyResult && (
                  <Alert variant="default" className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">Verification Successful</AlertTitle>
                    <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      User {verifiedEmail} has been manually verified using the direct method.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isVerifyLoading}
                  className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {isVerifyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Direct Verify User
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
