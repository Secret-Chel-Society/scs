"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Prevent static generation for this page
export const dynamic = "force-dynamic"

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [gamerTag, setGamerTag] = useState("")
  const [discordName, setDiscordName] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("")
  const [console, setConsole] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)
        setError(null)

        // Check if user is authenticated
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(`Authentication error: ${sessionError.message}`)
        }

        if (!session) {
          // Use Next.js router instead of window.location
          router.push("/login")
          return
        }

        setUser(session.user)

        // Fetch user profile
        const { data, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          throw new Error(`Error fetching profile: ${profileError.message}`)
        }

        if (data) {
          setUserProfile(data)
          setGamerTag(data.gamer_tag_id || "")
          setDiscordName(data.discord_name || "")
          setPrimaryPosition(data.primary_position || "")
          setSecondaryPosition(data.secondary_position || "")
          setConsole(data.console || "")
          setAvatarUrl(data.avatar_url || null)
        }
      } catch (err: any) {
        console.error("Account page error:", err)
        setError(err.message || "An error occurred while loading your account")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          gamer_tag_id: gamerTag,
          discord_name: discordName,
          primary_position: primaryPosition,
          secondary_position: secondaryPosition,
          console: console,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        throw new Error(`Error updating settings: ${updateError.message}`)
      }

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

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    setError(null)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase.from("users").update({ avatar_url: newAvatarUrl }).eq("id", user.id)

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`)
      }

      // Update state
      setAvatarUrl(newAvatarUrl)

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
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getInitials = () => {
    if (gamerTag) {
      return gamerTag.substring(0, 2).toUpperCase()
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        )}

        {user && (
          <>
            <Card className="mb-6">
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
                    <Input id="email" value={user?.email || ""} disabled />
                    <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gamerTag">Gamer Tag</Label>
                    <Input
                      id="gamerTag"
                      value={gamerTag}
                      onChange={(e) => setGamerTag(e.target.value)}
                      placeholder="Your gamer tag"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryPosition">Primary Position</Label>
                      <Select value={primaryPosition} onValueChange={setPrimaryPosition} required>
                        <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryPosition">Secondary Position</Label>
                      <Select value={secondaryPosition} onValueChange={setSecondaryPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
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

                  <div className="space-y-2">
                    <Label htmlFor="console">Console</Label>
                    <Select value={console} onValueChange={setConsole} required>
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
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
