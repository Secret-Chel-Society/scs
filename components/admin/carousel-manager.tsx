"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Plus, Pencil, Trash, ChevronUp, ChevronDown, AlertCircle, Info, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUploader } from "@/components/admin/file-uploader"

interface CarouselImage {
  id: string
  url: string
  title: string
  subtitle: string
  order: number
}

export function CarouselManager() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingImage, setIsAddingImage] = useState(false)
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null)
  const [imageForm, setImageForm] = useState<Omit<CarouselImage, "id">>({
    url: "",
    title: "",
    subtitle: "",
    order: 0,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [carouselSetupNeeded, setCarouselSetupNeeded] = useState(false)
  const [setupInProgress, setSetupInProgress] = useState(false)
  const [bucketSetupNeeded, setBucketSetupNeeded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingBucket, setCheckingBucket] = useState(false)
  const [bucketDebugInfo, setBucketDebugInfo] = useState<any>(null)
  const [overrideBucketCheck, setOverrideBucketCheck] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (session?.user) {
      loadCarouselImages()
      checkCarouselBucket()
    }

    return () => {
      // Clear any pending retry timeouts when component unmounts
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [session, retryCount])

  // Load carousel images with retry logic
  async function loadCarouselImages() {
    setLoading(true)
    setError(null)
    try {
      // First check if the carousel_images table exists
      const { error: tableCheckError } = await supabase.from("carousel_images").select("id").limit(1)

      if (tableCheckError) {
        if (tableCheckError.message.includes("does not exist")) {
          console.log("Carousel images table does not exist")
          setCarouselSetupNeeded(true)
          setLoading(false)
          return
        }

        // Check for rate limiting errors
        if (tableCheckError.message.includes("Too Many") || tableCheckError.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        }

        throw new Error(tableCheckError.message)
      }

      // If we get here, the table exists, so load the images
      const { data, error } = await supabase.from("carousel_images").select("*").order("order", { ascending: true })

      if (error) {
        // Check for rate limiting errors
        if (error.message.includes("Too Many") || error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        }

        throw new Error("Failed to load carousel images")
      }

      setCarouselImages(data || [])
      setCarouselSetupNeeded(false)
    } catch (error: any) {
      console.error("Error loading carousel images:", error)
      setError(error.message || "Failed to load carousel images")

      // If it's a rate limit error, set up a retry
      if (error.message.includes("Rate limit") || error.message.includes("Too Many")) {
        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 5000) // Retry after 5 seconds

        setRetryTimeout(timeout)
        setError(`${error.message} Retrying in 5 seconds...`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Check if the carousel bucket exists - client-side fallback
  async function checkCarouselBucket() {
    setCheckingBucket(true)
    try {
      // Try client-side check first to avoid rate limiting on the API route
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets()

        if (error) {
          // Check for rate limiting errors
          if (error.message.includes("Too Many") || error.message.includes("429")) {
            throw new Error("Rate limit exceeded. Please try again in a moment.")
          }

          console.error("Error listing buckets:", error)
          setBucketDebugInfo({ error: error.message, clientSide: true })
          setBucketSetupNeeded(!overrideBucketCheck)
          return
        }

        const carouselBucket = buckets.find((bucket) => bucket.name.toLowerCase() === "carousel")

        setBucketDebugInfo({
          exists: !!carouselBucket,
          bucketNames: buckets.map((b) => b.name),
          clientSide: true,
        })

        setBucketSetupNeeded(!carouselBucket && !overrideBucketCheck)
        return
      } catch (clientError) {
        console.error("Client-side bucket check failed:", clientError)
        // Continue to server-side check if client-side fails
      }

      // Server-side check as fallback
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch("/api/check-carousel-bucket", {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Server-side bucket check error (${response.status}):`, errorText)
          throw new Error(`Server error: ${response.status}`)
        }

        const data = await response.json()
        console.log("Server-side bucket check result:", data)
        setBucketDebugInfo(data)

        setBucketSetupNeeded(!data.exists && !overrideBucketCheck)
      } catch (error: any) {
        console.error("Error with server-side check:", error)

        // If it's a rate limit error, set up a retry
        if (error.message.includes("Rate limit") || error.message.includes("Too Many")) {
          const timeout = setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 5000) // Retry after 5 seconds

          setRetryTimeout(timeout)
          setError(`${error.message} Retrying in 5 seconds...`)
        }

        // Assume bucket setup is needed if we can't verify
        setBucketSetupNeeded(!overrideBucketCheck)
      }
    } catch (error: any) {
      console.error("Error checking carousel bucket:", error)
      setBucketDebugInfo({ error: error.message, clientSide: true })
      setBucketSetupNeeded(!overrideBucketCheck)
    } finally {
      setCheckingBucket(false)
    }
  }

  // Setup carousel infrastructure
  async function setupCarouselInfrastructure() {
    setSetupInProgress(true)
    setError(null)

    try {
      // Call our API route to create the table
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/setup-carousel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create carousel_images table: ${errorText || "Unknown error"}`)
      }

      const data = await response.json()

      // Success for table creation
      toast({
        title: "Partial setup complete",
        description: "Database table created successfully. Please follow the instructions to complete setup.",
      })

      // Set a flag to show bucket creation instructions
      setCarouselSetupNeeded(false)
      setBucketSetupNeeded(true)

      // Reload the page to check if the table was created
      await loadCarouselImages()
    } catch (error: any) {
      console.error("Error setting up carousel infrastructure:", error)
      setError(error.message || "Failed to set up carousel infrastructure")
      toast({
        title: "Setup failed",
        description: error.message || "Failed to set up carousel infrastructure",
        variant: "destructive",
      })
    } finally {
      setSetupInProgress(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setImageFile(file)
    setImageForm((prev) => ({
      ...prev,
      url: URL.createObjectURL(file),
    }))
  }

  // Save carousel image
  const handleSaveCarouselImage = async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (!imageForm.title.trim()) {
        toast({
          title: "Error",
          description: "Image title is required",
          variant: "destructive",
        })
        return
      }

      let imageUrl = imageForm.url

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true)

        // Skip bucket check if override is enabled
        if (!overrideBucketCheck) {
          // Use client-side check for bucket existence
          const { data: buckets, error } = await supabase.storage.listBuckets()

          if (error) {
            // Check for rate limiting errors
            if (error.message.includes("Too Many") || error.message.includes("429")) {
              throw new Error("Rate limit exceeded. Please try again in a moment.")
            }

            throw new Error(`Error listing buckets: ${error.message}`)
          }

          const carouselBucket = buckets.find((bucket) => bucket.name.toLowerCase() === "carousel")

          if (!carouselBucket) {
            setBucketSetupNeeded(true)
            throw new Error("Storage bucket 'carousel' does not exist. Please follow the setup instructions.")
          }
        }

        const fileExt = imageFile.name.split(".").pop()
        const fileName = `carousel-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("carousel")
          .upload(fileName, imageFile)

        if (uploadError) {
          // Check for rate limiting errors
          if (uploadError.message.includes("Too Many") || uploadError.message.includes("429")) {
            throw new Error("Rate limit exceeded. Please try again in a moment.")
          }

          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("carousel").getPublicUrl(fileName)

        imageUrl = publicUrlData.publicUrl
        setUploadingImage(false)
      }

      // Check if the carousel_images table exists
      try {
        const { error: tableCheckError } = await supabase.from("carousel_images").select("id").limit(1)

        if (tableCheckError) {
          if (tableCheckError.message.includes("does not exist")) {
            // Create the table
            await setupCarouselInfrastructure()
          } else {
            // Check for rate limiting errors
            if (tableCheckError.message.includes("Too Many") || tableCheckError.message.includes("429")) {
              throw new Error("Rate limit exceeded. Please try again in a moment.")
            }

            throw new Error(`Failed to check if table exists: ${tableCheckError.message}`)
          }
        }
      } catch (error: any) {
        console.error("Error checking/creating table:", error)
        throw new Error(`Failed to prepare database: ${error.message}`)
      }

      if (editingImage) {
        // Update existing image
        const { error } = await supabase
          .from("carousel_images")
          .update({
            url: imageUrl,
            title: imageForm.title,
            subtitle: imageForm.subtitle,
            order: imageForm.order,
          })
          .eq("id", editingImage.id)

        if (error) {
          // Check for rate limiting errors
          if (error.message.includes("Too Many") || error.message.includes("429")) {
            throw new Error("Rate limit exceeded. Please try again in a moment.")
          }

          throw new Error(`Failed to update carousel image: ${error.message}`)
        }
      } else {
        // Add new image
        const { error } = await supabase.from("carousel_images").insert({
          url: imageUrl,
          title: imageForm.title,
          subtitle: imageForm.subtitle,
          order: imageForm.order || carouselImages.length,
        })

        if (error) {
          // Check for rate limiting errors
          if (error.message.includes("Too Many") || error.message.includes("429")) {
            throw new Error("Rate limit exceeded. Please try again in a moment.")
          }

          throw new Error(`Failed to add carousel image: ${error.message}`)
        }
      }

      // Reload images
      await loadCarouselImages()

      // Reset form
      setImageForm({
        url: "",
        title: "",
        subtitle: "",
        order: carouselImages.length,
      })
      setImageFile(null)
      setIsAddingImage(false)
      setEditingImage(null)

      toast({
        title: "Success",
        description: editingImage ? "Carousel image updated" : "Carousel image added",
      })
    } catch (error: any) {
      console.error("Error saving carousel image:", error)
      setError(error.message || "Failed to save carousel image")
      toast({
        title: "Error",
        description: error.message || "Failed to save carousel image",
        variant: "destructive",
      })

      // If it's a rate limit error, set up a retry
      if (error.message.includes("Rate limit") || error.message.includes("Too Many")) {
        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 5000) // Retry after 5 seconds

        setRetryTimeout(timeout)
        setError(`${error.message} Retrying in 5 seconds...`)
      }
    } finally {
      setIsSaving(false)
      setUploadingImage(false)
    }
  }

  // Delete carousel image
  const handleDeleteCarouselImage = async (image: CarouselImage) => {
    setError(null)
    try {
      const { error } = await supabase.from("carousel_images").delete().eq("id", image.id)

      if (error) {
        // Check for rate limiting errors
        if (error.message.includes("Too Many") || error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        }

        throw new Error(`Failed to delete carousel image: ${error.message}`)
      }

      // If the image is from storage, delete it
      if (image.url.includes("supabase")) {
        const fileName = image.url.split("/").pop()
        if (fileName) {
          await supabase.storage.from("carousel").remove([fileName])
        }
      }

      await loadCarouselImages()

      toast({
        title: "Success",
        description: "Carousel image deleted",
      })
    } catch (error: any) {
      console.error("Error deleting carousel image:", error)
      setError(error.message || "Failed to delete carousel image")
      toast({
        title: "Error",
        description: error.message || "Failed to delete carousel image",
        variant: "destructive",
      })

      // If it's a rate limit error, set up a retry
      if (error.message.includes("Rate limit") || error.message.includes("Too Many")) {
        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 5000) // Retry after 5 seconds

        setRetryTimeout(timeout)
        setError(`${error.message} Retrying in 5 seconds...`)
      }
    }
  }

  // Edit carousel image
  const handleEditCarouselImage = (image: CarouselImage) => {
    setEditingImage(image)
    setImageForm({
      url: image.url,
      title: image.title,
      subtitle: image.subtitle,
      order: image.order,
    })
    setImageFile(null)
  }

  // Reorder carousel images
  const handleReorderCarouselImages = async (imageId: string, newOrder: number) => {
    setError(null)
    try {
      // Find the image
      const image = carouselImages.find((img) => img.id === imageId)
      if (!image) return

      // Update the order
      const { error } = await supabase.from("carousel_images").update({ order: newOrder }).eq("id", imageId)

      if (error) {
        // Check for rate limiting errors
        if (error.message.includes("Too Many") || error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        }

        throw new Error(`Failed to update image order: ${error.message}`)
      }

      // Reload images
      await loadCarouselImages()
    } catch (error: any) {
      console.error("Error reordering carousel images:", error)
      setError(error.message || "Failed to reorder carousel images")
      toast({
        title: "Error",
        description: error.message || "Failed to reorder carousel images",
        variant: "destructive",
      })

      // If it's a rate limit error, set up a retry
      if (error.message.includes("Rate limit") || error.message.includes("Too Many")) {
        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 5000) // Retry after 5 seconds

        setRetryTimeout(timeout)
        setError(`${error.message} Retrying in 5 seconds...`)
      }
    }
  }

  // Toggle override
  const handleToggleOverride = () => {
    setOverrideBucketCheck(!overrideBucketCheck)
    if (!overrideBucketCheck) {
      // If enabling override, hide the bucket setup message
      setBucketSetupNeeded(false)
    } else {
      // If disabling override, recheck the bucket
      checkCarouselBucket()
    }
  }

  // Manual retry function
  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // If not logged in
  if (!session?.user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>You must be logged in to manage carousel images.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Carousel</CardTitle>
        <CardDescription>Manage the images displayed in the homepage carousel</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {error.includes("Rate limit") && (
                <div className="mt-2">
                  <Button size="sm" onClick={handleManualRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Now
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {carouselSetupNeeded ? (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              The carousel feature requires additional setup. Click the button below to create the necessary database
              table.
              <div className="mt-4">
                <Button onClick={setupCarouselInfrastructure} disabled={setupInProgress}>
                  {setupInProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Set Up Carousel Database"
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : bucketSetupNeeded ? (
          <Alert className="mb-4" variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Storage Setup Required</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                You need to create a storage bucket in your Supabase dashboard to store carousel images:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to Storage in the left sidebar</li>
                <li>Click "New Bucket"</li>
                <li>Name the bucket "carousel" (all lowercase)</li>
                <li>Enable "Public bucket" option</li>
                <li>Click "Create bucket"</li>
              </ol>
              <p>After creating the bucket, click the button below to check again:</p>
              <div className="mt-4 flex flex-col gap-4">
                <Button onClick={checkCarouselBucket} disabled={checkingBucket} className="w-fit">
                  {checkingBucket ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Again
                    </>
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch id="override-check" checked={overrideBucketCheck} onCheckedChange={handleToggleOverride} />
                  <Label htmlFor="override-check">
                    Override bucket check (use if bucket exists but isn't being detected)
                  </Label>
                </div>

                {bucketDebugInfo && (
                  <div className="mt-2 p-4 bg-muted rounded-md text-xs">
                    <p className="font-semibold mb-1">Debug Information:</p>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(bucketDebugInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Carousel management UI */}
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Carousel Images</h3>
              <Dialog
                open={isAddingImage}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsAddingImage(false)
                    setEditingImage(null)
                    setImageForm({
                      url: "",
                      title: "",
                      subtitle: "",
                      order: carouselImages.length,
                    })
                    setImageFile(null)
                  } else {
                    setIsAddingImage(true)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingImage ? "Edit Carousel Image" : "Add Carousel Image"}</DialogTitle>
                    <DialogDescription>
                      {editingImage
                        ? "Update the details for this carousel image."
                        : "Add a new image to the homepage carousel."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-upload">Image</Label>
                      <div className="grid gap-2">
                        {(imageForm.url || editingImage) && (
                          <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                            <img
                              src={imageForm.url || "/placeholder.svg"}
                              alt="Carousel preview"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <FileUploader onFileSelect={handleImageUpload} accept="image/*" maxSize={5} id="image-upload" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-title">Title</Label>
                      <Input
                        id="image-title"
                        value={imageForm.title}
                        onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })}
                        placeholder="e.g. Welcome to MGHL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-subtitle">Subtitle</Label>
                      <Input
                        id="image-subtitle"
                        value={imageForm.subtitle}
                        onChange={(e) => setImageForm({ ...imageForm, subtitle: e.target.value })}
                        placeholder="e.g. The premier NHL 25 competitive gaming league"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-order">Display Order</Label>
                      <Input
                        id="image-order"
                        type="number"
                        min="0"
                        value={imageForm.order}
                        onChange={(e) => setImageForm({ ...imageForm, order: Number.parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Images are displayed in ascending order (0 first).
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingImage(false)
                        setEditingImage(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCarouselImage} disabled={isSaving || uploadingImage || !imageForm.title}>
                      {(isSaving || uploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingImage ? "Update Image" : "Add Image"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carouselImages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No carousel images have been added yet. Click "Add Image" to create your first image.
                        </TableCell>
                      </TableRow>
                    ) : (
                      carouselImages.map((image) => (
                        <TableRow key={image.id}>
                          <TableCell>
                            <div className="relative w-16 h-9 overflow-hidden rounded">
                              <img
                                src={image.url || "/placeholder.svg"}
                                alt={image.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-medium">{image.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{image.subtitle}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReorderCarouselImages(image.id, Math.max(0, image.order - 1))}
                                disabled={image.order === 0}
                                className="h-8 w-8"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <span>{image.order}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReorderCarouselImages(image.id, image.order + 1)}
                                className="h-8 w-8"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleEditCarouselImage(image)
                                  setIsAddingImage(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteCarouselImage(image)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
