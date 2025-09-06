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
import { AlertCircle, Loader2, Trophy, Calendar, Users, Star, Shield, Gamepad2, Clock, Target, Zap, CheckCircle2, Hockey, Award, Crown, Medal } from "lucide-react"

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

      // First try to get from system_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "current_season")
        .single()

      if (settingsError) {
        console.log("System settings approach failed, trying seasons table:", settingsError.message)
        setDebugInfo((prev) => prev + `\nSystem settings failed: ${settingsError.message}`)
        
        // Fallback: Get active season from seasons table
        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("id, name, season_number")
          .eq("is_active", true)
          .single()

        if (seasonError) {
          console.log("Active season not found, trying first season:", seasonError.message)
          setDebugInfo((prev) => prev + `\nActive season failed: ${seasonError.message}`)
          
          // Final fallback: Get first season
          const { data: firstSeason, error: firstSeasonError } = await supabase
            .from("seasons")
            .select("id, name, season_number")
            .order("id")
            .limit(1)
            .single()

          if (firstSeasonError) {
            console.error("No seasons found:", firstSeasonError.message)
            setDebugInfo((prev) => prev + `\nNo seasons found: ${firstSeasonError.message}`)
            setLoadingActiveSeason(false)
            return null
          }

          console.log("Using first season:", firstSeason)
          setDebugInfo((prev) => prev + `\nUsing first season: ${JSON.stringify(firstSeason)}`)
          setLoadingActiveSeason(false)
          return firstSeason
        }

        console.log("Using active season:", seasonData)
        setDebugInfo((prev) => prev + `\nUsing active season: ${JSON.stringify(seasonData)}`)
        setLoadingActiveSeason(false)
        return seasonData
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
          console.log("Season by ID failed, trying active season:", seasonError.message)
          setDebugInfo((prev) => prev + `\nSeason by ID failed: ${seasonError.message}`)

          // As a fallback, try to get any active season
          const { data: fallbackSeason, error: fallbackError } = await supabase
            .from("seasons")
            .select("id, name, season_number")
            .eq("is_active", true)
            .single()

          if (fallbackError) {
            console.error("Fallback season failed:", fallbackError.message)
            setDebugInfo((prev) => prev + `\nFallback season failed: ${fallbackError.message}`)
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
          console.error("Error fetching active season:", activeSeasonError.message)
          setDebugInfo((prev) => prev + `\nError fetching active season: ${activeSeasonError.message}`)
          setLoadingActiveSeason(false)
          return null
        }

        setDebugInfo((prev) => prev + `\nFound active season: ${JSON.stringify(activeSeason)}`)
        setLoadingActiveSeason(false)
        return activeSeason
      }
    } catch (error) {
      console.error("Error in fetchActiveSeason:", error)
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
        try {
          // First try to get ban status with ban_expires_at column
          const { data: user, error } = await supabase
            .from("users")
            .select("is_banned, ban_reason, ban_expires_at")
            .eq("id", session.user.id)
            .single()

          if (error) {
            // If ban_expires_at column doesn't exist, try without it
            if (error.message.includes("ban_expires_at") || error.code === "42703") {
              console.log("ban_expires_at column not found, trying without it")
              
              const { data: userFallback, error: fallbackError } = await supabase
                .from("users")
                .select("is_banned, ban_reason")
                .eq("id", session.user.id)
                .single()

              if (fallbackError) {
                console.error("Error checking ban status (fallback):", fallbackError)
                // Don't show error toast for missing column, just log it
                return
              }

              if (userFallback?.is_banned) {
                toast({
                  title: "Account Suspended",
                  description: "Your account is currently suspended and you cannot register for the season.",
                  variant: "destructive",
                })
                router.push("/")
                return
              }
            } else {
              console.error("Error checking ban status:", error)
              // Don't show error toast for database issues, just log it
              return
            }
          } else if (user?.is_banned) {
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
            router.push("/")
            return
          }
        } catch (error) {
          console.error("Error in checkBanStatus:", error)
          // Don't show error toast, just log it
        }
      }

      checkBanStatus()
    }
  }, [session, supabase, toast, router])

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center"
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Authentication Required</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Please sign in to register for the season.</p>
              <Button 
                onClick={() => router.push("/login")} 
                className="hockey-button w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (loadingActiveSeason || isCheckingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-ice-blue-500/25"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Loading Season</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Fetching season information...</p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-ice-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <CardHeader className="text-center pb-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full flex items-center justify-center shadow-lg shadow-goal-red-500/25"
              >
                <AlertCircle className="h-8 w-8 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold hockey-gradient-text">Season Registration</CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                No Active Season Available
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Alert variant="destructive" className="mb-6 border-2 border-goal-red-200 dark:border-goal-red-700 bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/30 dark:to-goal-red-800/30">
                <AlertCircle className="h-5 w-5 text-goal-red-600" />
                <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">No Active Season</AlertTitle>
                <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                  There is currently no active season available for registration. Please check back later.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button 
                  onClick={() => router.push("/")} 
                  variant="outline"
                  className="hockey-tab-hover border-ice-blue-300 dark:border-ice-blue-600 text-ice-blue-700 dark:text-ice-blue-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Debug Information:</p>
                  <p className="text-slate-600 dark:text-slate-400">{debugInfo || "No debug info available"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (hasRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <CardHeader className="text-center pb-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full flex items-center justify-center shadow-lg shadow-assist-green-500/25"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold hockey-gradient-text">Season Registration</CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                Registration Status for {activeSeason.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Alert variant="destructive" className="mb-6 border-2 border-goal-red-200 dark:border-goal-red-700 bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/30 dark:to-goal-red-800/30">
                <AlertCircle className="h-5 w-5 text-goal-red-600" />
                <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Already Registered</AlertTitle>
                <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
                  You are already signed up for the season. Please contact a League Official if you want to be
                  removed from the season signup or change positions.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button 
                  onClick={() => router.push("/profile")} 
                  className="hockey-button"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Return to Profile
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Questions? Contact us on{" "}
                <a
                  href="https://discord.gg/PnbwXuDf2A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ice-blue-600 dark:text-ice-blue-400 hover:underline font-semibold"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg shadow-ice-blue-500/25">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold hockey-gradient-text mb-4">
              {activeSeason.name} Registration
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join the premier NHL 26 competitive gaming league with advanced stat tracking and professional management
            </p>
          </motion.div>

          {/* Season Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {activeSeason.name} Information
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Important dates and details for the upcoming season
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-ice-blue-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Registration Deadline:</span>
                      <span className="text-slate-600 dark:text-slate-400">June 12, 2025</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-assist-green-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Bidding Period:</span>
                      <span className="text-slate-600 dark:text-slate-400">June 13th 8PM - June 15th 2PM EST</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-goal-red-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Preseason:</span>
                      <span className="text-slate-600 dark:text-slate-400">June 18th-20th</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-ice-blue-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Season Start:</span>
                      <span className="text-slate-600 dark:text-slate-400">June 25th, 2025</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="h-5 w-5 text-rink-blue-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Format:</span>
                      <span className="text-slate-600 dark:text-slate-400">60 regular season games</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-hockey-silver-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Game Days:</span>
                      <span className="text-slate-600 dark:text-slate-400">Wed, Thu, Fri</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-ice-blue-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Game Times:</span>
                      <span className="text-slate-600 dark:text-slate-400">8:30, 9:10, 9:50 PM EST</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-assist-green-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Playoffs:</span>
                      <span className="text-slate-600 dark:text-slate-400">Aug 13th-29th 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      Player Registration
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Complete your registration to join the league
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Gamer Tag Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                        <Gamepad2 className="h-5 w-5 text-white" />
                      </div>
                      <Label htmlFor="gamerTag" className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        Gamer Tag
                      </Label>
                    </div>
                    <Input
                      id="gamerTag"
                      placeholder="Your PSN or Xbox Gamertag"
                      value={gamerTag}
                      onChange={(e) => setGamerTag(e.target.value)}
                      className="hockey-input text-lg py-3"
                    />
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-ice-blue-500" />
                      This must match your gamer tag exactly.
                    </p>
                    {errors.gamerTag && (
                      <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.gamerTag}
                      </p>
                    )}
                  </motion.div>

                  {/* Position Fields */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <Label htmlFor="primaryPosition" className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Primary Position
                        </Label>
                      </div>
                      <Select onValueChange={setPrimaryPosition} value={primaryPosition}>
                        <SelectTrigger id="primaryPosition" className="hockey-input text-lg py-3">
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
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Star className="h-4 w-4 text-assist-green-500" />
                        Your preferred position to play.
                      </p>
                      {errors.primaryPosition && (
                        <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.primaryPosition}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                          <Medal className="h-5 w-5 text-white" />
                        </div>
                        <Label htmlFor="secondaryPosition" className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Secondary Position
                        </Label>
                      </div>
                      <Select onValueChange={setSecondaryPosition} value={secondaryPosition}>
                        <SelectTrigger id="secondaryPosition" className="hockey-input text-lg py-3">
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
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Award className="h-4 w-4 text-hockey-silver-500" />
                        Optional backup position.
                      </p>
                    </div>
                  </motion.div>

                  {/* Console Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                        <Hockey className="h-5 w-5 text-white" />
                      </div>
                      <Label htmlFor="consoleType" className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        Console
                      </Label>
                    </div>
                    <Select onValueChange={setConsoleType} value={consoleType}>
                      <SelectTrigger id="consoleType" className="hockey-input text-lg py-3">
                        <SelectValue placeholder="Select console" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Xbox">Xbox</SelectItem>
                        <SelectItem value="PS5">PS5</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-rink-blue-500" />
                      Your gaming platform.
                    </p>
                    {errors.consoleType && (
                      <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.consoleType}
                      </p>
                    )}
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="pt-4"
                  >
                    <Button 
                      type="submit" 
                      className="hockey-button w-full text-lg py-4" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting Registration...
                        </>
                      ) : (
                        <>
                          <Trophy className="h-5 w-5 mr-2" />
                          Submit Registration
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {process.env.NODE_ENV === "development" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono whitespace-pre-wrap border border-slate-200 dark:border-slate-700"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">Debug Information:</p>
                    <p className="text-slate-600 dark:text-slate-400">{debugInfo || "No debug info available"}</p>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-6">
                <div className="w-full space-y-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <div className="flex items-start gap-2 mb-3">
                      <Shield className="h-5 w-5 text-ice-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        By registering, you agree to abide by the league rules and code of conduct. All registrations are subject
                        to review by league management.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-assist-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Key Requirement:</strong> Players must play a minimum of 3 games per week.
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Users className="h-4 w-4 text-ice-blue-500" />
                    Questions? Contact us on{" "}
                    <a
                      href="https://discord.gg/mghl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ice-blue-600 dark:text-ice-blue-400 hover:underline font-semibold"
                    >
                      Discord
                    </a>
                    .
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
