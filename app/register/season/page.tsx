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
      console.log("Fetching seasons...")

      // Get all seasons - no .single() calls
      const { data: seasons, error } = await supabase
        .from("seasons")
        .select("id, name, season_number, is_active")
        .order("created_at")

      if (error) {
        console.error("Error fetching seasons:", error)
        setLoadingActiveSeason(false)
        return null
      }

      if (!seasons || seasons.length === 0) {
        console.error("No seasons found")
        setLoadingActiveSeason(false)
        return null
      }

      // Find active season or use first one
      const season = seasons.find(s => s.is_active) || seasons[0]
      console.log("Using season:", season)

      setActiveSeason({
        id: season.id,
        name: season.name,
        season_number: season.season_number
      })

      setLoadingActiveSeason(false)
      return season
    } catch (error) {
      console.error("Error in fetchActiveSeason:", error)
      setLoadingActiveSeason(false)
      return null
    }
  }

  // Simplified registration check
  const checkRegistration = async (seasonNumber: number) => {
    if (!session?.user) return

    try {
      setIsCheckingRegistration(true)
      const { data } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_number", seasonNumber)
        .maybeSingle()

      setHasRegistered(!!data)
    } catch (error) {
      console.error("Error checking registration:", error)
      setHasRegistered(false)
    } finally {
      setIsCheckingRegistration(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for the season.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    const loadData = async () => {
      const season = await fetchActiveSeason()
      if (season) {
        await checkRegistration(season.season_number || 1)
      }
    }

    loadData()
  }, [session, router, toast, supabase])

  // Form validation
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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!session?.user || !activeSeason) return

    setIsLoading(true)

    try {
      // Check if already registered
      const { data: existingReg } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_number", activeSeason.season_number || 1)
        .maybeSingle()

      if (existingReg) {
        setHasRegistered(true)
        toast({
          title: "Already Registered",
          description: "You are already registered for this season.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Submit registration
      const { error } = await supabase.from("season_registrations").insert({
        user_id: session.user.id,
        season_id: activeSeason.id,
        season_number: activeSeason.season_number || 1,
        primary_position: primaryPosition,
        secondary_position: secondaryPosition === "none" ? null : secondaryPosition,
        gamer_tag: gamerTag,
        console: consoleType,
        status: "Pending",
      })

      if (error) {
        throw error
      }

      toast({
        title: "Registration successful!",
        description: `Your registration for ${activeSeason.name} has been submitted.`,
      })

      router.push("/profile")
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (loadingActiveSeason || isCheckingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-ice-blue-500 mx-auto mb-4" />
            <p className="text-center">Loading season information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No session
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            <Shield className="h-8 w-8 text-ice-blue-500 mx-auto mb-4" />
            <p className="text-center">Please sign in to register for the season.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No active season
  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-8 w-8 text-goal-red-500 mx-auto mb-4" />
            <p className="text-center">No active season available for registration.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already registered
  if (hasRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-assist-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Already Registered</h2>
            <p className="text-center mb-4">You are already registered for {activeSeason.name}.</p>
            <Button onClick={() => router.push("/profile")} className="hockey-button">
              Return to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main registration form
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
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg shadow-ice-blue-500/25">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold hockey-gradient-text mb-4">
              {activeSeason.name} Registration
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join the premier NHL 26 competitive gaming league
            </p>
          </div>

          {/* Registration Form */}
          <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Player Registration
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Complete your registration to join the league
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Gamer Tag */}
                <div className="space-y-2">
                  <Label htmlFor="gamerTag" className="text-lg font-semibold">Gamer Tag</Label>
                  <Input
                    id="gamerTag"
                    placeholder="Your PSN or Xbox Gamertag"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    className="hockey-input text-lg py-3"
                  />
                  {errors.gamerTag && <p className="text-sm text-goal-red-600">{errors.gamerTag}</p>}
                </div>

                {/* Positions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPosition" className="text-lg font-semibold">Primary Position</Label>
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
                    {errors.primaryPosition && <p className="text-sm text-goal-red-600">{errors.primaryPosition}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryPosition" className="text-lg font-semibold">Secondary Position</Label>
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
                  </div>
                </div>

                {/* Console */}
                <div className="space-y-2">
                  <Label htmlFor="consoleType" className="text-lg font-semibold">Console</Label>
                  <Select onValueChange={setConsoleType} value={consoleType}>
                    <SelectTrigger id="consoleType" className="hockey-input text-lg py-3">
                      <SelectValue placeholder="Select console" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Xbox">Xbox</SelectItem>
                      <SelectItem value="PS5">PS5</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.consoleType && <p className="text-sm text-goal-red-600">{errors.consoleType}</p>}
                </div>

                {/* Submit Button */}
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
              </form>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                By registering, you agree to abide by the league rules and code of conduct.
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}