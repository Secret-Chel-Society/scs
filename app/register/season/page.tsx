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
import { AlertCircle, Loader2, Trophy, Calendar, Users, Target, Star, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <p className="text-center text-white">Please sign in to register for the season.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loadingActiveSeason || isCheckingRegistration) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-white">Loading season information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Season Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-red-400">No Active Season</AlertTitle>
                <AlertDescription className="text-red-300">
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
      </div>
    )
  }

  if (hasRegistered) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-3xl text-white">Season Registration</CardTitle>
                <CardDescription className="text-white/70">Your registration status for {activeSeason.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-red-400">Already Registered</AlertTitle>
                  <AlertDescription className="text-red-300">
                    Error: User is already signed up for the season. Please contact a League Official if you want to be
                    removed from the season signup or change positions.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center mt-4">
                  <Button onClick={() => router.push("/profile")} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Return to Profile
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 border-t border-white/20 pt-6">
                <div className="text-sm text-white/70">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Season Registration
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Join the Secret Chel Society and compete in our upcoming season
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white">{activeSeason.name} Registration</CardTitle>
              <CardDescription className="text-white/70">Register to participate in the Secret Chel Society</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Enhanced Season Information */}
              <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{activeSeason.name} Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Registration Deadline: June 12, 2025</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Bidding: June 13th 8PM Est - June 15th 2PM Est</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Star className="h-4 w-4 text-primary" />
                      <span>Preseason: June 18th-20th</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span>Season Start: June 25th, 2025</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Format: 60 regular season games</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Season Ends: August 8th, 2025</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="gamerTag" className="text-white font-medium">Gamer Tag</Label>
                  <Input
                    id="gamerTag"
                    placeholder="Your PSN or Xbox Gamertag"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-sm text-white/60">This must match your gamer tag exactly.</p>
                  {errors.gamerTag && <p className="text-sm text-red-400">{errors.gamerTag}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPosition" className="text-white font-medium">Primary Position</Label>
                    <Select onValueChange={setPrimaryPosition} value={primaryPosition}>
                      <SelectTrigger id="primaryPosition" className="bg-white/10 border-white/20 text-white">
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
                    <p className="text-sm text-white/60">Your preferred position to play.</p>
                    {errors.primaryPosition && <p className="text-sm text-red-400">{errors.primaryPosition}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryPosition" className="text-white font-medium">Secondary Position</Label>
                    <Select onValueChange={setSecondaryPosition} value={secondaryPosition}>
                      <SelectTrigger id="secondaryPosition" className="bg-white/10 border-white/20 text-white">
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
                    <p className="text-sm text-white/60">Optional backup position.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consoleType" className="text-white font-medium">Console</Label>
                  <Select onValueChange={setConsoleType} value={consoleType}>
                    <SelectTrigger id="consoleType" className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select console" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Xbox">Xbox</SelectItem>
                      <SelectItem value="PS5">PS5</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-white/60">Your gaming platform.</p>
                  {errors.consoleType && <p className="text-sm text-red-400">{errors.consoleType}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 text-white rounded-xl text-lg font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Submit Registration
                    </div>
                  )}
                </Button>
              </form>

              {process.env.NODE_ENV === "development" && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono whitespace-pre-wrap">
                  <p className="font-bold">Debug Information:</p>
                  {debugInfo || "No debug info available"}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t border-white/20 pt-6">
              <div className="text-sm text-white/70">
                By registering, you agree to abide by the league rules and code of conduct. All registrations are subject
                to review by league management. Key Requirement for the season: -Players must play 3 games a min of 3
                games a week.
              </div>
              <div className="text-sm text-white/70">
                Questions? Contact us on{" "}
                <a
                  href="https://discord.gg/scs"
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
    </div>
  )
}
