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
import { AlertCircle, Loader2, Trophy, Medal, Target, Zap, Shield, Database, Activity, TrendingUp, Users, Settings, BarChart3, Clock, Calendar, FileText, BookOpen, Globe, Publish, AlertTriangle, CheckCircle, Edit, Save, Award, Crown, Gamepad2, Play, Pause, Stop, Eye, EyeOff, Filter, Search, Download, Upload, Info, LogIn, User, Lock, Mail, Key, ArrowRight, ArrowLeft, UserPlus, GamepadIcon, ShieldCheck, Bot, MessageSquare, UserCheck, CalendarCheck, GamepadIcon as Gamepad, Star, Medal as MedalIcon, Crown as CrownIcon, Award as AwardIcon, Trophy as TrophyIcon } from "lucide-react"

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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center">
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden w-full max-w-md">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Loading season information...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center">
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden w-full max-w-md">
              <CardHeader className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">Season Registration</CardTitle>
                    <CardDescription className="text-ice-blue-100">
                      No active season available
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-600 text-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">No Active Season</h3>
                        <p className="text-goal-red-100 text-xs">
                          There is currently no active season available for registration. Please check back later.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 p-4 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded text-xs font-mono whitespace-pre-wrap">
                    <p className="font-bold">Debug Information:</p>
                    {debugInfo || "No debug info available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (hasRegistered) {
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
                Season Registration Status
              </h1>
              <p className="hockey-subtitle mx-auto mb-12 max-w-2xl">
                Your registration status for {activeSeason.name}. You're already registered for this season.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden w-full max-w-2xl">
                <CardHeader className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Already Registered</CardTitle>
                      <CardDescription className="text-ice-blue-100">
                        Your registration status for {activeSeason.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-goal-red-500 to-assist-green-600 text-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Already Registered</h3>
                          <p className="text-goal-red-100 text-xs">
                            Error: User is already signed up for the season. Please contact a League Official if you want to be removed from the season signup or change positions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={() => router.push("/profile")} 
                      className="btn-championship hover:scale-105 transition-all duration-200"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Return to Profile
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t pt-6 p-6">
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Questions? Contact us on{" "}
                    <a
                      href="https://discord.gg/PnbwXuDf2A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 font-medium hover:underline transition-colors duration-200"
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
      </div>
    )
  }

  return (
    <>
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
              {activeSeason.name} Registration
            </h1>
            <p className="hockey-subtitle mx-auto mb-12 max-w-2xl">
              Register to participate in the Secret Chel Society season. Join the premier hockey gaming community and compete for the championship.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden w-full max-w-4xl">
              <CardHeader className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CalendarCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">{activeSeason.name} Registration</CardTitle>
                    <CardDescription className="text-ice-blue-100">
                      Register to participate for Season 1 of the Secret Chel Society
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="hockey-card border-2 border-assist-green-200 dark:border-assist-green-700 overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-assist-green-500 to-goal-red-600 text-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{activeSeason.name} Information</h3>
                        <p className="text-assist-green-100 text-xs">
                          Important dates and details for the upcoming season
                        </p>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-assist-green-100">
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
                </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="gamerTag" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-assist-green-600" />
                  Gamer Tag
                </Label>
                <Input
                  id="gamerTag"
                  placeholder="Your PSN or Xbox Gamertag"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">This must match your gamer tag exactly.</p>
                {errors.gamerTag && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.gamerTag}
                </p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="primaryPosition" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-goal-red-600" />
                    Primary Position
                  </Label>
                  <Select onValueChange={setPrimaryPosition} value={primaryPosition}>
                    <SelectTrigger id="primaryPosition" className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
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
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Your preferred position to play.</p>
                  {errors.primaryPosition && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.primaryPosition}
                  </p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="secondaryPosition" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-hockey-silver-600" />
                    Secondary Position
                  </Label>
                  <Select onValueChange={setSecondaryPosition} value={secondaryPosition}>
                    <SelectTrigger id="secondaryPosition" className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
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
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Optional backup position.</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="consoleType" className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-rink-blue-600" />
                  Console
                </Label>
                <Select onValueChange={setConsoleType} value={consoleType}>
                  <SelectTrigger id="consoleType" className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Select console" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="PS5">PS5</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Your gaming platform.</p>
                {errors.consoleType && <p className="text-sm text-goal-red-600 dark:text-goal-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.consoleType}
                </p>}
              </div>

              <Button 
                type="submit" 
                className="w-full btn-championship hover:scale-105 transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </form>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded text-xs font-mono whitespace-pre-wrap">
                <p className="font-bold">Debug Information:</p>
                {debugInfo || "No debug info available"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6 p-6">
            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
              By registering, you agree to abide by the league rules and code of conduct. All registrations are subject
              to review by league management. Key Requirement for the season: -Players must play 3 games a min of 3
              games a week.
            </div>
            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
              Questions? Contact us on{" "}
              <a
                href="https://discord.gg/scs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ice-blue-600 hover:text-ice-blue-700 dark:text-ice-blue-400 dark:hover:text-ice-blue-300 font-medium hover:underline transition-colors duration-200"
              >
                Discord
              </a>
              .
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      </div>
    </>
  )
}
