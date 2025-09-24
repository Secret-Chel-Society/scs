"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Upload, X, ImageIcon, AlertCircle, ExternalLink, Info, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PhotoUploader() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")
  const [error, setError] = useState<string | null>(null)
  const [bucketExists, setBucketExists] = useState(false)
  const [isCreatingBucket, setIsCreatingBucket] = useState(false)
  const [bucketCheckComplete, setBucketCheckComplete] = useState(false)
  const [bucketError, setBucketError] = useState<string | null>(null)
  const [isCheckingBucket, setIsCheckingBucket] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [bypassBucketCheck, setBypassBucketCheck] = useState(false)

  // Function to check if the bucket exists
  const checkBucket = async () => {
    if (!session?.user || isCheckingBucket) return

    setIsCheckingBucket(true)
    setBucketCheckComplete(false)
    setBucketError(null)
    setDebugInfo(null)

    try {
      console.log("Checking if media bucket exists...")

      // First try to list buckets instead of getting a specific bucket
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error("Error listing buckets:", listError)
        setDebugInfo({
          operation: "listBuckets",
          error: listError,
          message: "Failed to list buckets",
        })

        // If we can't list buckets, try to get the specific bucket
        const { data: bucketData, error: getBucketError } = await supabase.storage.getBucket("media")

        if (getBucketError) {
          console.error("Error getting media bucket:", getBucketError)
          setBucketExists(false)
          setBucketError("Could not verify bucket existence. You may need to bypass the bucket check.")
          setDebugInfo((prev) => ({
            ...prev,
            getBucket: {
              error: getBucketError,
              message: "Failed to get media bucket",
            },
          }))
        } else {
          console.log("Media bucket exists (via getBucket):", bucketData)
          setBucketExists(true)
        }
      } else {
        // Check if media bucket exists in the list
        const mediaBucket = buckets?.find((bucket) => bucket.name === "media")
        setDebugInfo({
          operation: "listBuckets",
          buckets: buckets?.map((b) => b.name) || [],
          mediaBucketFound: !!mediaBucket,
        })

        if (mediaBucket) {
          console.log("Media bucket exists (via listBuckets):", mediaBucket)
          setBucketExists(true)
        } else {
          console.log("Media bucket not found in bucket list:", buckets)
          setBucketExists(false)
          setBucketError("The 'media' bucket was not found in your Supabase project.")
        }
      }

      // As a final check, try to list files in the media bucket
      try {
        const { data: files, error: listFilesError } = await supabase.storage.from("media").list()

        if (!listFilesError) {
          console.log("Successfully listed files in media bucket:", files)
          setBucketExists(true)
          setDebugInfo((prev) => ({
            ...prev,
            listFiles: {
              success: true,
              fileCount: files?.length || 0,
            },
          }))
        } else {
          console.error("Error listing files in media bucket:", listFilesError)
          setDebugInfo((prev) => ({
            ...prev,
            listFiles: {
              error: listFilesError,
              message: "Failed to list files in media bucket",
            },
          }))

          // Only set bucket as non-existent if we haven't already determined it exists
          if (!bucketExists) {
            setBucketExists(false)
            setBucketError(
              "Could not list files in the media bucket. The bucket may not exist or you may not have permission.",
            )
          }
        }
      } catch (listFilesErr) {
        console.error("Exception listing files:", listFilesErr)
      }
    } catch (err: any) {
      console.error("Error checking bucket:", err)
      setBucketExists(false)
      setBucketError(err.message || "Failed to check if bucket exists")
      setDebugInfo((prev) => ({
        ...prev,
        exception: {
          message: err.message,
          stack: err.stack,
        },
      }))
    } finally {
      setIsCheckingBucket(false)
      setBucketCheckComplete(true)
    }
  }

  // Check bucket on component mount
  useEffect(() => {
    if (session?.user && !bypassBucketCheck) {
      checkBucket()
    } else if (bypassBucketCheck) {
      setBucketExists(true)
      setBucketCheckComplete(true)
    }
  }, [session, bypassBucketCheck])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null)
      setPreview(null)
      return
    }

    const file = e.target.files[0]

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setSelectedFile(file)

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Auto-fill title from filename
    const fileName = file.name.split(".")[0].replace(/-|_/g, " ")
    setTitle(fileName.charAt(0).toUpperCase() + fileName.slice(1))
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setTitle("")
    setDescription("")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const createBucket = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a bucket",
        variant: "destructive",
      })
      return
    }

    setIsCreatingBucket(true)
    setBucketError(null)

    try {
      console.log("Creating media bucket...")
      const { data, error } = await supabase.storage.createBucket("media", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        console.error("Error creating bucket:", error)
        if (error.message.includes("permission")) {
          throw new Error("You don't have permission to create buckets. Please contact your Supabase admin.")
        } else {
          throw error
        }
      }

      console.log("Media bucket created successfully")

      // Create necessary folders
      const folders = ["general", "teams", "players", "matches", "events", "photos"]

      for (const folder of folders) {
        console.log(`Creating folder: ${folder}`)
        try {
          // To create a folder in Supabase storage, we upload an empty file with a path ending in "/"
          const { error: folderError } = await supabase.storage
            .from("media")
            .upload(`${folder}/.keep`, new Blob([""]), {
              contentType: "text/plain",
            })

          if (folderError) {
            console.warn(`Error creating folder ${folder}:`, folderError)
          }
        } catch (folderErr) {
          console.warn(`Exception creating folder ${folder}:`, folderErr)
        }
      }

      // Create subfolders for photos
      const photoSubfolders = ["general", "teams", "players", "matches", "events"]

      for (const subfolder of photoSubfolders) {
        console.log(`Creating photo subfolder: photos/${subfolder}`)
        try {
          const { error: subfolderError } = await supabase.storage
            .from("media")
            .upload(`photos/${subfolder}/.keep`, new Blob([""]), {
              contentType: "text/plain",
            })

          if (subfolderError) {
            console.warn(`Error creating subfolder photos/${subfolder}:`, subfolderError)
          }
        } catch (subfolderErr) {
          console.warn(`Exception creating subfolder photos/${subfolder}:`, subfolderErr)
        }
      }

      setBucketExists(true)
      toast({
        title: "Bucket created",
        description: "The media storage bucket has been created successfully",
      })
    } catch (error: any) {
      console.error("Error creating bucket:", error)
      setBucketError(error.message || "Failed to create storage bucket")
      toast({
        title: "Error creating bucket",
        description: error.message || "Failed to create storage bucket",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBucket(false)
    }
  }

  const handleUpload = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload photos",
        variant: "destructive",
      })
      return
    }

    if (!bucketExists && !bypassBucketCheck) {
      setError("The media storage bucket does not exist. Please create it first or bypass the bucket check.")
      return
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for the image",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Generate a unique filename
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `photos/${category}/${fileName}`

      // Make sure the folder exists
      try {
        await supabase.storage.from("media").upload(`photos/${category}/.keep`, new Blob([""]), {
          contentType: "text/plain",
          upsert: true,
        })
      } catch (folderError) {
        // Ignore errors here, as the folder might already exist
        console.log("Folder might already exist:", folderError)
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        if (uploadError.message.includes("permission") || uploadError.message.includes("policy")) {
          throw new Error(
            "Storage permission denied. Please check that you have the correct storage policies set up in Supabase.",
          )
        }
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

      // Save metadata to database
      const { error: dbError } = await supabase.from("photos").insert({
        title,
        description,
        category,
        file_path: filePath,
        url: urlData.publicUrl,
        size: selectedFile.size,
        file_type: selectedFile.type,
      })

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from("media").remove([filePath])

        if (dbError.message.includes("policy") || dbError.message.includes("permission")) {
          throw new Error(
            "Database permission denied. Please check that you have the correct row-level security policies set up for the photos table.",
          )
        }

        throw dbError
      }

      toast({
        title: "Upload successful",
        description: "Your photo has been uploaded successfully",
      })

      // Clear form
      clearSelection()

      // Refresh the page to show the new photo
      router.refresh()
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "An error occurred during upload")
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // If not logged in
  if (!session?.user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>You must be logged in to upload photos.</AlertDescription>
      </Alert>
    )
  }

  // If still checking bucket status
  if (isCheckingBucket) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking storage configuration...</p>
        </div>
      </div>
    )
  }

  // If bucket doesn't exist and we're not bypassing the check
  if (!bucketExists && !bypassBucketCheck) {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="create">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="create">Create Bucket</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Storage bucket missing</AlertTitle>
              <AlertDescription>
                {bucketError || "The media storage bucket does not exist in your Supabase project."}
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Create Storage Bucket</h2>

                  <p>
                    Before you can upload photos, you need to create a storage bucket. This will create a "media" bucket
                    in your Supabase project with the necessary folders.
                  </p>

                  <Button onClick={createBucket} disabled={isCreatingBucket} className="w-full" size="lg">
                    {isCreatingBucket ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Creating bucket...
                      </>
                    ) : (
                      "Create Media Bucket"
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    This will create a public bucket named "media" with folders for different content types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Manual Setup Instructions</AlertTitle>
              <AlertDescription>Follow these steps to manually create the bucket in Supabase.</AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Create the bucket manually:</h3>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to Storage in the left sidebar</li>
                    <li>Click "New Bucket" and name it "media"</li>
                    <li>Set it as public</li>
                    <li>
                      Add policies to allow admin users to upload files (see{" "}
                      <a
                        href="https://supabase.com/docs/guides/storage/security/access-control"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline inline-flex items-center"
                      >
                        documentation
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                      )
                    </li>
                  </ol>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-4">
                        View Policy Examples
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Storage Policy Examples</DialogTitle>
                        <DialogDescription>Copy these policies to your Supabase storage bucket</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-1">For INSERT (Upload files)</h3>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {`(auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'Admin'))`}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">For SELECT (View files)</h3>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{`true`}</pre>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">For UPDATE (Update files)</h3>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {`(auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'Admin'))`}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">For DELETE (Delete files)</h3>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {`(auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'Admin'))`}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">After creating the bucket:</h3>
                    <div className="space-y-4">
                      <Button variant="secondary" className="w-full" onClick={checkBucket} disabled={isCheckingBucket}>
                        {isCheckingBucket ? "Checking..." : "I've created the bucket manually, check again"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Troubleshooting</AlertTitle>
              <AlertDescription>
                If you're sure the bucket exists but it's not being detected, you can try these options.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Debug Information</h2>

                  {debugInfo && (
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Options:</h3>

                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" onClick={checkBucket} disabled={isCheckingBucket}>
                        {isCheckingBucket ? "Checking..." : "Check Bucket Again"}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setBypassBucketCheck(true)
                          toast({
                            title: "Bucket check bypassed",
                            description: "You can now upload photos, but errors may occur if the bucket doesn't exist.",
                          })
                        }}
                      >
                        Bypass Bucket Check
                      </Button>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Bypass Information</AlertTitle>
                      <AlertDescription>
                        Bypassing the bucket check will allow you to attempt uploads even if the bucket check fails.
                        This is useful if you're sure the bucket exists but there's an issue with the detection. If the
                        bucket truly doesn't exist, uploads will fail.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Normal upload UI when bucket exists or we're bypassing the check
  return (
    <div className="space-y-6">
      {bypassBucketCheck && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Bucket Check Bypassed</AlertTitle>
          <AlertDescription>You've bypassed the bucket check. Uploads will be attempted directly.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>
            {error}
            {(error.includes("permission") || error.includes("policy")) && (
              <div className="mt-2">
                <p className="font-semibold">Supabase Storage Policy Setup:</p>
                <ol className="list-decimal pl-5 space-y-1 mt-1">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Storage → Policies</li>
                  <li>Select the "media" bucket</li>
                  <li>
                    Add a policy for INSERT with the following condition:
                    <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                      {`(auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'Admin'))`}
                    </pre>
                  </li>
                  <li>Add similar policies for SELECT, UPDATE, and DELETE operations as needed</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="photo">Photo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="photo"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {selectedFile && (
                  <Button variant="outline" size="icon" onClick={clearSelection} type="button">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Max file size: 5MB</p>
            </div>

            {preview && (
              <div className="relative w-full max-w-md mx-auto aspect-video bg-muted rounded-md overflow-hidden">
                <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
              </div>
            )}

            {!preview && (
              <div className="w-full max-w-md mx-auto aspect-video bg-muted rounded-md flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter photo title"
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter photo description"
                rows={3}
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
                  <SelectItem value="players">Players</SelectItem>
                  <SelectItem value="matches">Matches</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full max-w-sm">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
