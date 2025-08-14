"use client"

import type React from "react"
import { useSupabase } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SeasonRegistrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, session } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [activeSeason, setActiveSeason] = useState<{ id: string; name: string; season_number?: number } | null>(null)
  const [loadingActiveSeason, setLoadingActiveSeason] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Form state
  const [gamerTag, setGamerTag] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("none")
  const [consoleType, setConsoleType] = useState("")

  // Form validation
  const [errors, setErrors] = useState<{
    gamerTag?: string
    primaryPosition?: string
    consoleType?: string
  }>({})

  const fetchActiveSeason = async () => {
    try {
      setLoadingActiveSeason(true)

      // Get current active season ID from system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (settingsError) {
        window.console.error("Error fetching current season setting:", settingsError)
        setDebugInfo((prev) => prev + `\nError fetching settings: ${settingsError.message}`)
        setLoadingActiveSeason(false)
        return null
      }

      // If we have a current_season setting, use that exact ID
      if (settingsData?.value) {
        const seasonId = settingsData.value
        setDebugInfo((prev) => prev + `\nActive season ID from settings: ${seasonId}`)

        // Get season details with exact match
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("id, name, season_number")
          .eq("id", seasonId)
          .single()

        if (seasonError) {
          window.console.error("Error fetching season:", seasonError)
          setDebugInfo((prev) => prev + `\nError fetching season: ${seasonError.message}`)

          // As a fallback, try to get any active season
          const { data: fallbackSeason, error: fallbackError } = await supabase
            .from("seasons")
            .select("id, name, season_number")
            .eq("is_active", true)
            .single()

          if (fallbackError) {
            window.console.error("Error fetching fallback season:", fallbackError)
            setDebugInfo((prev) => prev + `\nError fetching fallback season: ${fallbackError.message}`)
            setLoadingActiveSeason(false)
            return null
          }

          setDebugInfo((prev) => prev + `\nUsing fallback active season: ${JSON.stringify(fallbackSeason)}`)
          setLoadingActiveSeason(false)
          return fallbackSeason
        }

        setDebugInfo((prev) => prev + `\nFound season by ID: ${JSON.stringify(seasonData)}`)
        setLoadingActiveSeason(false)
        return seasonData
      } else {
        // If no current_season setting, try to find an active season
        const { data: activeSeason, error: activeSeasonError } = await supabase
          .from("seasons")
          .select("id, name, season_number")
          .eq("is_active", true)
          .single()

        if (activeSeasonError) {
          window.console.error("Error fetching active season:", activeSeasonError)
          setDebugInfo((prev) => prev + `\nError fetching active season: ${activeSeasonError.message}`)
          setLoadingActiveSeason(false)
          return null
        }

        setDebugInfo((prev) => prev + `\nFound active season: ${JSON.stringify(activeSeason)}`)
        setLoadingActiveSeason(false)
        return activeSeason
      }
    } catch (error) {
      window.console.error("Error in fetchActiveSeason:", error)
      setDebugInfo((prev) => prev + `\nUnhandled error: ${JSON.stringify(error)}`)
      setLoadingActiveSeason(false)
      return null
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for the season.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Fetch active season from system settings
    const fetchActiveSeasonData = async () => {
      setLoadingActiveSeason(true)
      try {
        const seasonData = await fetchActiveSeason()

        if (!seasonData) {
          setDebugInfo((prev) => prev + "\nNo active season found")
          toast({
            title: "No active season",
            description: "There is no active season available for registration.",
            variant: "destructive",
          })
          setLoadingActiveSeason(false)
          return
        }

        setActiveSeason(seasonData)
        setDebugInfo((prev) => prev + `\nActive season set to: ${JSON.stringify(seasonData)}`)
        setLoadingActiveSeason(false)

        // Check if user has already registered for this season
        checkRegistration(seasonData.id)
      } catch (error) {
        window.console.error("Error in fetchActiveSeasonData:", error)
        setDebugInfo((prev) => prev + `\nUnhandled error: ${JSON.stringify(error)}`)
        setLoadingActiveSeason(false)
      }
    }

    fetchActiveSeasonData()
  }, [session, router, toast, supabase])

  // Check if user has already registered for the current season
  const checkRegistration = async (seasonId: string) => {
    if (!session?.user) return

    setIsCheckingRegistration(true)
    try {
      const { data, error } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_id", seasonId)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned"
        window.console.error("Error checking registration:", error)
        setDebugInfo((prev) => prev + `\nRegistration check error: ${error.message}`)
      }

      setHasRegistered(!!data)
      setDebugInfo((prev) => prev + `\nHas registered: ${!!data}`)
    } catch (error) {
      window.console.error("Error checking registration:", error)
      setDebugInfo((prev) => prev + `\nRegistration check exception: ${JSON.stringify(error)}`)
    } finally {
      setIsCheckingRegistration(false)
    }
  }

  const validateForm = () => {
    const newErrors: {
      gamerTag?: string
      primaryPosition?: string
      consoleType?: string
    } = {}

    if (!gamerTag || gamerTag.length < 3) {
      newErrors.gamerTag = "Gamer Tag must be at least 3 characters."
    }

    if (!primaryPosition) {
      newErrors.primaryPosition = "Please select a primary position."
    }

    if (!consoleType) {
      newErrors.consoleType = "Please select a console."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for the season.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!activeSeason) {
      toast({
        title: "No active season",
        description: "There is no active season available for registration.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check again if user has already registered
      const { data: existingReg } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_id", activeSeason.id)
        .single()

      if (existingReg) {
        setHasRegistered(true)
        toast({
          title: "Already Registered",
          description:
            "Error: User is already signed up for the season. Please contact a League Official if you want to be removed from the season signup or change positions.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Prepare registration data
      // Use season_number if it exists, otherwise use derived_season_number or a default
      const seasonNumber = activeSeason.season_number || activeSeason.derived_season_number || 1

      const registrationData = {
        user_id: session.user.id,
        season_id: activeSeason.id,
        season_number: seasonNumber,
        primary_position: primaryPosition,
        secondary_position: secondaryPosition === "none" ? null : secondaryPosition,
        gamer_tag: gamerTag,
        console: consoleType,
        status: "Pending",
      }

      setDebugInfo((prev) => prev + `\nSubmitting registration: ${JSON.stringify(registrationData)}`)

      // Insert season registration
      const { error } = await supabase.from("season_registrations").insert(registrationData)

      if (error) {
        setDebugInfo((prev) => prev + `\nRegistration error: ${error.message}`)

        // Check if the error is due to the user already being registered
        if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
          setHasRegistered(true)
          throw new Error(
            "User is already signed up for the season. Please contact a League Official if you want to be removed from the season signup or change positions.",
          )
        }

        throw error
      }

      toast({
        title: "Registration successful!",
        description: `Your registration for ${activeSeason.name} has been submitted for review.`,
      })

      router.push("/profile")
    } catch (error: any) {
      setDebugInfo((prev) => prev + `\nRegistration exception: ${JSON.stringify(error)}`)
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      const checkBanStatus = async () => {
        const { data: user, error } = await supabase
          .from("users")
          .select("is_banned, ban_reason, ban_expires_at")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error checking ban status:", error)
          toast({
            title: "Error",
            description: "Failed to check account status. Please try again.",
            variant: "destructive",
          })
          return
        }

        if (user?.is_banned) {
          const isTemporaryBan = user.ban_expires_at && new Date(user.ban_expires_at) > new Date()

          toast({
            title: "Account Suspended",
            description: `Your account is currently suspended and you cannot register for the season. ${
              isTemporaryBan
                ? `Suspension expires: ${new Date(user.ban_expires_at).toLocaleDateString()}`
                : "This is a permanent suspension."
            }`,
            variant: "destructive",
          })
          router.push("/") // Redirect to home page where they'll see the ban modal
          return
        }
      }

      checkBanStatus()
    }
  }, [session, supabase, toast, router])

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to register for the season.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadingActiveSeason || isCheckingRegistration) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center">Loading season information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Season Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Season</AlertTitle>
              <AlertDescription>
                There is currently no active season available for registration. Please check back later.
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono whitespace-pre-wrap">
                <p className="font-bold">Debug Information:</p>
                {debugInfo || "No debug info available"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasRegistered) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Season Registration</CardTitle>
              <CardDescription>Your registration status for {activeSeason.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Already Registered</AlertTitle>
                <AlertDescription>
                  Error: User is already signed up for the season. Please contact a League Official if you want to be
                  removed from the season signup or change positions.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center mt-4">
                <Button onClick={() => router.push("/profile")} variant="outline">
                  Return to Profile
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-6">
              <div className="text-sm">
                Questions? Contact us on{" "}
                <a
                  href="https://discord.gg/PnbwXuDf2A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Discord
                </a>
                .
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{activeSeason.name} Registration</CardTitle>
            <CardDescription>Register to participate for Season 1 of the Major Gaming Hockey League</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">{activeSeason.name} Information</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Registration Deadline: June 12, 2025</li>
                <li>Bidding: June 13th 8PM Est - June 15th 2PM Est.</li>
                <li>Preseason: June 18th-20th</li>
                <li>Season Start Date: June 25th, 2025</li>
                <li>Format: 60 regular season games</li>
                <li>Games: Wednesday, Thursday, and Friday at 8:30, 9:10, 9:50 PM EST</li>
                <li>Season Ends: August 8th, 2025</li>
                <li>Playoffs: August 13th-Aug 29th 2025</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gamerTag">Gamer Tag</Label>
                <Input
                  id="gamerTag"
                  placeholder="Your PSN or Xbox Gamertag"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">This must match your gamer tag exactly.</p>
                {errors.gamerTag && <p className="text-sm text-destructive">{errors.gamerTag}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryPosition">Primary Position</Label>
                  <Select onValueChange={setPrimaryPosition} value={primaryPosition}>
                    <SelectTrigger id="primaryPosition">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Center (C)</SelectItem>
                      <SelectItem value="LW">Left Wing (LW)</SelectItem>
                      <SelectItem value="RW">Right Wing (RW)</SelectItem>
                      <SelectItem value="LD">Left Defense (LD)</SelectItem>
                      <SelectItem value="RD">Right Defense (RD)</SelectItem>
                      <SelectItem value="G">Goalie (G)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Your preferred position to play.</p>
                  {errors.primaryPosition && <p className="text-sm text-destructive">{errors.primaryPosition}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryPosition">Secondary Position</Label>
                  <Select onValueChange={setSecondaryPosition} value={secondaryPosition}>
                    <SelectTrigger id="secondaryPosition">
                      <SelectValue placeholder="Select position (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="C">Center (C)</SelectItem>
                      <SelectItem value="LW">Left Wing (LW)</SelectItem>
                      <SelectItem value="RW">Right Wing (RW)</SelectItem>
                      <SelectItem value="LD">Left Defense (LD)</SelectItem>
                      <SelectItem value="RD">Right Defense (RD)</SelectItem>
                      <SelectItem value="G">Goalie (G)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Optional backup position.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consoleType">Console</Label>
                <Select onValueChange={setConsoleType} value={consoleType}>
                  <SelectTrigger id="consoleType">
                    <SelectValue placeholder="Select console" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="PS5">PS5</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Your gaming platform.</p>
                {errors.consoleType && <p className="text-sm text-destructive">{errors.consoleType}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono whitespace-pre-wrap">
                <p className="font-bold">Debug Information:</p>
                {debugInfo || "No debug info available"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6">
            <div className="text-sm text-muted-foreground">
              By registering, you agree to abide by the league rules and code of conduct. All registrations are subject
              to review by league management. Key Requirement for the season: -Players must play 3 games a min of 3
              games a week.
            </div>
            <div className="text-sm">
              Questions? Contact us on{" "}
              <a
                href="https://discord.gg/mghl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Discord
              </a>
              .
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
