"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle, MessageSquare, Users, Target, Star, Zap, TrendingUp, Activity } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

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
      setFetchError(error instanceof Error ? error.message : "Unknown error occurred")
      setDebugInfo(`User role: ${userRole}, Session: ${!!session}`)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [session, supabase, userRole])

  // Fetch categories when user role changes
  useEffect(() => {
    if (userRole) {
      fetchCategories()
    }
  }, [userRole, fetchCategories])

  // Fetch user role on mount
  useEffect(() => {
    fetchUserRole()
  }, [fetchUserRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim() || !categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.from("forum_posts").insert({
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        author_id: session.user.id,
      })

      if (error) throw error

      toast({
        title: "Post Created!",
        description: "Your forum post has been published successfully.",
      })

      // Redirect to the forum
      router.push("/forum")
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error Creating Post",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <div className="p-6 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-full w-fit mx-auto mb-6">
                <AlertCircle className="h-16 w-16 text-goal-red-600 dark:text-goal-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">Authentication Required</h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">Please log in to create a forum post.</p>
              <Button asChild className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200">
                <Link href="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Create New Post
            </h1>
            <p className="hockey-subtitle mb-8">
              Share your thoughts, strategies, and insights with the SCS community
            </p>
            
            {/* Create Post Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  New
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Discussion
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Community
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Engagement
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Strategic
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Insights
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Featured
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Content
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Navigation */}
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <CardContent className="p-4">
              <Link 
                href="/forum" 
                className="inline-flex items-center gap-2 text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Forum
              </Link>
            </CardContent>
          </Card>

          {/* Create Post Form */}
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Create New Post
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Share your thoughts and start a discussion
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                    Category
                  </label>
                  {isLoadingCategories ? (
                    <div className="h-10 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-md animate-pulse"></div>
                  ) : fetchError ? (
                    <Alert className="border-goal-red-200 bg-goal-red-50 dark:bg-goal-red-950/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Loading Categories</AlertTitle>
                      <AlertDescription className="text-goal-red-800 dark:text-goal-red-200">
                        {fetchError}
                        {debugInfo && (
                          <div className="mt-2 text-xs">
                            <strong>Debug Info:</strong> {debugInfo}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-rink-blue-900/20 text-hockey-silver-800 dark:text-hockey-silver-200">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                    Title
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="hockey-search bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-rink-blue-900/20 border-ice-blue-200/50 dark:border-rink-blue-700/50 text-hockey-silver-800 dark:text-hockey-silver-200 placeholder:text-hockey-silver-400 dark:placeholder:text-hockey-silver-500"
                    required
                  />
                </div>

                {/* Content Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                    Content
                  </label>
                  <div className="border border-ice-blue-200/50 dark:border-rink-blue-700/50 rounded-md overflow-hidden">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Write your post content here..."
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/forum")}
                  className="hockey-button border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !title.trim() || !content.trim() || !categoryId}
                  className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : "Create Post"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
