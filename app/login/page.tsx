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
import { Loader2, AlertCircle, CheckCircle2, Trophy, Medal, Target, Zap, Shield, Database, Activity, TrendingUp, Users, Settings, BarChart3, Clock, Calendar, FileText, BookOpen, Globe, Publish, AlertTriangle, CheckCircle, Edit, Save, Award, Crown, Gamepad2, Play, Pause, Stop, Eye, EyeOff, Filter, Search, Download, Upload, Info, LogIn, User, Lock, Mail, Key, ArrowRight, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the form schema with Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

type FormValues = z.infer<typeof formSchema>

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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              Welcome Back to SCS
            </h1>
            <p className="hockey-subtitle mx-auto mb-12 max-w-2xl">
              Sign in to your Secret Chel Society account and get back to the action. 
              Access your profile, manage your team, and stay connected with the league.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden w-full max-w-md">
            <CardHeader className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <LogIn className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Sign In</CardTitle>
                  <CardDescription className="text-ice-blue-100">
                    Access your SCS account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 p-6">
                {justRegistered && (
                  <div className="hockey-card border-2 border-assist-green-200 dark:border-assist-green-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-assist-green-500 to-goal-red-600 text-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Registration Successful</h3>
                          <p className="text-assist-green-100 text-xs">
                            Your account has been created successfully. You can now log in.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loginError && (
                  <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-600 text-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Login Error</h3>
                          <p className="text-goal-red-100 text-xs">{loginError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-ice-blue-600" />
                    Email Address
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    {...register("email")} 
                    className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  {errors.email && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-rink-blue-600" />
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-sm text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 hover:underline transition-colors duration-200">
                      Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    {...register("password")} 
                    className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  {errors.password && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
                <Button 
                  type="submit" 
                  className="w-full btn-championship hover:scale-105 transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 font-medium hover:underline transition-colors duration-200"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
