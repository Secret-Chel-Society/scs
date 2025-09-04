"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Loader2, AlertCircle, CheckCircle2, Info, Settings, Trophy, Medal, Target, Zap, Shield, Database, Activity, TrendingUp, Users, BarChart3, Clock, Calendar, FileText, BookOpen, Globe, Publish, AlertTriangle, CheckCircle, Edit, Save, Award, Crown, Gamepad2, Play, Pause, Stop, Eye, EyeOff, Filter, Search, Download, Upload, LogIn, User, Lock, Mail, Key, ArrowRight, ArrowLeft, UserPlus, GamepadIcon, ShieldCheck, Bot, MessageSquare } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DiscordConnectButton from "@/components/auth/discord-connect-button"

// Define the form schema with Zod - Updated to match database values
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  gamerTag: z
    .string()
    .min(2, { message: "Gamer tag must be at least 2 characters" })
    .max(50, { message: "Gamer tag must be less than 50 characters" }),
  primaryPosition: z.string().min(1, { message: "Please select a primary position" }),
  secondaryPosition: z.string().optional(),
  console: z.string().refine((value) => ["PS5", "Xbox"].includes(value), {
    message: "Please select a valid console",
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [discordConnected, setDiscordConnected] = useState(false)
  const [discordUserId, setDiscordUserId] = useState<string | null>(null)
  const [discordUsername, setDiscordUsername] = useState<string | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [registrationDetails, setRegistrationDetails] = useState<any>(null)
  const [discordConfigError, setDiscordConfigError] = useState(false)

  // Check for discord_connected query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Handle Discord connection success
    if (params.get("discord_connected") === "true") {
      // Try to get Discord info from localStorage
      const storedDiscordInfo = localStorage.getItem("discord_connection_info")
      if (storedDiscordInfo) {
        try {
          const discordInfo = JSON.parse(storedDiscordInfo)
          setDiscordConnected(true)
          setDiscordUserId(discordInfo.id)
          setDiscordUsername(discordInfo.username)
          toast({
            title: "Discord Connected",
            description: `Successfully connected as ${discordInfo.username}`,
          })
        } catch (e) {
          console.error("Failed to parse Discord info:", e)
          setRegistrationError("Failed to process Discord connection. Please try again.")
        }
      } else {
        setRegistrationError("Discord connection data not found. Please try connecting again.")
      }
    }

    // Handle Discord connection errors
    const discordError = params.get("discord_error")
    if (discordError) {
      let errorMessage = "Failed to connect Discord account."
      let isConfigError = false

      switch (discordError) {
        case "oauth_failed":
          errorMessage = "Discord OAuth failed. Please try again."
          break
        case "storage_failed":
          errorMessage = "Failed to store Discord connection. Please try again."
          break
        case "missing_params":
          errorMessage = "Invalid Discord response. Please try again."
          break
        case "config_error":
        case "missing_client_secret":
          errorMessage = "Discord OAuth is not properly configured. Please contact an administrator."
          isConfigError = true
          break
        case "token_failed":
          errorMessage = "Failed to exchange Discord authorization code. Please try again."
          break
        case "user_info_failed":
          errorMessage = "Failed to retrieve Discord user information. Please try again."
          break
        case "no_code":
          errorMessage = "No authorization code received from Discord. Please try again."
          break
        default:
          errorMessage = `Discord connection error: ${discordError}`
      }

      setDiscordConfigError(isConfigError)
      setRegistrationError(errorMessage)
      toast({
        title: "Discord Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [toast])

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
      gamerTag: "",
      primaryPosition: "",
      secondaryPosition: "",
      console: "",
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

    if (!discordConnected || !discordUserId || !discordUsername) {
      toast({
        title: "Discord Required",
        description: "Please connect your Discord account before registering",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setRegistrationError(null)
    setRegistrationDetails(null)

    try {
      console.log("Starting registration for:", data.email)

      // Use the standard registration API endpoint with Discord info
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          metadata: {
            gamer_tag_id: data.gamerTag,
            primary_position: data.primaryPosition,
            secondary_position: data.secondaryPosition || null,
            console: data.console,
            is_active: true,
            discord_id: discordUserId,
            discord_username: discordUsername,
          },
          // Include Discord info for saving to database
          discordInfo: {
            id: discordUserId,
            username: discordUsername,
            discriminator: "0000",
            avatar: null,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Store details for debugging if available
        if (result.details) {
          setRegistrationDetails(result.details)
        }
        throw new Error(result.error || "Registration failed")
      }

      // Success - clear Discord info from localStorage
      localStorage.removeItem("discord_connection_info")

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      })

      // Redirect to login page or dashboard
      router.push("/login?registered=true")
    } catch (error: any) {
      console.error("Registration error:", error)
      setRegistrationError(error.message || "An error occurred during registration")
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to reset Discord connection
  const resetDiscordConnection = () => {
    setDiscordConnected(false)
    setDiscordUserId(null)
    setDiscordUsername(null)
    setDiscordConfigError(false)
    localStorage.removeItem("discord_connection_info")
    setRegistrationError(null)
    setRegistrationDetails(null)

    // Clear URL parameters
    const url = new URL(window.location.href)
    url.searchParams.delete("discord_connected")
    url.searchParams.delete("discord_error")
    window.history.replaceState({}, "", url.toString())
  }

  // Function to handle Discord connection
  const handleDiscordConnect = (userId: string, username: string) => {
    setDiscordConnected(true)
    setDiscordUserId(userId)
    setDiscordUsername(username)
    setRegistrationError(null)
    setRegistrationDetails(null)
    setDiscordConfigError(false)

    // Store Discord info in localStorage for persistence
    localStorage.setItem(
      "discord_connection_info",
      JSON.stringify({
        id: userId,
        username: username,
      }),
    )
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
              Join the Secret Chel Society
            </h1>
            <p className="hockey-subtitle mx-auto mb-12 max-w-2xl">
              Create your account and become part of the premier hockey gaming community. 
              Connect with players, join teams, and compete in the most exciting league experience.
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
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Create Account</CardTitle>
                  <CardDescription className="text-ice-blue-100">
                    Join the SCS community today
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 p-6">
                {registrationError && (
                  <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-600 text-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Registration Error</h3>
                          <p className="text-goal-red-100 text-xs">{registrationError}</p>
                          {discordConfigError && (
                            <p className="text-goal-red-100 text-xs mt-1">
                              This appears to be a configuration issue. The Discord OAuth integration needs to be set up by an administrator.
                            </p>
                          )}
                          {registrationDetails && (
                            <details className="mt-2 text-xs">
                              <summary className="text-goal-red-100 cursor-pointer">Technical Details</summary>
                              <pre className="mt-2 whitespace-pre-wrap text-xs text-goal-red-100">{JSON.stringify(registrationDetails, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Important</h3>
                        <p className="text-ice-blue-100 text-xs">
                          You must connect your Discord account to register. This is required for league communications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Discord Connection Section */}
              <div className="hockey-card border-2 border-assist-green-200 dark:border-assist-green-700 overflow-hidden">
                <div className="bg-gradient-to-r from-assist-green-500 to-goal-red-600 text-white p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Step 1: Connect Discord</h3>
                      <p className="text-assist-green-100 text-xs">
                        Discord connection is required for SCS communication
                      </p>
                    </div>
                  </div>
                  
                  {discordConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-white">
                        <CheckCircle2 className="h-5 w-5 text-assist-green-200" />
                        <span className="text-sm">Discord Connected: {discordUsername || "User"}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetDiscordConnection}
                        className="w-full border-white/30 text-white hover:bg-white/10"
                      >
                        Disconnect & Try Again
                      </Button>
                    </div>
                  ) : discordConfigError ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-white">
                        <Settings className="h-5 w-5 text-goal-red-200" />
                        <span className="text-sm">Discord OAuth Not Configured</span>
                      </div>
                      <p className="text-xs text-assist-green-100">
                        The Discord integration needs to be configured by an administrator before registration can proceed.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetDiscordConnection}
                        className="w-full border-white/30 text-white hover:bg-white/10"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <DiscordConnectButton
                      userId="registration"
                      source="register"
                      className="w-full"
                      onSuccess={handleDiscordConnect}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-ice-blue-600" />
                  Step 2: Account Information
                </h3>
              </div>

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
                <Label htmlFor="password" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rink-blue-600" />
                  Password
                </Label>
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

              <div className="space-y-3">
                <Label htmlFor="gamerTag" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-assist-green-600" />
                  Gamer Tag
                </Label>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Your Xbox or PSN name (2-50 characters)</p>
                <Input 
                  id="gamerTag" 
                  placeholder="Your in-game name" 
                  {...register("gamerTag")} 
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
                {errors.gamerTag && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.gamerTag.message}
                </p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="primaryPosition" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Target className="h-4 w-4 text-goal-red-600" />
                  Primary Position
                </Label>
                <select
                  id="primaryPosition"
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  {...register("primaryPosition")}
                >
                  <option value="">Select position</option>
                  <option value="Center">Center (C)</option>
                  <option value="Left Wing">Left Wing (LW)</option>
                  <option value="Right Wing">Right Wing (RW)</option>
                  <option value="Left Defense">Left Defense (LD)</option>
                  <option value="Right Defense">Right Defense (RD)</option>
                  <option value="Goalie">Goalie (G)</option>
                </select>
                {errors.primaryPosition && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.primaryPosition.message}
                </p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="secondaryPosition" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Target className="h-4 w-4 text-hockey-silver-600" />
                  Secondary Position (Optional)
                </Label>
                <select
                  id="secondaryPosition"
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  {...register("secondaryPosition")}
                >
                  <option value="">None</option>
                  <option value="Center">Center (C)</option>
                  <option value="Left Wing">Left Wing (LW)</option>
                  <option value="Right Wing">Right Wing (RW)</option>
                  <option value="Left Defense">Left Defense (LD)</option>
                  <option value="Right Defense">Right Defense (RD)</option>
                  <option value="Goalie">Goalie (G)</option>
                </select>
                {errors.secondaryPosition && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.secondaryPosition.message}
                </p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="console" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-rink-blue-600" />
                  Console
                </Label>
                <select
                  id="console"
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  {...register("console")}
                >
                  <option value="">Select console</option>
                  <option value="PS5">PlayStation 5</option>
                  <option value="Xbox">Xbox Series X</option>
                </select>
                {errors.console && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.console.message}
                </p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
              <Button 
                type="submit" 
                className="w-full btn-championship hover:scale-105 transition-all duration-200" 
                disabled={isLoading || !discordConnected || discordConfigError}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    className="text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 font-medium hover:underline transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
