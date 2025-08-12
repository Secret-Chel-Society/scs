"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { FileUploader } from "@/components/admin/file-uploader"
import { Loader2, RefreshCw, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LogoManager() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [logoType, setLogoType] = useState<"primary" | "secondary">("primary")

  useEffect(() => {
    loadCurrentLogos()
  }, [supabase])

  const loadCurrentLogos = async () => {
    setLoading(true)
    try {
      // Get the current logo settings from the system_settings table
      const { data, error } = await supabase.from("system_settings").select("value").eq("key", "logo_url").single()

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found, which is fine for new installations
          console.log("No logo settings found")
        } else {
          throw error
        }
      } else if (data) {
        setCurrentLogo(data.value)
        setLogoPreview(data.value)
      }
    } catch (error: any) {
      console.error("Error loading logo settings:", error)
      toast({
        title: "Error",
        description: "Failed to load current logo settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast({
        title: "No file selected",
        description: "Please select a logo image to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Upload to the logos folder in the media bucket
      const fileExt = logoFile.name.split(".").pop()
      const fileName = `mghl-logo-${logoType}-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Make sure the logos folder exists
      try {
        await supabase.storage.from("media").upload(`logos/.keep`, new Blob([""]), {
          contentType: "text/plain",
          upsert: true,
        })
      } catch (error) {
        // Ignore errors here, as the folder might already exist
        console.log("Folder might already exist:", error)
      }

      // Upload the logo file
      const { data: uploadData, error: uploadError } = await supabase.storage.from("media").upload(filePath, logoFile, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)
      const logoUrl = urlData.publicUrl

      // Save the logo URL to the system_settings table
      setSaving(true)
      const { error: saveError } = await supabase
        .from("system_settings")
        .upsert({ key: "logo_url", value: logoUrl }, { onConflict: "key" })

      if (saveError) {
        throw saveError
      }

      // Update the current logo
      setCurrentLogo(logoUrl)

      toast({
        title: "Logo updated",
        description: "The logo has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setSaving(false)
      setLogoFile(null)
    }
  }

  if (!session?.user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>You must be logged in to manage logos.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MGHL Logo Management</CardTitle>
          <CardDescription>Upload and manage the logo used in the navigation bar and footer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Logo Display */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Logo</h3>
              <div className="flex items-center space-x-4">
                <div className="bg-muted rounded-md p-4 flex items-center justify-center w-64 h-24">
                  {currentLogo ? (
                    <Image
                      src={currentLogo || "/placeholder.svg"}
                      alt="Current MGHL Logo"
                      width={200}
                      height={60}
                      className="object-contain max-h-full"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">No logo set</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={loadCurrentLogos} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Upload New Logo</h3>

              <div className="space-y-2">
                <Label htmlFor="logo-type">Logo Type</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="radio"
                      id="primary-logo"
                      name="logo-type"
                      value="primary"
                      checked={logoType === "primary"}
                      onChange={() => setLogoType("primary")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="primary-logo" className="font-normal">
                      Primary Logo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="radio"
                      id="secondary-logo"
                      name="logo-type"
                      value="secondary"
                      checked={logoType === "secondary"}
                      onChange={() => setLogoType("secondary")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="secondary-logo" className="font-normal">
                      Secondary Logo
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Logo Image</Label>
                <FileUploader onFileSelect={handleFileSelect} accept="image/*" maxSize={2} />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 240px × 80px. Max file size: 2MB. Transparent PNG recommended.
                </p>
              </div>

              {logoPreview && logoPreview !== currentLogo && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="bg-muted rounded-md p-4 flex items-center justify-center w-64 h-24">
                    <Image
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo Preview"
                      width={200}
                      height={60}
                      className="object-contain max-h-full"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleUploadLogo} disabled={!logoFile || uploading || saving} className="mt-4">
                {(uploading || saving) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {!uploading && !saving && <Check className="h-4 w-4 mr-2" />}
                {uploading ? "Uploading..." : saving ? "Saving..." : "Update Logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
