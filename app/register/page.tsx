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
import { Loader2, AlertCircle, CheckCircle2, Info, Settings } from "lucide-react"
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
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join the MGHL community today</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {registrationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
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

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  You must connect your Discord account to register. This is required for league communications.
                </AlertDescription>
              </Alert>

              {/* Discord Connection Section */}
              <div className="space-y-2 border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                <h3 className="font-medium text-sm">Step 1: Connect Discord</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Discord connection is required for MGHL communication
                </p>
                {discordConnected ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Discord Connected: {discordUsername || "User"}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetDiscordConnection}
                      className="w-full bg-transparent"
                    >
                      Disconnect & Try Again
                    </Button>
                  </div>
                ) : discordConfigError ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                      <Settings className="h-5 w-5" />
                      <span>Discord OAuth Not Configured</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The Discord integration needs to be configured by an administrator before registration can
                      proceed.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetDiscordConnection}
                      className="w-full bg-transparent"
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
                <h3 className="font-medium text-sm">Step 2: Account Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gamerTag">Gamer Tag</Label>
                <p className="text-sm text-muted-foreground mb-1">Your Xbox or PSN name (2-50 characters)</p>
                <Input id="gamerTag" placeholder="Your in-game name" {...register("gamerTag")} />
                {errors.gamerTag && <p className="text-sm text-red-500">{errors.gamerTag.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryPosition">Primary Position</Label>
                <select
                  id="primaryPosition"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                {errors.primaryPosition && <p className="text-sm text-red-500">{errors.primaryPosition.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryPosition">Secondary Position (Optional)</Label>
                <select
                  id="secondaryPosition"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                {errors.secondaryPosition && <p className="text-sm text-red-500">{errors.secondaryPosition.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="console">Console</Label>
                <select
                  id="console"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("console")}
                >
                  <option value="">Select console</option>
                  <option value="PS5">PlayStation 5</option>
                  <option value="Xbox">Xbox Series X</option>
                </select>
                {errors.console && <p className="text-sm text-red-500">{errors.console.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !discordConnected || discordConfigError}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
