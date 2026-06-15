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
import { AlertCircle, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const GAME_DAYS = ["wednesday", "thursday", "friday"] as const
const TIME_SLOTS = ["8:40 PM EST", "9:20 PM EST", "10:00 PM EST"] as const

// ✅ Force this page to always use Season 4
const TARGET_SEASON_NUMBER = 4

type GameDay = (typeof GAME_DAYS)[number]
type TimeSlot = (typeof TIME_SLOTS)[number]
type Availability = Record<GameDay, TimeSlot[]>

export default function SeasonRegistrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, session } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [activeSeason, setActiveSeason] = useState<{
    id: string
    name: string
    season_number?: number
    parent_season_id?: string
  } | null>(null)
  const [loadingActiveSeason, setLoadingActiveSeason] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Form state
  const [gamerTag, setGamerTag] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("none")
  const [consoleType, setConsoleType] = useState("")
  const [availability, setAvailability] = useState<Availability>({
    wednesday: [],
    thursday: [],
    friday: [],
  })

  // Form validation
  const [errors, setErrors] = useState<{
    gamerTag?: string
    primaryPosition?: string
    secondaryPosition?: string
    consoleType?: string
    availability?: string
  }>({})

  const toggleTimeSlot = (day: GameDay, slot: TimeSlot) => {
    setAvailability((prev) => {
      const daySlots = prev[day]
      if (daySlots.includes(slot)) {
        return { ...prev, [day]: daySlots.filter((s) => s !== slot) }
      } else {
        return { ...prev, [day]: [...daySlots, slot] }
      }
    })
  }

  const isSlotSelected = (day: GameDay, slot: TimeSlot) => {
    return availability[day].includes(slot)
  }

  const getTotalSelectedSlots = () => {
    return GAME_DAYS.reduce((total, day) => total + availability[day].length, 0)
  }

  // ✅ Fetch Season #4 directly (no is_active logic)
  const fetchActiveSeason = async () => {
    try {
      setLoadingActiveSeason(true)

      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, name, season_number, parent_season_id")
        .eq("season_number", TARGET_SEASON_NUMBER)
        .limit(1)
        .maybeSingle()

      if (seasonError) {
        window.console.error("Error fetching season:", seasonError)
        setDebugInfo((prev) => prev + `\nError fetching season ${TARGET_SEASON_NUMBER}: ${seasonError.message}`)
        setLoadingActiveSeason(false)
        return null
      }

      if (!seasonData) {
        setDebugInfo((prev) => prev + `\nNo season found for season_number=${TARGET_SEASON_NUMBER}`)
        setLoadingActiveSeason(false)
        return null
      }

      setDebugInfo((prev) => prev + `\nUsing forced season ${TARGET_SEASON_NUMBER}: ${JSON.stringify(seasonData)}`)
      setLoadingActiveSeason(false)
      return seasonData
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

    const fetchActiveSeasonData = async () => {
      setLoadingActiveSeason(true)
      try {
        const seasonData = await fetchActiveSeason()

        if (!seasonData) {
          setDebugInfo((prev) => prev + `\nSeason ${TARGET_SEASON_NUMBER} not available`)
          toast({
            title: "Season not available",
            description: `Season ${TARGET_SEASON_NUMBER} is not available for registration.`,
            variant: "destructive",
          })
          setLoadingActiveSeason(false)
          return
        }

        setActiveSeason(seasonData)
        setDebugInfo((prev) => prev + `\nSeason set to: ${JSON.stringify(seasonData)}`)
        setLoadingActiveSeason(false)

        // Check if user has already registered for this season or parent season
        checkRegistration(seasonData.id)
      } catch (error) {
        window.console.error("Error in fetchActiveSeasonData:", error)
        setDebugInfo((prev) => prev + `\nUnhandled error: ${JSON.stringify(error)}`)
        setLoadingActiveSeason(false)
      }
    }

    fetchActiveSeasonData()
  }, [session, router, toast, supabase])

  // Check if user has already registered for the current season or parent season
  const checkRegistration = async (seasonId: string) => {
    if (!session?.user) return

    setIsCheckingRegistration(true)
    try {
      const { data: currentSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id, name, parent_season_id")
        .eq("id", seasonId)
        .single()

      if (seasonError) {
        console.error("Error fetching season details:", seasonError)
        setDebugInfo((prev) => prev + `\nSeason details error: ${seasonError.message}`)
        setIsCheckingRegistration(false)
        return
      }

      setDebugInfo((prev) => prev + `\nCurrent season details: ${JSON.stringify(currentSeason)}`)

      const { data: currentSeasonReg, error: currentRegError } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_id", seasonId)
        .single()

      if (currentRegError && currentRegError.code !== "PGRST116") {
        console.error("Error checking current season registration:", currentRegError)
        setDebugInfo((prev) => prev + `\nCurrent season registration check error: ${currentRegError.message}`)
      }

      let parentSeasonReg = null
      if (currentSeason.parent_season_id) {
        setDebugInfo((prev) => prev + `\nChecking parent season registration for: ${currentSeason.parent_season_id}`)

        const { data: parentReg, error: parentRegError } = await supabase
          .from("season_registrations")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("season_id", currentSeason.parent_season_id)
          .single()

        if (parentRegError && parentRegError.code !== "PGRST116") {
          console.error("Error checking parent season registration:", parentRegError)
          setDebugInfo((prev) => prev + `\nParent season registration check error: ${parentRegError.message}`)
        }

        parentSeasonReg = parentReg
        setDebugInfo((prev) => prev + `\nParent season registration found: ${!!parentReg}`)
      }

      const hasRegisteredForSeason = !!(currentSeasonReg || parentSeasonReg)
      setHasRegistered(hasRegisteredForSeason)
      setDebugInfo((prev) => prev + `\nHas registered (current or parent): ${hasRegisteredForSeason}`)
    } catch (error) {
      console.error("Error checking registration:", error)
      setDebugInfo((prev) => prev + `\nRegistration check exception: ${JSON.stringify(error)}`)
    } finally {
      setIsCheckingRegistration(false)
    }
  }

  const validateForm = () => {
    const newErrors: {
      gamerTag?: string
      primaryPosition?: string
      secondaryPosition?: string
      consoleType?: string
      availability?: string
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

    if (getTotalSelectedSlots() === 0) {
      newErrors.availability = "Please select at least one available time slot."
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
      const { data: currentSeasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, name, season_number, parent_season_id")
        .eq("id", activeSeason.id)
        .single()

      if (seasonError) {
        throw new Error("Failed to fetch season details")
      }

      // Check current season registration
      const { data: existingReg } = await supabase
        .from("season_registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("season_id", activeSeason.id)
        .single()

      // Check parent season registration if this is a playoff season
      let parentSeasonReg = null
      if (currentSeasonData.parent_season_id) {
        const { data: parentReg } = await supabase
          .from("season_registrations")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("season_id", currentSeasonData.parent_season_id)
          .single()

        parentSeasonReg = parentReg
      }

      if (existingReg || parentSeasonReg) {
        setHasRegistered(true)
        const errorMessage = parentSeasonReg
          ? "You are already registered for the parent season of this playoff season. Playoff seasons use the same registrations as their parent season."
          : "You are already signed up for this season. Please contact a League Official if you want to be removed from the season signup or change positions."

        toast({
          title: "Already Registered",
          description: errorMessage,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // ✅ Force season_number=4 on the registration row too
      const registrationData = {
        user_id: session.user.id,
        season_id: activeSeason.id,
        season_number: TARGET_SEASON_NUMBER,
        primary_position: primaryPosition,
        secondary_position: secondaryPosition === "none" ? null : secondaryPosition,
        gamer_tag: gamerTag,
        console: consoleType,
        status: "Pending",
        availability: availability,
      }

      setDebugInfo((prev) => prev + `\nSubmitting registration: ${JSON.stringify(registrationData)}`)

      const { error } = await supabase.from("season_registrations").insert(registrationData)

      if (error) {
        setDebugInfo((prev) => prev + `\nRegistration error: ${error.message}`)

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
          .select("is_banned, ban_reason, ban_expiration")
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
          const isTemporaryBan = user.ban_expiration && new Date(user.ban_expiration) > new Date()

          toast({
            title: "Account Suspended",
            description: `Your account is currently suspended and you cannot register for the season. ${
              isTemporaryBan
                ? `Suspension expires: ${new Date(user.ban_expiration).toLocaleDateString()}`
                : "This is a permanent suspension."
            }`,
            variant: "destructive",
          })
          router.push("/")
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
              <AlertTitle>No Season Found</AlertTitle>
              <AlertDescription>
                Season {TARGET_SEASON_NUMBER} could not be found. Please check back later or contact staff.
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
            <CardDescription>Register to participate in {activeSeason.name} of Secret Chel Society</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">{activeSeason.name} Information</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>SCS S4 Signups end June 14th</li>
                <li>SCS S4 Draft Lottery June 15th</li>
                <li>SCS S4 Draft Day June 17th</li>
                <li>SCS S4 Reg Season Begins June 23rd</li>
                <li>Trades and waivers open June 26th</li>
                <li>No Games June 30th-July 2nd Due to Holidays</li>
                <li>Trade Deadline Aug 4th 2026</li>
                <li> Roster Lock August 10th 2026</li>
                <li> Regular Season Ends Aug 13th 2026</li>
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
                  <p className="text-sm text-muted-foreground">Secondary Position (Soft Pos Lock)</p>
                  {errors.secondaryPosition && <p className="text-sm text-destructive">{errors.secondaryPosition}</p>}
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

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Availability</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the time slots you are available to play. Games are scheduled on Wednesday, Thursday, and
                    Friday nights.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {GAME_DAYS.map((day) => (
                    <div key={day} className="space-y-2">
                      <h4 className="font-medium capitalize text-sm">{day}</h4>
                      <div className="space-y-2">
                        {TIME_SLOTS.map((slot) => {
                          const selected = isSlotSelected(day, slot)
                          return (
                            <button
                              key={`${day}-${slot}`}
                              type="button"
                              onClick={() => toggleTimeSlot(day, slot)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted border-input",
                              )}
                            >
                              <span>{slot}</span>
                              {selected && <Check className="h-4 w-4" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {getTotalSelectedSlots()} time slot{getTotalSelectedSlots() !== 1 ? "s" : ""} selected
                  </span>
                  {getTotalSelectedSlots() > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvailability({ wednesday: [], thursday: [], friday: [] })}
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {errors.availability && <p className="text-sm text-destructive">{errors.availability}</p>}
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
              to review by league management.
            </div>
            <div className="text-sm">
              Questions? Contact us on{" "}
              <a
                href="https://discord.gg/vzKJpeq5GS"
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
