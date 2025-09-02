"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"
import RichTextEditor from "@/components/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NewsFormProps {
  articleId?: string
  defaultValues?: {
    title: string
    content: string
    published: boolean
    featured: boolean
    image_url?: string
    excerpt?: string
  }
}

export default function NewsForm({ articleId, defaultValues }: NewsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, session } = useSupabase()

  // Form state
  const [title, setTitle] = useState(defaultValues?.title || "")
  const [content, setContent] = useState(defaultValues?.content || "")
  const [excerpt, setExcerpt] = useState(defaultValues?.excerpt || "")
  const [published, setPublished] = useState(defaultValues?.published || false)
  const [featured, setFeatured] = useState(defaultValues?.featured || false)
  const [imageUrl, setImageUrl] = useState(defaultValues?.image_url || "")

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.image_url || null)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("editor")

  // Check authentication
  useEffect(() => {
    if (!session) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to access this page.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [session, router, toast])

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (title.length < 5) {
      newErrors.title = "Title must be at least 5 characters."
    }

    if (content.length < 20) {
      newErrors.content = "Content must be at least 20 characters."
    }

    if (excerpt && excerpt.length > 200) {
      newErrors.excerpt = "Excerpt must be less than 200 characters."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    setImageUrl("") // Clear URL input when file is selected

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload image to storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null

    setIsUploading(true)

    try {
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `photos/${fileName}` // Changed from news/ to photos/

      console.log("Uploading image to:", filePath)

      // Upload the file to the photos folder
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      console.log("Upload successful:", uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image")
      }

      console.log("Image uploaded successfully to photos folder:", urlData.publicUrl)
      return urlData.publicUrl
    } catch (error: any) {
      console.error("Image upload error:", error)
      toast({
        title: "Error uploading image",
        description: error.message || "Failed to upload image. Please check storage permissions.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Generate excerpt from content if not provided
  const generateExcerpt = (content: string): string => {
    // Remove HTML tags
    const textContent = content.replace(/<[^>]*>/g, " ")
    // Trim whitespace and limit to 150 characters
    return textContent.trim().substring(0, 150) + (textContent.length > 150 ? "..." : "")
  }

  // Basic HTML sanitization
  const sanitizeContent = (content: string): string => {
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+="[^"]*"/g, "")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Sanitize content
      const sanitizedContent = sanitizeContent(content)

      // Upload image if there's a new one
      let finalImageUrl = imageUrl
      if (imageFile) {
        finalImageUrl = await uploadImage()
        if (!finalImageUrl) {
          toast({
            title: "Error uploading image",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Generate excerpt if not provided
      const finalExcerpt = excerpt || generateExcerpt(sanitizedContent)

      const articleData = {
        title,
        content: sanitizedContent,
        published,
        featured,
        image_url: finalImageUrl,
        excerpt: finalExcerpt,
        author_id: session?.user?.id,
        updated_at: new Date().toISOString(),
      }

      if (articleId) {
        // Update existing article
        const { error } = await supabase.from("news").update(articleData).eq("id", articleId)

        if (error) throw error

        toast({
          title: "Article updated",
          description: "Your article has been updated successfully.",
        })

        // Redirect to admin news page instead of home
        router.push("/admin/news")
      } else {
        // Create new article
        const { error } = await supabase.from("news").insert({
          ...articleData,
          created_at: new Date().toISOString(),
        })

        if (error) throw error

        toast({
          title: "Article created",
          description: "Your article has been created successfully.",
        })

        // Redirect to admin news page
        router.push("/admin/news")
      }
    } catch (error: any) {
      console.error("Error saving article:", error)
      toast({
        title: articleId ? "Error updating article" : "Error creating article",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image URL input change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
      setImageFile(null)
    } else {
      setImagePreview(null)
    }
  }

  // Handle cancel button click
  const handleCancel = () => {
    router.push("/admin/news")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)} />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt (Optional)</Label>
        <Input
          id="excerpt"
          placeholder="Brief summary of the article"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          A short summary that appears in article listings. If left empty, it will be generated automatically.
        </p>
        {errors.excerpt && <p className="text-sm text-red-500">{errors.excerpt}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-0">
            <RichTextEditor content={content} onChange={setContent} placeholder="Write your article content here..." />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <Card>
              <CardContent className="p-4">
                <div
                  className="prose prose-sm sm:prose-base max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeContent(content),
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Featured Image</Label>
        <div className="space-y-4">
          <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {imagePreview ? "Change Image" : "Upload Image"}
            </Button>
            <Input
              id="image-url"
              type="text"
              placeholder="Or enter image URL"
              value={imageUrl}
              onChange={handleImageUrlChange}
            />
          </div>
          {imagePreview && (
            <Card className="overflow-hidden">
              <CardContent className="p-2">
                <div className="relative h-48 w-full">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload an image or provide a URL. Recommended size: 1200x630 pixels.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox id="published" checked={published} onCheckedChange={(checked) => setPublished(checked === true)} />
          <div className="space-y-1 leading-none">
            <Label htmlFor="published">Published</Label>
            <p className="text-sm text-muted-foreground">This article will be visible to all users.</p>
          </div>
        </div>

        <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox id="featured" checked={featured} onCheckedChange={(checked) => setFeatured(checked === true)} />
          <div className="space-y-1 leading-none">
            <Label htmlFor="featured">Featured</Label>
            <p className="text-sm text-muted-foreground">This article will be highlighted on the homepage.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading || isUploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isUploading}>
          {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {articleId ? "Update Article" : "Create Article"}
        </Button>
      </div>
    </form>
  )
}
