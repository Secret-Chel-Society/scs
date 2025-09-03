"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Plus, 
  Pin, 
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Users,
  TrendingUp,
  Star,
  Crown,
  Medal,
  Shield,
  Gamepad2,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Coins,
  Gift,
  Heart,
  Flame,
  Lightning,
  UserPlus,
  UserCheck,
  UserX,
  ExternalLink,
  Share2,
  Bookmark,
  MessageCircle,
  Zap
} from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
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

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      const matchesCategory = selectedCategory === "all" || post.category.id === selectedCategory
      const matchesSearch = searchTerm === "" || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.gamer_tag.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesCategory && matchesSearch
    })

    // Sort posts
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case "created_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "views":
          aValue = a.views
          bValue = b.views
          break
        case "like_count":
          aValue = a.like_count
          bValue = b.like_count
          break
        case "comment_count":
          aValue = a.comment_count
          bValue = b.comment_count
          break
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [posts, selectedCategory, searchTerm, sortBy, sortOrder])

  // Fetch posts with debouncing
  const fetchPosts = useCallback(async (categoryId: string) => {
    setIsLoadingPosts(true)
    setError(null)

    try {
      const response = await fetch(`/api/forum/posts?category=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts)
        } else {
          setPosts([])
        }
      } else {
        setError("Failed to fetch posts")
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to fetch posts")
      setPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
    fetchPosts(categoryId)
  }, [fetchPosts])

  // Handle create post
  const handleCreatePost = useCallback(() => {
    router.push("/forum/create")
  }, [router])

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
    fetchPosts(selectedCategory)
    setIsLoading(false)
  }, [fetchCategories, fetchPosts, selectedCategory])

  // Helper function to get display name
  const getDisplayName = (author: any) => {
    if (!author) return "Unknown User"
    return author.gamer_tag || author.email?.split("@")[0] || "Unknown User"
  }

  // Helper function to get avatar fallback
  const getAvatarFallback = (author: any) => {
    const displayName = getDisplayName(author)
    return displayName.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-blue/20 via-hockey-purple/20 to-hockey-blue/20 border-b border-hockey-blue/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-blue/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-blue/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-purple/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">SCS Forum</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discuss, share, and connect with the Secret Chel Society community. 
              Share strategies, discuss matches, and build lasting friendships.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-blue to-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Community Discussions</h2>
            <p className="text-muted-foreground">Join the conversation with fellow SCS members</p>
          </div>
          <Button className="btn-championship" onClick={handleCreatePost}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts, authors, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/80 border-border/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-background/80 border-border/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="like_count">Likes</SelectItem>
                  <SelectItem value="comment_count">Comments</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="bg-background/80 border-border/50"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive mb-6">
            <CardContent className="p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-destructive">{error}</span>
              <Button variant="outline" size="sm" onClick={() => fetchPosts(selectedCategory)} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mb-8">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-blue data-[state=active]:to-hockey-purple">
              All Posts
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-blue data-[state=active]:to-hockey-purple">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoadingPosts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="enhanced-card">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedPosts.length === 0 ? (
              <Card className="enhanced-card">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Try adjusting your search terms or filters." : "Be the first to start a discussion!"}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")} className="mr-2">
                      Clear Search
                    </Button>
                  )}
                  <Button onClick={handleCreatePost}>Create First Post</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedPosts.map((post) => (
                  <Card key={post.id} className="enhanced-card hover:scale-[1.02] transition-transform duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {post.pinned && <Pin className="w-4 h-4 text-hockey-gold" />}
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: post.category?.color + "20", color: post.category?.color }}
                              className="border border-current/20"
                            >
                              {post.category?.name}
                            </Badge>
                          </div>

                          <Link href={`/forum/posts/${post.id}`}>
                            <h3 className="text-xl font-semibold mb-2 hover:text-hockey-blue transition-colors cursor-pointer">
                              {post.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{getAvatarFallback(post.author)}</AvatarFallback>
                              </Avatar>
                              <span>{getDisplayName(post.author)}</span>
                            </div>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
      </div>
    </div>
  )
}
