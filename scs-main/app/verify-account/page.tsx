"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the form schemas with Zod
const emailFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

const adminFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  adminKey: z.string().min(1, { message: "Admin key is required" }),
})

type EmailFormValues = z.infer<typeof emailFormSchema>
type AdminFormValues = z.infer<typeof adminFormSchema>

export default function VerifyAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(false)

  const [emailSent, setEmailSent] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [adminVerificationSuccess, setAdminVerificationSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Initialize forms with react-hook-form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setValue: setEmailValue,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  })

  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    setValue: setAdminValue,
    formState: { errors: adminErrors },
  } = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: "",
      adminKey: "",
    },
  })

  // Pre-fill email from query parameter if available
  useEffect(() => {
    const email = searchParams.get("email")
    if (email) {
      setEmailValue("email", email)
      setAdminValue("email", email)
    }
  }, [searchParams, setEmailValue, setAdminValue])

  // Handle email form submission
  const onEmailSubmit = async (data: EmailFormValues) => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Unable to connect to authentication service",
        variant: "destructive",
      })
      return
    }

    setIsEmailLoading(true)
    setError(null)

    try {
      // First try the standard resend method
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
        },
      })

      if (resendError) {
        console.error("Standard resend failed, trying alternative method:", resendError)

        // Generate a short verification link
        try {
          const shortUrl = await generateShortLink(data.email)

          // Try our custom API with the short link
          const response = await fetch("/api/verify-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: data.email,
              shortUrl,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || "Failed to send verification email")
          }

          if (result.alreadyVerified) {
            setVerificationSuccess(true)
            toast({
              title: "Account already verified",
              description: "Your account is already verified. You can now log in.",
            })
            return
          }
        } catch (shortLinkError) {
          console.error("Error with short link:", shortLinkError)
          // Fall back to regular verification if short link fails
          const response = await fetch("/api/verify-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: data.email }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || "Failed to send verification email")
          }

          if (result.alreadyVerified) {
            setVerificationSuccess(true)
            toast({
              title: "Account already verified",
              description: "Your account is already verified. You can now log in.",
            })
            return
          }
        }
      }

      setEmailSent(true)
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and spam folder",
      })
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setError(error.message || "An error occurred while sending the verification email")
      toast({
        title: "Failed to send verification email",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsEmailLoading(false)
    }
  }

  // Handle admin form submission
  const onAdminSubmit = async (data: AdminFormValues) => {
    setIsAdminLoading(true)
    setError(null)

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
        throw new Error(result.error || "Failed to verify account")
      }

      if (result.alreadyVerified) {
        setAdminVerificationSuccess(true)
        toast({
          title: "Account already verified",
          description: "This account is already verified.",
        })
        return
      }

      setAdminVerificationSuccess(true)
      toast({
        title: "Verification successful",
        description: "The account has been verified successfully.",
      })
    } catch (error: any) {
      console.error("Error in admin verification:", error)
      setError(error.message || "An error occurred during verification")
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAdminLoading(false)
    }
  }

  const generateShortLink = async (email: string) => {
    try {
      const response = await fetch("/api/short-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate short link")
      }

      return data.url
    } catch (error) {
      console.error("Error generating short link:", error)
      throw error
    }
  }

  // If verification is successful, show success message
  if (verificationSuccess || adminVerificationSuccess) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Account Verified</CardTitle>
              <CardDescription>Your account has been successfully verified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-semibold">Verification Successful</h3>
                <p className="text-center text-muted-foreground">
                  Your account has been verified. You can now log in to access your account.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Account</CardTitle>
            <CardDescription>Enter your email to receive a verification link</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {emailSent ? (
              <div className="space-y-4">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertTitle>Email Sent</AlertTitle>
                  <AlertDescription>
                    A verification email has been sent. Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>
                <div className="text-center">
                  <Button variant="outline" onClick={() => setEmailSent(false)} className="mt-2">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" {...registerEmail("email")} />
                  {emailErrors.email && <p className="text-sm text-red-500">{emailErrors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isEmailLoading}>
                  {isEmailLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Email"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t">
              <details className="text-sm">
                <summary className="font-medium cursor-pointer">Admin Verification</summary>
                <div className="mt-4">
                  <form onSubmit={handleAdminSubmit(onAdminSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">User Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="user.email@example.com"
                        {...registerAdmin("email")}
                      />
                      {adminErrors.email && <p className="text-sm text-red-500">{adminErrors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-key">Admin Key</Label>
                      <Input id="admin-key" type="password" {...registerAdmin("adminKey")} />
                      {adminErrors.adminKey && <p className="text-sm text-red-500">{adminErrors.adminKey.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isAdminLoading}>
                      {isAdminLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Account"
                      )}
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-center">
              <Link href="/login" className="text-primary hover:underline">
                Return to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
