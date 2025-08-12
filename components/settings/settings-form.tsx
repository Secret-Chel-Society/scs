"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"

export default function SettingsForm({ initialData, user }: { initialData: any; user: any }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [gamerTag, setGamerTag] = useState(initialData.gamer_tag_id || "")
  const [discordName, setDiscordName] = useState(initialData.discord_name || "")
  const [primaryPosition, setPrimaryPosition] = useState(initialData.primary_position || "")
  const [secondaryPosition, setSecondaryPosition] = useState(initialData.secondary_position || "")
  const [console, setConsole] = useState(initialData.console || "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar_url || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
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

      if (error) throw error

      toast({
        title: "Settings updated",
        description: "Your profile settings have been updated successfully.",
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error: any) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error updating settings",
        description: error.message,
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

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase.from("users").update({ avatar_url: newAvatarUrl }).eq("id", user.id)

      if (updateError) throw updateError

      // Update state
      setAvatarUrl(newAvatarUrl)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })

      // Refresh the page to show updated avatar
      router.refresh()
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error updating avatar",
        description: error.message || "There was an error uploading your profile picture.",
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

  return (
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
          <p className="text-sm text-muted-foreground mt-2">Click on the avatar to upload a new profile picture</p>
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
  )
}
