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
import { Loader2, AlertCircle, CheckCircle2, Info, Settings, Trophy, Medal, Target, Zap, Shield, Database, Activity, TrendingUp, Users, BarChart3, Clock, Calendar, FileText, BookOpen, Globe, Publish, AlertTriangle, CheckCircle, Edit, Save, Award, Crown, Gamepad2, Play, Pause, Stop, Eye, EyeOff, Filter, Search, Download, Upload, LogIn, User, Lock, Mail, Key, ArrowRight, ArrowLeft, UserPlus, GamepadIcon, ShieldCheck, Bot, MessageSquare, Star, Gift, Coins } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DiscordConnectButton from "@/components/auth/discord-connect-button"
import { motion } from "framer-motion"

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
      <motion.div 
        className="relative overflow-hidden py-12 px-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl"
          animate={{ 
            y: [-20, 20, -20],
            x: [-10, 10, -10]
          }}
          transition={{ 
            duration: 6, 
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl"
          animate={{ 
            y: [20, -20, 20],
            x: [10, -10, 10]
          }}
          transition={{ 
            duration: 8, 
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div 
              className="inline-flex items-center gap-4 mb-8" 
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/30 to-rink-blue-500/30 rounded-xl blur-lg scale-150" />
                <div className="relative p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl shadow-lg">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="hockey-title text-3xl md:text-4xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-ice-blue-800 dark:from-ice-blue-400 dark:via-rink-blue-400 dark:to-ice-blue-600 bg-clip-text text-transparent">
                Join the Secret Chel Society
              </h1>
            </motion.div>
            <motion.div 
              className="h-1 w-40 bg-gradient-to-r from-ice-blue-500 via-rink-blue-500 to-transparent rounded-full mx-auto mb-8"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.p 
              className="hockey-subtitle text-lg md:text-xl mx-auto mb-8 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Create your account and become part of the premier hockey gaming community. 
              Connect with players, join teams, and compete in the most exciting league experience.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <Card className="hockey-enhanced-card border-2 border-ice-blue-200/60 dark:border-ice-blue-700/60 overflow-hidden shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl font-bold">Create Your Account</CardTitle>
                    <CardDescription className="text-ice-blue-100 text-base">
                      Join the SCS community and start your hockey journey
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6 p-6">
                  {registrationError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="hockey-card border-2 border-goal-red-200/60 dark:border-goal-red-700/60 overflow-hidden">
                        <div className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Registration Error</h3>
                              <p className="text-goal-red-100 text-sm">{registrationError}</p>
                              {discordConfigError && (
                                <p className="text-goal-red-100 text-sm mt-2">
                                  This appears to be a configuration issue. The Discord OAuth integration needs to be set up by an administrator.
                                </p>
                              )}
                              {registrationDetails && (
                                <details className="mt-3 text-sm">
                                  <summary className="text-goal-red-100 cursor-pointer hover:text-white transition-colors">Technical Details</summary>
                                  <pre className="mt-2 whitespace-pre-wrap text-xs text-goal-red-100 bg-white/10 p-2 rounded">{JSON.stringify(registrationDetails, null, 2)}</pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Card className="hockey-card border-2 border-ice-blue-200/60 dark:border-ice-blue-700/60 overflow-hidden">
                      <div className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <Info className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Important Information</h3>
                            <p className="text-ice-blue-100 text-sm">
                              You must connect your Discord account to register. This is required for league communications and team coordination.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Discord Connection Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="hockey-card border-2 border-assist-green-200/60 dark:border-assist-green-700/60 overflow-hidden">
                      <div className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Step 1: Connect Discord</h3>
                            <p className="text-assist-green-100 text-sm">
                              Discord connection is required for SCS communication and team coordination
                            </p>
                          </div>
                        </div>
                        
                        {discordConnected ? (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-white bg-white/10 p-4 rounded-lg">
                              <CheckCircle2 className="h-6 w-6 text-assist-green-200" />
                              <span className="text-lg font-medium">Discord Connected: {discordUsername || "User"}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={resetDiscordConnection}
                              className="w-full border-white/30 text-white hover:bg-white/10 text-lg py-3"
                            >
                              Disconnect & Try Again
                            </Button>
                          </div>
                        ) : discordConfigError ? (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-white bg-white/10 p-4 rounded-lg">
                              <Settings className="h-6 w-6 text-goal-red-200" />
                              <span className="text-lg font-medium">Discord OAuth Not Configured</span>
                            </div>
                            <p className="text-sm text-assist-green-100">
                              The Discord integration needs to be configured by an administrator before registration can proceed.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={resetDiscordConnection}
                              className="w-full border-white/30 text-white hover:bg-white/10 text-lg py-3"
                            >
                              Try Again
                            </Button>
                          </div>
                        ) : (
                          <DiscordConnectButton
                            userId="registration"
                            source="register"
                            className="w-full text-lg py-4"
                            onSuccess={handleDiscordConnect}
                          />
                        )}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Step 2: Account Information
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="email" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-ice-blue-600" />
                          Email Address
                        </Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...register("email")} 
                          className="hockey-search"
                        />
                        {errors.email && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.email.message}
                        </p>}
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="password" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-rink-blue-600" />
                          Password
                        </Label>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          {...register("password")} 
                          className="hockey-search"
                        />
                        {errors.password && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.password.message}
                        </p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="gamerTag" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-assist-green-600" />
                        Gamer Tag
                      </Label>
                      <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Your Xbox or PSN name (2-50 characters)</p>
                      <Input 
                        id="gamerTag" 
                        placeholder="Your in-game name" 
                        {...register("gamerTag")} 
                        className="hockey-search"
                      />
                      {errors.gamerTag && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.gamerTag.message}
                      </p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="primaryPosition" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                          <Target className="h-4 w-4 text-goal-red-600" />
                          Primary Position
                        </Label>
                        <select
                          id="primaryPosition"
                          className="hockey-search"
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
                        {errors.primaryPosition && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.primaryPosition.message}
                        </p>}
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="secondaryPosition" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                          <Target className="h-4 w-4 text-hockey-silver-600" />
                          Secondary Position (Optional)
                        </Label>
                        <select
                          id="secondaryPosition"
                          className="hockey-search"
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
                        {errors.secondaryPosition && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.secondaryPosition.message}
                        </p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="console" className="text-base font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-rink-blue-600" />
                        Console
                      </Label>
                      <select
                        id="console"
                        className="hockey-search"
                        {...register("console")}
                      >
                        <option value="">Select console</option>
                        <option value="PS5">PlayStation 5</option>
                        <option value="Xbox">Xbox Series X</option>
                      </select>
                      {errors.console && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.console.message}
                      </p>}
                    </div>
                  </motion.div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full hockey-button-enhanced text-lg py-3" 
                      disabled={isLoading || !discordConnected || discordConfigError}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-3 h-6 w-6" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center"
                  >
                    <p className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Already have an account?{" "}
                      <Link 
                        href="/login" 
                        className="text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 font-semibold hover:underline transition-colors duration-200"
                      >
                        Sign In
                      </Link>
                    </p>
                  </motion.div>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
