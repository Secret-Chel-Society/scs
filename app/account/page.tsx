"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, AlertTriangle } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type UserProfile = Database['public']['Tables']['users']['Row']
type Position = NonNullable<UserProfile['primary_position']> | ''
type ConsoleType = NonNullable<UserProfile['console']> | ''

// Prevent static generation for this page
export const dynamic = "force-dynamic"

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state with proper types
  const [gamerTag, setGamerTag] = useState("")
  const [discordName, setDiscordName] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState<Position>("")
  const [secondaryPosition, setSecondaryPosition] = useState<Position>("")
  const [consoleType, setConsoleType] = useState<ConsoleType>("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(`Authentication error: ${sessionError.message}`)
        }

        if (!session) {
          router.push("/login")
          return
        }

        setUser(session.user)

        // Fetch user profile with type safety
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) throw profileError
        if (!data) throw new Error('No user profile found')

        // Update form state with user data
        setUserProfile(data as UserProfile)
        setGamerTag(data.gamer_tag_id || '')
        setDiscordName(data.discord_name || '')
        setPrimaryPosition((data.primary_position as Position) || '')
        setSecondaryPosition((data.secondary_position as Position) || '')
        setConsoleType((data.console as ConsoleType) || '')
        setAvatarUrl(data.avatar_url)
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
        throw new Error("You must be logged in to update your profile")
      }

      const updates: Partial<Database['public']['Tables']['users']['Update']> = {
        gamer_tag_id: gamerTag || null,
        discord_name: discordName || null,
        primary_position: primaryPosition || null,
        secondary_position: secondaryPosition || null,
        console: consoleType || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null)

      toast({
        title: "Success",
        description: "Your profile has been updated successfully!",
        variant: "success",
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const handleError = (message: string) => {
        setError(message)
        toast({
          title: "Error",
          description: message,
          variant: "error",
        })
      }
      handleError(error.message)
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
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 max-w-full mb-8" />
          
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            
            <div className="pt-4">
              <Skeleton className="h-10 w-32 ml-auto" />
            </div>
          </div>
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
                <AlertTriangle className="h-5 w-5" />
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
                    <AvatarImage 
                      src={avatarUrl || "/default-avatar.svg"} 
                      alt={gamerTag || "User"} 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-gray-200">
                      {getInitials()}
                    </AvatarFallback>
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
                      <Select
                        value={primaryPosition}
                        onValueChange={value => setPrimaryPosition(value as Position)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary position" />
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
                      <Select
                        value={secondaryPosition}
                        onValueChange={value => setSecondaryPosition(value as Position)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select secondary position (optional)" />
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
                    <Select
                      value={consoleType}
                      onValueChange={value => setConsoleType(value as ConsoleType)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your console" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ps5">PS5</SelectItem>
                        <SelectItem value="xbox">Xbox</SelectItem>
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
