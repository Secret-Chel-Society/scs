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
import { Loader2, AlertCircle, CheckCircle2, Info, Settings, UserPlus, Shield, Users, Gamepad2, MessageSquare } from "lucide-react"
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
  console: z.string().refine((value) => ["PS5", "Xbox"].includes(value), {
    message: "Please select a valid console",
  }),
  primaryPosition: z.string().min(1, { message: "Please select a primary position" }),
  secondaryPosition: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function RegisterStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">Join</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <UserPlus className="h-5 w-5" />
          Community
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">Free</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Agent
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">Play</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          & Compete
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">Win</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Championships
        </div>
      </div>
    </div>
  )
}

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
      // First try to get Discord info from URL parameters (more reliable)
      const discordId = params.get("discord_id")
      const discordUsername = params.get("discord_username")
      
      if (discordId && discordUsername) {
        console.log("Discord info from URL params:", { discordId, discordUsername })
        setDiscordConnected(true)
        setDiscordUserId(discordId)
        setDiscordUsername(discordUsername)
        
        toast({
          title: "Discord Connected",
          description: `Successfully connected as ${discordUsername}`,
        })
      } else {
        // Fallback to localStorage
        const storedDiscordInfo = localStorage.getItem("discord_temp_info")
        console.log("Discord connection success, stored info:", storedDiscordInfo)
        
        if (storedDiscordInfo) {
          try {
            const discordInfo = JSON.parse(storedDiscordInfo)
            console.log("Parsed Discord info:", discordInfo)
            
            setDiscordConnected(true)
            setDiscordUserId(discordInfo.discord_id)
            setDiscordUsername(discordInfo.username)
            
            // Clean up localStorage to prevent stale data
            localStorage.removeItem("discord_temp_info")
            
            toast({
              title: "Discord Connected",
              description: `Successfully connected as ${discordInfo.username}`,
            })
          } catch (e) {
            console.error("Failed to parse Discord info:", e)
            setRegistrationError("Failed to process Discord connection. Please try again.")
          }
        } else {
          console.error("No Discord info found in URL params or localStorage")
          setRegistrationError("Discord connection data not found. Please try connecting again.")
        }
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
      console: "",
      primaryPosition: "",
      secondaryPosition: "",
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
            is_active: true,
            discord_id: discordUserId,
            discord_username: discordUsername,
            primary_position: data.primaryPosition,
            secondary_position: data.secondaryPosition || null,
            console: data.console,
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
        description: "Your account has been created successfully! You are now a free agent.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              Join SCS
            </h1>
            <p className="text-xl text-green-200 mb-8">
              Create your account and become part of the Secret Chel Society
            </p>
          </div>

          {/* Register Statistics */}
          <RegisterStats />

          {/* Main Registration Form */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Create an Account</CardTitle>
                <CardDescription className="text-green-200">Join the SCS community today</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {registrationError && (
                    <Alert variant="destructive" className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-red-200">Error</AlertTitle>
                      <AlertDescription className="text-red-300">
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

                  <Alert className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-200">Important</AlertTitle>
                    <AlertDescription className="text-blue-300">
                      You must connect your Discord account to register. This is required for league communications.
                    </AlertDescription>
                  </Alert>

                  {/* Discord Connection Section */}
                  <div className="space-y-2 border border-white/20 rounded-md p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                    <h3 className="font-medium text-sm text-white">Step 1: Connect Discord</h3>
                    <p className="text-sm text-green-300 mb-2">
                      Discord connection is required for SCS communication
                    </p>
                    {discordConnected ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-white">Discord Connected: {discordUsername || "User"}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetDiscordConnection}
                          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                        >
                          Disconnect & Try Again
                        </Button>
                      </div>
                    ) : discordConfigError ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-orange-400">
                          <Settings className="h-5 w-5" />
                          <span className="text-white">Discord OAuth Not Configured</span>
                        </div>
                        <p className="text-xs text-green-300">
                          The Discord integration needs to be configured by an administrator before registration can
                          proceed.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetDiscordConnection}
                          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
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

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-white">Step 2: Account Information</h3>
                  </div>

                  {/* Free Agent Notice */}
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white">Free Agent Status</h3>
                    <p className="text-sm text-white/80">
                      All new registrations automatically become free agents. You'll be available for teams to bid on during the free agency period.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...register("email")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400"
                    />
                    {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      {...register("password")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400"
                    />
                    {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gamerTag" className="text-white">Gamer Tag</Label>
                    <p className="text-sm text-green-300 mb-1">Your Xbox or PSN name (2-50 characters)</p>
                    <Input 
                      id="gamerTag" 
                      placeholder="Your in-game name" 
                      {...register("gamerTag")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400"
                    />
                    {errors.gamerTag && <p className="text-sm text-red-400">{errors.gamerTag.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="console" className="text-white">Console</Label>
                    <select
                      id="console"
                      className="flex h-10 w-full rounded-md border border-white/20 bg-black/80 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("console")}
                    >
                      <option value="">Select console</option>
                      <option value="PS5">PlayStation 5</option>
                      <option value="Xbox">Xbox Series X</option>
                    </select>
                    {errors.console && <p className="text-sm text-red-400">{errors.console.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryPosition" className="text-white">Primary Position</Label>
                      <select
                        id="primaryPosition"
                        className="flex h-10 w-full rounded-md border border-white/20 bg-black/80 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("primaryPosition")}
                      >
                        <option value="">Select position</option>
                        <option value="C">Center (C)</option>
                        <option value="LW">Left Wing (LW)</option>
                        <option value="RW">Right Wing (RW)</option>
                        <option value="LD">Left Defense (LD)</option>
                        <option value="RD">Right Defense (RD)</option>
                        <option value="G">Goalie (G)</option>
                      </select>
                      <p className="text-sm text-green-300">Your preferred position to play</p>
                      {errors.primaryPosition && <p className="text-sm text-red-400">{errors.primaryPosition.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryPosition" className="text-white">Secondary Position</Label>
                      <select
                        id="secondaryPosition"
                        className="flex h-10 w-full rounded-md border border-white/20 bg-black/80 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("secondaryPosition")}
                      >
                        <option value="">Select position (optional)</option>
                        <option value="C">Center (C)</option>
                        <option value="LW">Left Wing (LW)</option>
                        <option value="RW">Right Wing (RW)</option>
                        <option value="LD">Left Defense (LD)</option>
                        <option value="RD">Right Defense (RD)</option>
                        <option value="G">Goalie (G)</option>
                      </select>
                      <p className="text-sm text-green-300">Optional backup position</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white" 
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
                  <p className="text-sm text-center text-green-200">
                    Already have an account?{" "}
                    <Link href="/login" className="text-green-300 hover:text-green-200 hover:underline font-medium">
                      Log in
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
