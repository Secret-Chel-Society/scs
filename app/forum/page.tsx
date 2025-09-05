"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Plus, Pin, AlertCircle, Users, TrendingUp, Star, Zap, Target, Activity, BarChart3, GamepadIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface ForumPost {
  id: string
  title: string
  content: string
  author: {
    id: string
    email: string
    gamer_tag: string
    avatar_url?: string
  }
  category: {
    id: string
    name: string
    color: string
  }
  pinned: boolean
  views: number
  like_count: number
  dislike_count: number
  comment_count: number
  created_at: string
}

interface Category {
  id: string
  name: string
  description?: string
  color: string
}

// Cache for categories to avoid repeated API calls
let categoriesCache: Category[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { session, supabase } = useSupabase()

  // Memoize default categories to prevent recreating on every render
  const defaultCategories = useMemo(
    () => [
      { id: "1", name: "General", description: "General discussions", color: "#3b82f6" },
      { id: "2", name: "Announcements", description: "Important announcements", color: "#ef4444" },
    ],
    [],
  )

  // Fetch categories with caching
  const fetchCategories = useCallback(async () => {
    // Check cache first
    const now = Date.now()
    if (categoriesCache && now - cacheTimestamp < CACHE_DURATION) {
      setCategories(categoriesCache)
      return
    }

    try {
      const response = await fetch("/api/forum/categories")

      if (response.ok) {
        const data = await response.json()
        if (data.categories && Array.isArray(data.categories)) {
          categoriesCache = data.categories
          cacheTimestamp = now
          setCategories(data.categories)
          return
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }

    // Fallback to default categories
    setCategories(defaultCategories)
  }, [defaultCategories])

  // Fetch posts with debouncing
  const fetchPosts = useCallback(async (categoryId: string) => {
    setIsLoadingPosts(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        category: categoryId,
        limit: "15",
      })

      const response = await fetch(`/api/forum/posts?${params}`)

      if (response.ok) {
        const data = await response.json()
        console.log("Forum posts API response:", data) // Debug log
        if (data.posts && Array.isArray(data.posts)) {
          // Debug each post's author data
          data.posts.forEach((post: any, index: number) => {
            console.log(`Post ${index + 1} author:`, post.author)
          })
          setPosts(data.posts)
        } else {
          setPosts([])
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to load posts. Please try again.")
      setPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchCategories()
      await fetchPosts("all")
      setIsLoading(false)
    }

    initializeData()
  }, [fetchCategories, fetchPosts])

  // Handle category change with debouncing
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        fetchPosts(selectedCategory)
      }, 100) // Small debounce to prevent rapid API calls

      return () => clearTimeout(timeoutId)
    }
  }, [selectedCategory, isLoading, fetchPosts])

  const handleCreatePost = useCallback(() => {
    if (!session) {
      router.push("/login")
      return
    }
    router.push("/forum/create")
  }, [session, router])

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      if (categoryId !== selectedCategory) {
        setSelectedCategory(categoryId)
      }
    },
    [selectedCategory],
  )

  // Helper function to get display name
  const getDisplayName = (author: any) => {
    console.log("Getting display name for author:", author) // Debug log

    if (!author) {
      return "Unknown User"
    }

    // Try gamer_tag first, then email, then fallback
    if (author.gamer_tag && author.gamer_tag.trim() !== "") {
      return author.gamer_tag
    }

    if (author.email) {
      // Extract username from email
      return author.email.split("@")[0]
    }

    return "Unknown User"
  }

  // Helper function to get avatar fallback
  const getAvatarFallback = (author: any) => {
    const displayName = getDisplayName(author)
    return displayName.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-600 mx-auto mb-4"></div>
            <h1 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">Loading Forum</h1>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Preparing community discussions...</p>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
      {/* Hero Header Section */}
      <div className="clean-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="clean-title mb-6">
              SCS Forum
            </h1>
            <p className="clean-subtitle mb-8">
              Discuss hockey strategies, connect with the community, and share your insights
            </p>
            
            {/* Forum Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
              <div className="clean-stat-item">
                <div className="clean-icon-container mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {posts.length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                  Posts
                </div>
              </div>
              
              <div className="clean-stat-item">
                <div className="clean-icon-container-emerald mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  Active
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                  Community
                </div>
              </div>
              
              <div className="clean-stat-item">
                <div className="clean-icon-container-indigo mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  Growing
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">
                  Discussions
                </div>
              </div>
              
              <div className="clean-stat-item">
                <div className="clean-icon-container-red mb-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  Featured
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
                  Content
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header Actions */}
          <Card className="clean-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Community Discussions</h2>
                  <p className="text-slate-600 dark:text-slate-400">Join the conversation and share your thoughts</p>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  className="clean-button flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="clean-card border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="clean-icon-container-red">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-red-800 dark:text-red-200">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchPosts(selectedCategory)} 
                  className="ml-auto clean-button-outline"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Categories and Posts */}
          <Card className="clean-card">
            <CardContent className="p-6">
              <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
                <TabsList className="flex flex-wrap w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg gap-2 sm:gap-3">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg min-h-[50px] sm:min-h-[60px] flex-shrink-0"
                  >
                    <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                      <Target className="h-5 w-5" />
                    </div>
                    <span className="flex-1 text-center font-medium text-sm">All Posts</span>
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg min-h-[50px] sm:min-h-[60px] flex-shrink-0"
                    >
                      <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      </div>
                      <span className="flex-1 text-center font-medium text-sm">{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-8">
                  {isLoadingPosts ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                          <CardContent className="p-6">
                            <div className="animate-pulse">
                              <div className="h-4 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded w-1/2"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                      <CardContent className="p-12 text-center">
                        <div className="p-6 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-full w-fit mx-auto mb-6">
                          <MessageSquare className="w-16 h-16 text-hockey-silver-600 dark:text-hockey-silver-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">No posts yet</h3>
                        <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">Be the first to start a discussion!</p>
                        <Button 
                          onClick={handleCreatePost}
                          className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200"
                        >
                          Create First Post
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <Card key={post.id} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  {post.pinned && (
                                    <div className="p-1 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                                      <Pin className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="border-ice-blue-200 dark:border-rink-blue-700 text-hockey-silver-800 dark:text-hockey-silver-200 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30"
                                    style={{ borderColor: post.category?.color + "40" }}
                                  >
                                    {post.category?.name}
                                  </Badge>
                                </div>

                                <Link href={`/forum/posts/${post.id}`}>
                                  <h3 className="text-xl font-semibold mb-3 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors cursor-pointer text-hockey-silver-800 dark:text-hockey-silver-200">
                                    {post.title}
                                  </h3>
                                </Link>

                                <div className="flex items-center gap-4 text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 border-2 border-ice-blue-200 dark:border-rink-blue-700">
                                      <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                                      <AvatarFallback className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white text-xs font-bold">
                                        {getAvatarFallback(post.author)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">{getDisplayName(post.author)}</span>
                                  </div>
                                  <span className="text-hockey-silver-400 dark:text-hockey-silver-500">•</span>
                                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{post.views || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{post.comment_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>{post.like_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ThumbsDown className="w-4 h-4" />
                                    <span>{post.dislike_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
