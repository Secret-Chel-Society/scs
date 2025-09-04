"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DiscordConnectButton from "@/components/auth/discord-connect-button"
import Link from "next/link"
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Settings,
  Trophy,
  Calendar,
  Users,
  Star,
  Shield,
  Gamepad2,
  Clock,
  Target,
  Zap
} from "lucide-react"

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

export default function SeasonRegistrationPage() {
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ice-blue-500/20 via-rink-blue-500/20 to-ice-blue-500/20 border-b border-ice-blue-200/50 dark:border-rink-blue-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-ice-blue-400/10 to-rink-blue-400/10 rounded-full -translate-y-16 translate-x-16 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-rink-blue-400/10 to-ice-blue-400/10 rounded-full translate-y-12 -translate-x-12 blur-xl" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ice-blue-600 via-rink-blue-600 to-ice-blue-500 bg-clip-text text-transparent">
                Season Registration
              </h1>
            </div>
            <p className="text-lg md:text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl mx-auto mb-8">
              Join the ultimate NHL 26 competitive experience. Register your account and compete for glory in the Secret Chel Society.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-ice-blue-500 to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="hockey-enhanced-card">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                  Create an Account
                </CardTitle>
                <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                  Join the SCS community today
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {registrationError && (
                    <Alert variant="destructive" className="hockey-enhanced-card border-goal-red-200 dark:border-goal-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-hockey-silver-900 dark:text-hockey-silver-100">Error</AlertTitle>
                      <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">
                        {registrationError}
                        {discordConfigError && (
                          <div className="mt-2 text-sm">
                            <p>
                              This appears to be a configuration issue. The Discord OAuth integration needs to be set up by
                              an administrator.
                            </p>
                          </div>
                        )}
                        {registrationDetails && (
                          <details className="mt-2 text-xs">
                            <summary>Technical Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(registrationDetails, null, 2)}</pre>
                          </details>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert className="hockey-enhanced-card border-ice-blue-200 dark:border-rink-blue-700">
                    <Info className="h-4 w-4 text-ice-blue-500" />
                    <AlertTitle className="text-hockey-silver-900 dark:text-hockey-silver-100">Important</AlertTitle>
                    <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      You must connect your Discord account to register. This is required for league communications.
                    </AlertDescription>
                  </Alert>

                  {/* Discord Connection Section */}
                  <div className="space-y-4 p-4 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50">
                    <h3 className="text-base font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-ice-blue-500" />
                      Step 1: Connect Discord
                    </h3>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                      Discord connection is required for SCS communication
                    </p>
                    {discordConnected ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-assist-green-600 dark:text-assist-green-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Discord Connected: {discordUsername || "User"}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetDiscordConnection}
                          className="w-full hockey-button-enhanced"
                        >
                          Disconnect & Try Again
                        </Button>
                      </div>
                    ) : discordConfigError ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-goal-red-600 dark:text-goal-red-400">
                          <Settings className="h-5 w-5" />
                          <span>Discord OAuth Not Configured</span>
                        </div>
                        <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">
                          The Discord integration needs to be configured by an administrator before registration can
                          proceed.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetDiscordConnection}
                          className="w-full hockey-button-enhanced"
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

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-2">
                      <Users className="h-4 w-4 text-rink-blue-500" />
                      Step 2: Account Information
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-ice-blue-500" />
                      Email
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...register("email")} 
                      className="hockey-search"
                    />
                    {errors.email && <p className="text-sm text-goal-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-rink-blue-500" />
                      Password
                    </Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      {...register("password")} 
                      className="hockey-search"
                    />
                    {errors.password && <p className="text-sm text-goal-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="gamerTag" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-assist-green-500" />
                      Gamer Tag
                    </Label>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Your Xbox or PSN name (2-50 characters)</p>
                    <Input 
                      id="gamerTag" 
                      placeholder="Your in-game name" 
                      {...register("gamerTag")} 
                      className="hockey-search"
                    />
                    {errors.gamerTag && <p className="text-sm text-goal-red-500">{errors.gamerTag.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="primaryPosition" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-ice-blue-500" />
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
                    {errors.primaryPosition && <p className="text-sm text-goal-red-500">{errors.primaryPosition.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="secondaryPosition" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-rink-blue-500" />
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
                    {errors.secondaryPosition && <p className="text-sm text-goal-red-500">{errors.secondaryPosition.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="console" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-assist-green-500" />
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
                    {errors.console && <p className="text-sm text-goal-red-500">{errors.console.message}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full hockey-button-enhanced bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white" 
                    disabled={isLoading || !discordConnected || discordConfigError}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-center text-hockey-silver-600 dark:text-hockey-silver-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-ice-blue-500 hover:text-ice-blue-600 hover:underline">
                      Log in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
