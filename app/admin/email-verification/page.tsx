"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertCircle, Info, Key } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
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

  // Check if user is admin
  useEffect(() => {
    async function checkAuthAndLoadData() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        setLoading(true)

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  // Load admin key from localStorage if available
  useEffect(() => {
    const savedKey = localStorage.getItem("scs-admin-key")
    if (savedKey) {
      setAdminKeyValue(savedKey)
      setVerifyValue("adminKey", savedKey)
    }
  }, [setVerifyValue])

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
        title: "Debug completed",
        description: "Email debug information retrieved successfully.",
      })
    } catch (error: any) {
      console.error("Error debugging email:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to debug email",
        variant: "destructive",
      })
    } finally {
      setIsDebugLoading(false)
    }
  }

  // Handle verify form submission
  const onVerifySubmit = async (data: VerifyFormValues) => {
    setIsVerifyLoading(true)
    setVerifyError(null)
    setVerifyResult(null)

    try {
      const response = await fetch("/api/verify-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          adminKey: data.adminKey,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify email")
      }

      setVerifyResult(result)
      setVerifiedEmail(data.email)

      // Save admin key if provided
      if (data.adminKey) {
        localStorage.setItem("scs-admin-key", data.adminKey)
      }

      toast({
        title: "Email verified",
        description: `Email ${data.email} has been successfully verified.`,
      })
    } catch (error: any) {
      console.error("Error verifying email:", error)
      setVerifyError(error.message || "Failed to verify email")
      toast({
        title: "Error",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      })
    } finally {
      setIsVerifyLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email Verification Management</h1>
            <p className="text-muted-foreground mt-1">Debug and verify user email accounts</p>
          </div>
        </div>

        <Tabs defaultValue="debug" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="debug">Debug Email</TabsTrigger>
            <TabsTrigger value="verify">Verify Email</TabsTrigger>
          </TabsList>

          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Debug Email Account
                </CardTitle>
                <CardDescription>
                  Check the status and details of an email account in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDebugSubmit(onDebugSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="debug-email">Email Address</Label>
                    <Input
                      id="debug-email"
                      type="email"
                      placeholder="user@example.com"
                      {...registerDebug("email")}
                    />
                    {debugErrors.email && (
                      <p className="text-sm text-destructive">{debugErrors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={isDebugLoading}>
                    {isDebugLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Debug Email
                  </Button>
                </form>

                {debugResult && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">Debug Results:</h3>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(debugResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verify" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Verify Email Account
                </CardTitle>
                <CardDescription>
                  Manually verify an email account using admin privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifySubmit(onVerifySubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-email">Email Address</Label>
                    <Input
                      id="verify-email"
                      type="email"
                      placeholder="user@example.com"
                      {...registerVerify("email")}
                    />
                    {verifyErrors.email && (
                      <p className="text-sm text-destructive">{verifyErrors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-key">Admin Key</Label>
                    <Input
                      id="admin-key"
                      type="password"
                      placeholder="Enter admin verification key"
                      {...registerVerify("adminKey")}
                    />
                    {verifyErrors.adminKey && (
                      <p className="text-sm text-destructive">{verifyErrors.adminKey.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={isVerifyLoading}>
                    {isVerifyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Email
                  </Button>
                </form>

                {verifyError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{verifyError}</AlertDescription>
                  </Alert>
                )}

                {verifyResult && (
                  <div className="mt-6 space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>
                        Email {verifiedEmail} has been successfully verified.
                      </AlertDescription>
                    </Alert>
                    <h3 className="font-semibold">Verification Results:</h3>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(verifyResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
