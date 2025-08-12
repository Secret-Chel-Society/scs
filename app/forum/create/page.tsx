"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Category {
  id: string
  name: string
  color: string
  admin_only?: boolean
}

export default function CreatePostPage() {
  const router = useRouter()
  const { session, supabase } = useSupabase()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch user role
  const fetchUserRole = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)

      const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false
      setUserRole(isAdmin ? "admin" : "player")
      console.log("User role for category filtering:", isAdmin ? "admin" : "player")
    } catch (error) {
      console.error("Error fetching user role:", error)
      setUserRole("player") // Default to player if role check fails
    }
  }, [session?.user?.id, supabase])

  // Fetch categories on component mount - using useCallback to prevent multiple calls
  const fetchCategories = useCallback(async () => {
    if (!session) return

    try {
      setIsLoadingCategories(true)
      setFetchError(null)
      setDebugInfo(null)

      console.log("Fetching categories with user role:", userRole)

      // Get categories directly from Supabase
      const { data: directCategories, error: directError } = await supabase
        .from("forum_categories")
        .select("id, name, color, admin_only")
        .order("name")

      if (directError) {
        console.error("Direct Supabase error:", directError)
        throw new Error(`Database error: ${directError.message}`)
      }

      if (!directCategories || directCategories.length === 0) {
        throw new Error("No categories found in database")
      }

      console.log("Got categories from database:", directCategories)

      // Filter categories based on user role
      const filteredCategories = directCategories.filter((category) => {
        // If category is admin_only, only show to admins
        if (category.admin_only) {
          return userRole === "admin"
        }
        return true
      })

      console.log("Filtered categories for user role:", userRole, filteredCategories)

      if (filteredCategories.length === 0) {
        throw new Error("No categories available for your role")
      }

      setCategories(filteredCategories)
      setCategoryId(filteredCategories[0].id)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setFetchError(error instanceof Error ? error.message : "Failed to load categories")

      // Fallback: create a default category option
      const fallbackCategories = [{ id: "general", name: "General Discussion", color: "#3b82f6", admin_only: false }]
      setCategories(fallbackCategories)
      setCategoryId(fallbackCategories[0].id)

      toast({
        title: "Warning",
        description: "Using fallback category. Some categories may not be available.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }, [session, toast, supabase, userRole])

  useEffect(() => {
    if (session) {
      fetchUserRole()
    } else {
      setIsLoadingCategories(false)
    }
  }, [session, fetchUserRole])

  useEffect(() => {
    // Only fetch categories after we have a user role (or failed to get one)
    if (session && userRole !== null) {
      fetchCategories()
    }
  }, [session, userRole, fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter content",
        variant: "destructive",
      })
      return
    }

    if (!categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo(null)

    try {
      console.log("Creating post with data:", {
        title: title.trim(),
        contentLength: content.length,
        category_id: categoryId,
      })

      // Try direct Supabase insert first as a fallback
      try {
        const { data: directPost, error: directError } = await supabase
          .from("forum_posts")
          .insert({
            title: title.trim(),
            content,
            author_id: session.user.id,
            category_id: categoryId,
            view_count: 0,
            pinned: false,
          })
          .select("*")
          .single()

        if (!directError && directPost) {
          console.log("Post created directly with Supabase:", directPost)
          toast({
            title: "Success",
            description: "Post created successfully",
          })
          router.push(`/forum/posts/${directPost.id}`)
          return
        } else {
          console.log("Direct Supabase insert failed, trying API:", directError)
          setDebugInfo(`Direct insert failed: ${directError?.message}`)
        }
      } catch (directError) {
        console.error("Error with direct insert:", directError)
      }

      // If direct insert failed, try the API
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          category_id: categoryId,
        }),
      })

      let responseText
      try {
        responseText = await response.text()
        const data = JSON.parse(responseText)

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`)
        }

        console.log("API response:", data)
        toast({
          title: "Success",
          description: "Post created successfully",
        })
        router.push(`/forum/posts/${data.post.id}`)
      } catch (parseError) {
        console.error("Error parsing response:", parseError, "Response text:", responseText)
        setDebugInfo(
          `Response parsing error: ${parseError instanceof Error ? parseError.message : String(parseError)}\nResponse: ${responseText}`,
        )
        throw new Error(`Failed to parse response: ${responseText}`)
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to create a forum post.</p>
            <Button onClick={() => router.push("/login")} className="mt-4">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/forum")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Forum
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {debugInfo && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Debug Information</AlertTitle>
                <AlertDescription>
                  <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {debugInfo}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                disabled={isLoading}
                maxLength={200}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category
              </label>
              {fetchError ? (
                <div className="text-sm text-red-500 mb-2">
                  Error loading categories: {fetchError}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={fetchCategories}
                    disabled={isLoadingCategories}
                  >
                    Retry
                  </Button>
                </div>
              ) : null}

              <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading || isLoadingCategories}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {category.admin_only && " (Admin Only)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingCategories && <p className="text-sm text-muted-foreground mt-1">Loading categories...</p>}
              {!isLoadingCategories && categories.length === 0 && !fetchError && (
                <p className="text-sm text-muted-foreground mt-1">No categories available. Please contact an admin.</p>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content
              </label>
              <RichTextEditor content={content} onChange={setContent} placeholder="Write your post content here..." />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button type="submit" disabled={isLoading || !categoryId}>
              {isLoading ? "Creating..." : "Create Post"}
            </Button>

            {isLoading && <p className="text-sm text-muted-foreground">Creating post, please wait...</p>}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
