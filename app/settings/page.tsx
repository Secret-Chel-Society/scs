"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle,
  Bell,
  User,
  Settings,
  RefreshCw,
  MessageSquare,
  Unlink,
  Shield,
  Star,
  Medal,
  Crown,
  Target,
  Zap,
  Activity,
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  Globe,
  Image,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  Database,
  Users,
  Trophy,
  BarChart3,
  Calendar,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"
import { SessionRefresh } from "@/components/auth/session-refresh"
import { avatarSync } from "@/lib/avatar-sync"
import DiscordConnectButton from "@/components/auth/discord-connect-button"

export default function SettingsPage() {
  const { supabase, session, isLoading: isSessionLoading, refreshSession } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [gamerTag, setGamerTag] = useState("")
  const [discordName, setDiscordName] = useState("")
  const [console, setConsole] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [gameNotifications, setGameNotifications] = useState(true)
  const [newsNotifications, setNewsNotifications] = useState(true)

  const [discordConnection, setDiscordConnection] = useState<any>(null)
  const [isDiscordConnected, setIsDiscordConnected] = useState(false)
  const [isRefreshingDiscord, setIsRefreshingDiscord] = useState(false)

  // Function to refresh Discord connection status
  const refreshDiscordConnection = async () => {
    if (!session?.user) return

    setIsRefreshingDiscord(true)
    try {
      const { data: discordData, error: discordError } = await supabase
        .from("discord_users")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (discordError && discordError.code !== "PGRST116") {
        console.error("Error fetching Discord connection:", discordError)
      } else if (discordData) {
        setDiscordConnection(discordData)
        setIsDiscordConnected(true)
        setDebugInfo(`Discord connection found: ${discordData.discord_username}`)
      } else {
        setDiscordConnection(null)
        setIsDiscordConnected(false)
        setDebugInfo("No Discord connection found")
      }
    } catch (err) {
      console.error("Error refreshing Discord connection:", err)
    } finally {
      setIsRefreshingDiscord(false)
    }
  }

  // Load user profile when session is available
  useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) return

      try {
        setIsLoading(true)
        setError(null)
        setDebugInfo(`Loading profile for user: ${session.user.id}`)

        // Try to get user profile
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          if (profileError.code === "PGRST116") {
            setDebugInfo(`User profile not found, creating new profile for: ${session.user.id}`)
            // User doesn't exist in users table - create one
            const defaultProfile = {
              id: session.user.id,
              email: session.user.email,
              gamer_tag_id: session.user.email?.split("@")[0] || "User",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
              email_notifications: true,
              game_notifications: true,
              news_notifications: true,
            }

            const { data: newProfile, error: insertError } = await supabase
              .from("users")
              .insert(defaultProfile)
              .select()
              .single()

            if (insertError) {
              console.error("Error creating profile:", insertError)
              setError("Error creating user profile. Please try again.")
              setDebugInfo(`Error creating profile: ${insertError.message}`)
              return
            }

            // Use the newly created profile
            setUserProfile(newProfile)
            setGamerTag(newProfile.gamer_tag_id || "")
            setEmailNotifications(true)
            setGameNotifications(true)
            setNewsNotifications(true)
            setDebugInfo(`New profile created successfully for: ${session.user.id}`)
          } else {
            console.error("Profile error:", profileError)
            setError("Error loading profile data")
            setDebugInfo(`Profile error: ${profileError.message}`)
            return
          }
        } else if (profile) {
          // Profile exists - load data
          setDebugInfo(`Profile loaded successfully for: ${session.user.id}`)
          setUserProfile(profile)
          setGamerTag(profile.gamer_tag_id || "")
          setDiscordName(profile.discord_name || "")
          setConsole(profile.console || "")
          setAvatarUrl(profile.avatar_url || null)
          setEmailNotifications(profile.email_notifications !== false)
          setGameNotifications(profile.game_notifications !== false)
          setNewsNotifications(profile.news_notifications !== false)
        }

        // Load Discord connection
        await refreshDiscordConnection()
      } catch (err: any) {
        console.error("Settings load error:", err)
        setError("An error occurred while loading your settings")
        setDebugInfo(`Error loading settings: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      loadUserProfile()
    } else if (!isSessionLoading) {
      setIsLoading(false)
      setDebugInfo("No session found")
    }
  }, [session, supabase, isSessionLoading])

  // Listen for Discord connection updates from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "discord_connection_updated") {
        refreshDiscordConnection()
      }
    }

    const handleDiscordUpdate = () => {
      refreshDiscordConnection()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("discord_connected", handleDiscordUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("discord_connected", handleDiscordUpdate)
    }
  }, [])

  // Check URL parameters for Discord connection status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("discord_connected") === "true") {
      toast({
        title: "Discord Connected",
        description: "Your Discord account has been connected successfully.",
      })
      refreshDiscordConnection()

      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete("discord_connected")
      window.history.replaceState({}, "", url.toString())
    }

    const discordError = params.get("discord_error")
    if (discordError) {
      toast({
        title: "Discord Connection Failed",
        description: `Failed to connect Discord: ${discordError}`,
        variant: "destructive",
      })

      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete("discord_error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [toast])

  const handleSignIn = () => {
    window.location.href = "/login?redirect=/settings"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          gamer_tag_id: gamerTag,
          discord_name: discordName,
          console: console,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      if (updateError) {
        throw new Error(`Error updating settings: ${updateError.message}`)
      }

      setSuccess("Your profile settings have been updated successfully")
      toast({
        title: "Settings updated",
        description: "Your profile settings have been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setError(err.message || "An error occurred while saving your settings")
      toast({
        title: "Error updating settings",
        description: err.message || "An error occurred while saving your settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationPreferences = async () => {
    if (!session?.user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email_notifications: emailNotifications,
          game_notifications: gameNotifications,
          news_notifications: newsNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      if (updateError) {
        throw new Error(`Error updating notification preferences: ${updateError.message}`)
      }

      setSuccess("Your notification preferences have been updated successfully")
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error saving notification preferences:", err)
      setError(err.message || "An error occurred while saving your notification preferences")
      toast({
        title: "Error updating preferences",
        description: err.message || "An error occurred while saving your notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user) return

    setIsUploading(true)
    setError(null)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        setError(`Error uploading file: ${uploadError.message}`)
        toast({
          title: "Error uploading avatar",
          description: uploadError.message,
          variant: "destructive",
        })
        return
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        setError(`Error updating profile: ${updateError.message}`)
        toast({
          title: "Error updating profile",
          description: updateError.message,
          variant: "destructive",
        })
        return
      }

      // Update local state
      setAvatarUrl(newAvatarUrl)

      // Notify all components about the avatar update
      avatarSync.notifyAvatarUpdate(newAvatarUrl)

      // Dispatch custom event for cross-tab communication
      window.dispatchEvent(
        new CustomEvent("avatarUpdated", {
          detail: { userId: session.user.id, avatarUrl: newAvatarUrl },
        }),
      )

      // Store in localStorage for cross-tab sync
      localStorage.setItem("avatar_updated", Date.now().toString())

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error uploading avatar:", err)
      setError(err.message || "An error occurred while uploading your profile picture")
      toast({
        title: "Error updating avatar",
        description: err.message || "An error occurred while uploading your profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDiscordDisconnect = async () => {
    if (!session?.user) return

    setIsSaving(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase.from("discord_users").delete().eq("user_id", session.user.id)

      if (deleteError) {
        throw new Error(`Error disconnecting Discord: ${deleteError.message}`)
      }

      setDiscordConnection(null)
      setIsDiscordConnected(false)

      // Notify other tabs/windows about the disconnection
      localStorage.setItem("discord_connection_updated", Date.now().toString())
      window.dispatchEvent(new CustomEvent("discord_disconnected"))

      toast({
        title: "Discord disconnected",
        description: "Your Discord account has been disconnected successfully.",
      })
    } catch (err: any) {
      console.error("Error disconnecting Discord:", err)
      setError(err.message || "An error occurred while disconnecting Discord")
      toast({
        title: "Error disconnecting Discord",
        description: err.message || "An error occurred while disconnecting Discord",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = () => {
    if (gamerTag) {
      return gamerTag.substring(0, 2).toUpperCase()
    }
    return session?.user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  // Loading state
  if (isSessionLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // Not authenticated state
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>You need to be signed in to access your account settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>Please sign in to view your settings.</AlertDescription>
              </Alert>
              <p className="text-muted-foreground mb-4">
                Please sign in to view and manage your account settings, profile information, and notification
                preferences.
              </p>
              {debugInfo && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-xs font-mono">{debugInfo}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignIn}>Sign In</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Main settings interface
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
              Account Settings
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Manage your profile, preferences, and account settings.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Settings Center
                </h2>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                  Customize your account and preferences
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refreshSession} className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Session
            </Button>
          </div>

        <SessionRefresh />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-2 border-ice-blue-200 dark:border-ice-blue-700 p-2">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-ice-blue-200/50 dark:hover:bg-ice-blue-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="discord"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rink-blue-500 data-[state=active]:to-ice-blue-600 data-[state=active]:text-white hover:bg-rink-blue-200/50 dark:hover:bg-rink-blue-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Discord
            </TabsTrigger>
            <TabsTrigger 
              value="account"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white hover:bg-assist-green-200/50 dark:hover:bg-assist-green-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white hover:bg-goal-red-200/50 dark:hover:bg-goal-red-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8">
            <div className="grid gap-8">
              <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                        Profile Picture
                      </CardTitle>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                        Upload a profile picture to personalize your account
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 flex flex-col items-center">
                  <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                    <Avatar className="h-32 w-32 border-4 border-ice-blue-200 dark:border-ice-blue-700 shadow-lg">
                      <AvatarImage src={avatarUrl || "/placeholder.svg?height=128&width=128"} alt={gamerTag || "User"} />
                      <AvatarFallback className="text-3xl bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-500/80 to-rink-blue-600/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      ) : (
                        <Camera className="h-10 w-10 text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mt-4 text-center">
                    Click on the avatar to upload a new profile picture
                  </p>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit}>
                <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                          Profile Information
                        </CardTitle>
                        <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                          Update your account profile information
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        Email
                      </Label>
                      <Input 
                        id="email" 
                        value={session?.user?.email || ""} 
                        disabled 
                        className="hockey-search"
                      />
                      <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">Your email cannot be changed</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gamerTag" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        Username / Gamer Tag
                      </Label>
                      <Input
                        id="gamerTag"
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        placeholder="Your username or gamer tag"
                        required
                        className="hockey-search"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="discordName" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        Discord Name
                      </Label>
                      <Input
                        id="discordName"
                        value={discordName}
                        onChange={(e) => setDiscordName(e.target.value)}
                        placeholder="Your Discord username"
                        className="hockey-search"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="console" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">
                        Console
                      </Label>
                      <Select value={console} onValueChange={setConsole}>
                        <SelectTrigger className="hockey-search">
                          <SelectValue placeholder="Select console" />
                        </SelectTrigger>
                        <SelectContent className="hockey-card">
                          <SelectItem value="Xbox" className="hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/30">Xbox</SelectItem>
                          <SelectItem value="PS5" className="hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/30">PS5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="hockey-button hover:scale-105 transition-all duration-200"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="discord" className="space-y-8">
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-assist-green-50 to-goal-red-50 dark:from-assist-green-900/30 dark:to-goal-red-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                        Discord Integration
                      </CardTitle>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                        Connect your Discord account to automatically receive the "Registered" role in the SCS Discord server
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDiscordConnection}
                    disabled={isRefreshingDiscord}
                    className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshingDiscord ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {isDiscordConnected && discordConnection ? (
                  <div className="space-y-6">
                    <div className="hockey-alert-success p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-assist-green-800 dark:text-assist-green-200 text-lg">Discord Connected</p>
                          <p className="text-assist-green-600 dark:text-assist-green-400">
                            Connected as {discordConnection.discord_username}#{discordConnection.discord_discriminator}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Discord Username</Label>
                        <Input
                          value={`${discordConnection.discord_username}#${discordConnection.discord_discriminator}`}
                          disabled
                          className="hockey-search"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Discord ID</Label>
                        <Input value={discordConnection.discord_id} disabled className="hockey-search font-mono text-xs" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Connected On</Label>
                      <Input value={new Date(discordConnection.created_at).toLocaleString()} disabled className="hockey-search" />
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        variant="destructive"
                        onClick={handleDiscordDisconnect}
                        disabled={isSaving}
                        className="hockey-button-danger hover:scale-105 transition-all duration-200 flex items-center gap-2 w-full"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <Unlink className="h-4 w-4" />
                            Disconnect Discord
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500 text-center">
                        You can connect a different Discord account after disconnecting
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="hockey-alert p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-3 text-lg">Why Connect Discord?</h4>
                          <ul className="text-ice-blue-600 dark:text-ice-blue-400 space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full"></div>
                              Automatically receive the "Registered" role in SCS Discord
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full"></div>
                              Get team-specific roles when you join a team
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full"></div>
                              Access to team management channels if you're a GM/AGM
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full"></div>
                              Stay updated with league announcements
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <DiscordConnectButton
                        userId={session?.user?.id || ""}
                        source="settings"
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-8">
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Account Information
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      View and manage your account details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">User ID</Label>
                  <div className="flex gap-3">
                    <Input 
                      value={session?.user?.id || ""} 
                      disabled 
                      className="hockey-search font-mono text-xs flex-1" 
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(session?.user?.id || "")
                        toast({
                          title: "Copied",
                          description: "User ID copied to clipboard",
                        })
                      }}
                      className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Account Created</Label>
                    <Input
                      value={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleString() : "Unknown"}
                      disabled
                      className="hockey-search"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Last Updated</Label>
                    <Input
                      value={userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleString() : "Unknown"}
                      disabled
                      className="hockey-search"
                    />
                  </div>
                </div>

                {debugInfo && (
                  <div className="mt-6 p-4 hockey-alert">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Database className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-2">Debug Information</h4>
                        <p className="text-xs font-mono text-ice-blue-600 dark:text-ice-blue-400 break-all">{debugInfo}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-8">
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      Email Notifications
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      Manage your email notification preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 hockey-alert hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="emailNotifications" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold text-lg">
                          Email Notifications
                        </Label>
                      </div>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 ml-11">
                        Receive email notifications from SCS
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 hockey-alert hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="gameNotifications" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold text-lg">
                          Game Notifications
                        </Label>
                      </div>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 ml-11">
                        Receive notifications about upcoming games and match results
                      </p>
                    </div>
                    <Switch
                      id="gameNotifications"
                      checked={gameNotifications}
                      onCheckedChange={setGameNotifications}
                      disabled={!emailNotifications}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-assist-green-500 data-[state=checked]:to-goal-red-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 hockey-alert hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="newsNotifications" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-semibold text-lg">
                          News & Announcements
                        </Label>
                      </div>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400 ml-11">
                        Receive notifications about league news and announcements
                      </p>
                    </div>
                    <Switch
                      id="newsNotifications"
                      checked={newsNotifications}
                      onCheckedChange={setNewsNotifications}
                      disabled={!emailNotifications}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-goal-red-500 data-[state=checked]:to-assist-green-600"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  onClick={handleNotificationPreferences} 
                  disabled={isSaving}
                  className="hockey-button hover:scale-105 transition-all duration-200"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
