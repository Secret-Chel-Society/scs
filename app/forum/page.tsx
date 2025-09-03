"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Plus, Pin, AlertCircle, Users, Target, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="space-y-8">
            <div className="text-center mb-12">
              <Skeleton className="h-16 w-80 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                SCS Forum
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Discuss hockey, strategies, and connect with the Secret Chel Society community
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Actions Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-white font-semibold">
                {posts.length} Active Discussions
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button 
                onClick={handleCreatePost}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Post
              </Button>
            </motion.div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-destructive/50 bg-red-500/10 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="text-red-400 font-medium">{error}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchPosts(selectedCategory)} 
                    className="ml-auto border-red-400/30 text-red-400 hover:bg-red-400/10"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Categories */}
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-8">
              <TabsTrigger 
                value="all" 
                className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
              >
                <Target className="h-5 w-5 mr-2" />
                All Posts
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="py-3 text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg text-white/70 hover:text-white"
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-8">
              {isLoadingPosts ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6">
                          <div className="animate-pulse">
                            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-white/20 rounded w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/20">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-6 text-white/50" />
                      <h3 className="text-2xl font-semibold text-white mb-3">No posts yet</h3>
                      <p className="text-white/70 mb-6 text-lg">Be the first to start a discussion!</p>
                      <Button 
                        onClick={handleCreatePost}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 text-white rounded-xl"
                      >
                        Create First Post
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="group"
                    >
                      <Card className="bg-white/5 backdrop-blur-sm border-white/20 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                {post.pinned && (
                                  <div className="flex items-center gap-2">
                                    <Pin className="w-5 h-5 text-yellow-400" />
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                      Pinned
                                    </Badge>
                                  </div>
                                )}
                                <Badge
                                  variant="secondary"
                                  style={{ backgroundColor: post.category?.color + "20", color: post.category?.color }}
                                  className="border-0"
                                >
                                  {post.category?.name}
                                </Badge>
                              </div>

                              <Link href={`/forum/posts/${post.id}`}>
                                <h3 className="text-xl font-semibold mb-3 hover:text-primary transition-colors cursor-pointer text-white group-hover:text-primary">
                                  {post.title}
                                </h3>
                              </Link>

                              <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-7 h-7 border-2 border-white/20">
                                    <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                      {getAvatarFallback(post.author)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{getDisplayName(post.author)}</span>
                                </div>
                                <span className="text-white/40">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 text-sm text-white/60">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{post.comment_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ThumbsDown className="h-4 w-4" />
                                  <span>{post.dislike_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
