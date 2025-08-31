"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Plus, Pin, AlertCircle, Users, TrendingUp, Clock, Award } from "lucide-react"
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

function ForumStats({ posts, categories }: { posts: ForumPost[], categories: Category[] }) {
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0)
  const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">{posts.length}</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Total Posts
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">{totalViews}</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Eye className="h-5 w-5" />
          Total Views
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">{totalLikes}</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <ThumbsUp className="h-5 w-5" />
          Total Likes
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">{categories.length}</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Award className="h-5 w-5" />
          Categories
        </div>
      </div>
    </div>
  )
}

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="relative z-10">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-white/20 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              SCS Forum
            </h1>
            <p className="text-xl text-green-200 mb-8">
              Discuss hockey, strategies, and connect with the community
            </p>
          </div>

          {/* Forum Statistics */}
          <ForumStats posts={posts} categories={categories} />

          {/* Main Content */}
          <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                {/* Header with Create Post Button */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Community Discussions</h2>
                    <p className="text-green-200">Join the conversation and share your thoughts</p>
                  </div>
                  <Button 
                    onClick={handleCreatePost}
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-200 hover:bg-green-500/30 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>

                {/* Error Display */}
                {error && (
                  <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 mb-6">
                    <CardContent className="p-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-300" />
                      <span className="text-red-200">{error}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPosts(selectedCategory)} 
                        className="ml-auto bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Categories and Posts */}
                <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-auto bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                    <TabsTrigger 
                      value="all"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                    >
                      All Posts
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                      >
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={selectedCategory} className="mt-6">
                    {isLoadingPosts ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20">
                            <CardContent className="p-6">
                              <div className="animate-pulse">
                                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                        <CardContent className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-green-300" />
                          <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
                          <p className="text-green-200 mb-4">Be the first to start a discussion!</p>
                          <Button 
                            onClick={handleCreatePost}
                            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-200 hover:bg-green-500/30 transition-all duration-300"
                          >
                            Create First Post
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post, index) => (
                          <Card 
                            key={post.id} 
                            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 animate-slide-in"
                            style={{ animationDelay: `${600 + index * 100}ms` }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {post.pinned && <Pin className="w-4 h-4 text-yellow-400" />}
                                    <Badge
                                      className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20"
                                      style={{ backgroundColor: post.category?.color + "20", color: post.category?.color }}
                                    >
                                      {post.category?.name}
                                    </Badge>
                                  </div>

                                  <Link href={`/forum/posts/${post.id}`}>
                                    <h3 className="text-xl font-semibold mb-2 hover:text-green-300 transition-colors cursor-pointer text-white">
                                      {post.title}
                                    </h3>
                                  </Link>

                                  <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200">
                                          {getAvatarFallback(post.author)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-white">{getDisplayName(post.author)}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                  </div>

                                  <div className="flex items-center gap-6 text-sm text-white/60">
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
    </div>
  )
}
