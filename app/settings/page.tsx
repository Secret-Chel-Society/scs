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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <Button variant="outline" size="sm" onClick={refreshSession} className="flex items-center gap-2">
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
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="discord" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discord
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload a profile picture to personalize your account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || "/placeholder.svg?height=96&width=96"} alt={gamerTag || "User"} />
                      <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Camera className="h-8 w-8 text-white" />
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Click on the avatar to upload a new profile picture
                  </p>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your account profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={session?.user?.email || ""} disabled />
                      <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gamerTag">Username / Gamer Tag</Label>
                      <Input
                        id="gamerTag"
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        placeholder="Your username or gamer tag"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordName">Discord Name</Label>
                      <Input
                        id="discordName"
                        value={discordName}
                        onChange={(e) => setDiscordName(e.target.value)}
                        placeholder="Your Discord username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="console">Console</Label>
                      <Select value={console} onValueChange={setConsole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select console" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Xbox">Xbox</SelectItem>
                          <SelectItem value="PS5">PS5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSaving}>
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

          <TabsContent value="discord">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Discord Integration</CardTitle>
                    <CardDescription>
                      Connect your Discord account to automatically receive the "Registered" role in the MGHL Discord
                      server
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDiscordConnection}
                    disabled={isRefreshingDiscord}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshingDiscord ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isDiscordConnected && discordConnection ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800 dark:text-green-200">Discord Connected</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Connected as {discordConnection.discord_username}#{discordConnection.discord_discriminator}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Discord Username</Label>
                      <Input
                        value={`${discordConnection.discord_username}#${discordConnection.discord_discriminator}`}
                        disabled
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discord ID</Label>
                      <Input value={discordConnection.discord_id} disabled className="font-mono text-xs" />
                    </div>

                    <div className="space-y-2">
                      <Label>Connected On</Label>
                      <Input value={new Date(discordConnection.created_at).toLocaleString()} disabled />
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button
                        variant="destructive"
                        onClick={handleDiscordDisconnect}
                        disabled={isSaving}
                        className="flex items-center gap-2 w-full"
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
                      <p className="text-sm text-muted-foreground text-center">
                        You can connect a different Discord account after disconnecting
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Why Connect Discord?</h4>
                      <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Automatically receive the "Registered" role in MGHL Discord</li>
                        <li>• Get team-specific roles when you join a team</li>
                        <li>• Access to team management channels if you're a GM/AGM</li>
                        <li>• Stay updated with league announcements</li>
                      </ul>
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

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>View and manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <div className="flex">
                    <Input value={session?.user?.id || ""} disabled className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(session?.user?.id || "")
                        toast({
                          title: "Copied",
                          description: "User ID copied to clipboard",
                        })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input
                    value={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleString() : "Unknown"}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <Input
                    value={userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleString() : "Unknown"}
                    disabled
                  />
                </div>

                {debugInfo && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="text-xs font-mono">{debugInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Manage your email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications from MGHL</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="gameNotifications">Game Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about upcoming games and match results
                    </p>
                  </div>
                  <Switch
                    id="gameNotifications"
                    checked={gameNotifications}
                    onCheckedChange={setGameNotifications}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsNotifications">News & Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about league news and announcements
                    </p>
                  </div>
                  <Switch
                    id="newsNotifications"
                    checked={newsNotifications}
                    onCheckedChange={setNewsNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNotificationPreferences} disabled={isSaving}>
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
  )
}
