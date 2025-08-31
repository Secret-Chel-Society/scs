"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PlayerAvatarUploaderProps {
  currentAvatarUrl: string | null
  userId: string
  gamerTag: string
  onAvatarUpdate: (newAvatarUrl: string) => void
}

export function PlayerAvatarUploader({
  currentAvatarUrl,
  userId,
  gamerTag,
  onAvatarUpdate,
}: PlayerAvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Update the user profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`)
      }

      // Update local state
      setAvatarUrl(newAvatarUrl)
      onAvatarUpdate(newAvatarUrl)

      toast({
        title: "Profile picture updated!",
        description: "Your avatar has been successfully updated.",
      })
    } catch (err: any) {
      console.error("Error uploading avatar:", err)
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getInitials = () => {
    if (gamerTag) {
      return gamerTag.substring(0, 2).toUpperCase()
    }
    return "PL"
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
        <Avatar className="h-24 w-24 border-2 border-muted">
          <AvatarImage src={avatarUrl || "/placeholder.svg?height=96&width=96"} alt={gamerTag || "Player"} />
          <AvatarFallback className="text-2xl font-semibold">{getInitials()}</AvatarFallback>
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

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Click on the avatar to upload a new profile picture</p>
        <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, GIF (max 5MB)</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAvatarClick}
        disabled={isUploading}
        className="w-full max-w-xs"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Change Profile Picture
          </>
        )}
      </Button>
    </div>
  )
}
