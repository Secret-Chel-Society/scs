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
import { Loader2, AlertCircle, CheckCircle2, LogIn, Shield, Users, Gamepad2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


// Define the form schema with Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

type FormValues = z.infer<typeof formSchema>

function LoginStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">Secure</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">Join</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Community
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">Play</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          & Compete
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [justRegistered, setJustRegistered] = useState(false)


  // Check for registered=true query parameter
  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setJustRegistered(true)
    }
  }, [searchParams])

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Unable to connect to authentication service",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw error
      }

      // Success
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError(error.message || "An error occurred during login")

      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Sign in to your SCS account and join the competition
            </p>
          </div>

          {/* Login Statistics */}
          <LoginStats />

          {/* Main Login Form */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Login</CardTitle>
                <CardDescription className="text-blue-200">Sign in to your SCS account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {justRegistered && (
                    <Alert className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertTitle className="text-green-200">Registration Successful</AlertTitle>
                      <AlertDescription className="text-green-300">
                        Your account has been created successfully. You can now log in.
                      </AlertDescription>
                    </Alert>
                  )}

                  {loginError && (
                    <Alert variant="destructive" className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-red-200">Error</AlertTitle>
                      <AlertDescription className="text-red-300">{loginError}</AlertDescription>
                    </Alert>
                  )}



                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...register("email")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400"
                    />
                    {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-blue-300 hover:text-blue-200 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      {...register("password")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400"
                    />
                    {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Log in
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-center text-blue-200">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-300 hover:text-blue-200 hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
