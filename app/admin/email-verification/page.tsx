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
import { Loader2, CheckCircle2, AlertCircle, Info, Key, ArrowLeft, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Email Verification Tools
              </h1>
              <p className="text-white/70 mt-1">Debug and manually verify user email addresses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="debug" onValueChange={handleTabChange}>
          <TabsList className="mb-6 bg-slate-800/50 border border-white/20">
            <TabsTrigger value="debug" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Debug Email</TabsTrigger>
            <TabsTrigger value="verify" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Manual Verification</TabsTrigger>
            <TabsTrigger value="direct" className="text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">Direct Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="debug">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Email Verification Diagnostics</CardTitle>
                <CardDescription className="text-white/70">Check the status of a user's email verification</CardDescription>
              </CardHeader>
              <form onSubmit={handleDebugSubmit(onDebugSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="debug-email" className="text-white">Email</Label>
                    <Input
                      id="debug-email"
                      type="email"
                      placeholder="user.email@example.com"
                      {...registerDebug("email")}
                      className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                    {debugErrors.email && <p className="text-sm text-red-400">{debugErrors.email.message}</p>}
                  </div>

                  {debugResult && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Diagnostic Results</h3>

                      <Alert variant={debugResult.userExists ? "default" : "destructive"} className="bg-slate-800/50 border-white/20">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-white">User Status</AlertTitle>
                        <AlertDescription className="text-white/70">
                          {debugResult.userExists
                            ? `User exists (created ${new Date(debugResult.userDetails.createdAt).toLocaleString()})`
                            : "User does not exist in the auth system"}
                        </AlertDescription>
                      </Alert>

                      {debugResult.userExists && (
                        <Alert variant={debugResult.userDetails.emailConfirmed ? "default" : "destructive"} className="bg-slate-800/50 border-white/20">
                          <Info className="h-4 w-4" />
                          <AlertTitle className="text-white">Email Verification Status</AlertTitle>
                          <AlertDescription className="text-white/70">
                            {debugResult.userDetails.emailConfirmed ? "Email is verified" : "Email is NOT verified"}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Alert variant={debugResult.smtpConfigured ? "default" : "destructive"} className="bg-slate-800/50 border-white/20">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-white">SMTP Configuration</AlertTitle>
                        <AlertDescription className="text-white/70">
                          {debugResult.smtpConfigured
                            ? "SMTP appears to be configured"
                            : "SMTP configuration is missing or incomplete"}
                        </AlertDescription>
                      </Alert>

                      <Alert variant={debugResult.testEmailSent ? "default" : "destructive"} className="bg-slate-800/50 border-white/20">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-white">Test Email</AlertTitle>
                        <AlertDescription className="text-white/70">
                          {debugResult.testEmailSent
                            ? "Test password reset email was sent successfully"
                            : `Failed to send test email: ${debugResult.testEmailError}`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isDebugLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    {isDebugLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Diagnostics...
                      </>
                    ) : (
                      "Run Diagnostics"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="verify">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Manual Email Verification</CardTitle>
                <CardDescription className="text-white/70">Manually verify a user's email address (admin only)</CardDescription>
              </CardHeader>
              <form onSubmit={handleVerifySubmit(onVerifySubmit)}>
                <CardContent className="space-y-4">
                  <Alert className="bg-amber-500/10 border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <AlertTitle className="text-amber-400">Admin Only</AlertTitle>
                    <AlertDescription className="text-amber-300">
                      This tool should only be used by administrators when users cannot verify their email through normal
                      means.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="verify-email" className="text-white">User Email</Label>
                    <Input
                      id="verify-email"
                      type="email"
                      placeholder="user.email@example.com"
                      {...registerVerify("email")}
                      className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                    {verifyErrors.email && <p className="text-sm text-red-400">{verifyErrors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-key" className="text-white">Admin Key</Label>
                    <Input 
                      id="admin-key" 
                      type="password" 
                      {...registerVerify("adminKey")}
                      className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                    {verifyErrors.adminKey && <p className="text-sm text-red-400">{verifyErrors.adminKey.message}</p>}
                  </div>

                  {verifyError && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-red-400">Verification Failed</AlertTitle>
                      <AlertDescription className="text-red-300">{verifyError}</AlertDescription>
                    </Alert>
                  )}

                  {verifyResult && (
                    <Alert variant="default" className="bg-green-500/10 border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertTitle className="text-green-400">
                        {verifyResult.alreadyVerified ? "Already Verified" : "Verification Successful"}
                      </AlertTitle>
                      <AlertDescription className="text-green-300">
                        {verifyResult.alreadyVerified
                          ? "This user's email was already confirmed."
                          : `User ${verifiedEmail || emailValue} has been manually verified.`}
                        {verifiedEmail && verifiedEmail !== emailValue && (
                          <p className="mt-2 font-medium text-amber-400">
                            Note: The verified email ({verifiedEmail}) is different from what you entered ({emailValue}).
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isVerifyLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    {isVerifyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Manually Verify User"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="direct">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Direct Verification (Fallback Method)</CardTitle>
                <CardDescription className="text-white/70">Use this method if the standard verification fails</CardDescription>
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
                <CardContent className="space-y-4">
                  <Alert className="bg-orange-500/10 border-orange-500/20">
                    <Key className="h-4 w-4 text-orange-400" />
                    <AlertTitle className="text-orange-400">Alternative Method</AlertTitle>
                    <AlertDescription className="text-orange-300">
                      This is an alternative verification method that bypasses the standard flow. Use only if the regular
                      verification method fails. This method will work even if the user cannot be found through the normal
                      API.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="direct-email" className="text-white">User Email</Label>
                    <Input
                      id="direct-email"
                      name="direct-email"
                      type="email"
                      placeholder="user.email@example.com"
                      required
                      className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direct-admin-key" className="text-white">Admin Key</Label>
                    <Input
                      id="direct-admin-key"
                      name="direct-admin-key"
                      type="password"
                      defaultValue={adminKeyValue}
                      required
                      className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {verifyError && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-red-400">Verification Failed</AlertTitle>
                      <AlertDescription className="text-red-300">{verifyError}</AlertDescription>
                    </Alert>
                  )}

                  {verifyResult && (
                    <Alert variant="default" className="bg-green-500/10 border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertTitle className="text-green-400">Verification Successful</AlertTitle>
                      <AlertDescription className="text-green-300">
                        User {verifiedEmail} has been manually verified using the direct method.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isVerifyLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    {isVerifyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Direct Verify User"
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
