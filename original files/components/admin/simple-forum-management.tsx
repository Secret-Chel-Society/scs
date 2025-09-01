"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Users,
  Pin,
  Plus,
  Eye,
  Shield,
  TrendingUp,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

interface ForumCategory {
  id: string
  name: string
  description: string
  color: string
  admin_only: boolean
  created_at?: string
}

interface ForumPost {
  id: string
  title: string
  content: string
  author_id: string
  category_id: string
  pinned: boolean
  created_at: string
  updated_at: string
  view_count: number
  author?: {
    gamer_tag: string
    email: string
  }
  category?: {
    name: string
    color: string
  }
  like_count?: number
  dislike_count?: number
  comment_count?: number
}

interface ForumStats {
  total_posts: number
  total_categories: number
  total_replies: number
  recent_activity: number
}

// Cache with 5-minute expiration
const CACHE_DURATION = 5 * 60 * 1000
let dataCache: {
  categories: ForumCategory[]
  posts: ForumPost[]
  timestamp: number
} | null = null

export function SimpleForumManagement() {
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [stats, setStats] = useState<ForumStats>({
    total_posts: 0,
    total_categories: 0,
    total_replies: 0,
    recent_activity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    admin_only: false,
  })
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  // Rate limiting protection
  const lastRequestTime = useRef<number>(0)
  const requestCount = useRef<number>(0)
  const isLoadingRef = useRef<boolean>(false)

  const checkRateLimit = useCallback(() => {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current

    // Reset counter if more than 1 minute has passed
    if (timeSinceLastRequest > 60000) {
      requestCount.current = 0
    }

    // Allow max 5 requests per minute
    if (requestCount.current >= 5 && timeSinceLastRequest < 60000) {
      setRateLimited(true)
      return false
    }

    requestCount.current++
    lastRequestTime.current = now
    return true
  }, [])

  const loadForumData = useCallback(
    async (forceRefresh = false) => {
      // Prevent multiple simultaneous requests
      if (isLoadingRef.current) {
        console.log("Request already in progress, skipping...")
        return
      }

      // Check cache first
      if (!forceRefresh && dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION) {
        console.log("Using cached data")
        setCategories(dataCache.categories)
        setPosts(dataCache.posts)

        // Calculate stats from cached data
        const statsData: ForumStats = {
          total_posts: dataCache.posts.length,
          total_categories: dataCache.categories.length,
          total_replies: dataCache.posts.reduce((sum: number, post: ForumPost) => sum + (post.comment_count || 0), 0),
          recent_activity: dataCache.posts.filter(
            (post: ForumPost) => new Date(post.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
        }
        setStats(statsData)
        setLoading(false)
        setError(null)
        setRateLimited(false)
        return
      }

      // Check rate limit
      if (!checkRateLimit()) {
        console.log("Rate limited, using fallback data")
        return
      }

      try {
        setLoading(true)
        setError(null)
        setRateLimited(false)
        isLoadingRef.current = true

        console.log("Loading forum data from API...")

        // Load categories with timeout and retry logic
        let categoriesData: ForumCategory[] = []
        try {
          const categoriesController = new AbortController()
          const categoriesTimeout = setTimeout(() => categoriesController.abort(), 10000) // 10 second timeout

          const categoriesResponse = await fetch("/api/forum/categories", {
            signal: categoriesController.signal,
          })
          clearTimeout(categoriesTimeout)

          if (categoriesResponse.status === 429) {
            setRateLimited(true)
            throw new Error("Rate limit exceeded. Please wait a moment before refreshing.")
          }

          if (categoriesResponse.ok) {
            const categoriesResult = await categoriesResponse.json()
            categoriesData = Array.isArray(categoriesResult.categories) ? categoriesResult.categories : []
          }
        } catch (err) {
          console.warn("Categories API error:", err)
          if (err instanceof Error && err.message.includes("Rate limit")) {
            throw err
          }
        }

        // Load posts with timeout and retry logic
        let postsData: ForumPost[] = []
        try {
          const postsController = new AbortController()
          const postsTimeout = setTimeout(() => postsController.abort(), 10000) // 10 second timeout

          const postsResponse = await fetch("/api/forum/posts?limit=20", {
            signal: postsController.signal,
          })
          clearTimeout(postsTimeout)

          if (postsResponse.status === 429) {
            setRateLimited(true)
            throw new Error("Rate limit exceeded. Please wait a moment before refreshing.")
          }

          if (postsResponse.ok) {
            const postsResult = await postsResponse.json()
            postsData = Array.isArray(postsResult.posts) ? postsResult.posts : []
          }
        } catch (err) {
          console.warn("Posts API error:", err)
          if (err instanceof Error && err.message.includes("Rate limit")) {
            throw err
          }
        }

        console.log("Loaded categories:", categoriesData.length)
        console.log("Loaded posts:", postsData.length)

        // Update cache
        dataCache = {
          categories: categoriesData,
          posts: postsData,
          timestamp: Date.now(),
        }

        setCategories(categoriesData)
        setPosts(postsData)

        // Calculate stats from the loaded data
        const statsData: ForumStats = {
          total_posts: postsData.length,
          total_categories: categoriesData.length,
          total_replies: postsData.reduce((sum: number, post: ForumPost) => sum + (post.comment_count || 0), 0),
          recent_activity: postsData.filter(
            (post: ForumPost) => new Date(post.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
        }
        setStats(statsData)

        console.log("Forum stats:", statsData)
      } catch (error) {
        console.error("Error loading forum data:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load forum data"
        setError(errorMessage)

        if (errorMessage.includes("Rate limit")) {
          setRateLimited(true)
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment before refreshing.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to load forum data. Using cached data if available.",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
        isLoadingRef.current = false
      }
    },
    [checkRateLimit],
  )

  // Load data on mount only
  useEffect(() => {
    loadForumData()
  }, []) // Remove loadForumData from dependencies to prevent loops

  const handleCreateCategory = async () => {
    if (!checkRateLimit()) {
      toast({
        title: "Rate Limited",
        description: "Please wait before making another request.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/forum/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      })

      if (response.status === 429) {
        setRateLimited(true)
        throw new Error("Rate limit exceeded")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Category created successfully",
      })
      setCategoryForm({ name: "", description: "", color: "#3b82f6", admin_only: false })
      setCategoryDialogOpen(false)

      // Clear cache and reload
      dataCache = null
      setTimeout(() => loadForumData(true), 1000) // Wait 1 second before reloading
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = useCallback(() => {
    if (rateLimited) {
      toast({
        title: "Rate Limited",
        description: "Please wait before refreshing again.",
        variant: "destructive",
      })
      return
    }

    dataCache = null // Clear cache
    loadForumData(true)
  }, [loadForumData, rateLimited])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author?.gamer_tag || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || post.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading && categories.length === 0 && posts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading forum management...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rate Limit Warning */}
      {rateLimited && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Rate Limited</AlertTitle>
          <AlertDescription>
            Too many requests have been made. Please wait a few minutes before refreshing or making changes. Using
            cached data where available.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && !rateLimited && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh} disabled={rateLimited}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_posts}</div>
            <p className="text-xs text-muted-foreground">Forum posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_categories}</div>
            <p className="text-xs text-muted-foreground">Forum categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_replies}</div>
            <p className="text-xs text-muted-foreground">Comments & replies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_activity}</div>
            <p className="text-xs text-muted-foreground">Posts this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Forum Overview</h3>
            <Button variant="outline" onClick={handleRefresh} disabled={loading || rateLimited}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Latest forum activity</CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No posts yet</p>
                ) : (
                  <div className="space-y-3">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {post.author?.gamer_tag || "Unknown"} • {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                          <Badge variant="outline" className="text-xs">
                            {post.view_count || 0} views
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forum Categories</CardTitle>
                <CardDescription>Available discussion categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No categories yet</p>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || "#3b82f6" }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                          {category.admin_only && <Badge variant="secondary">Admin</Badge>}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {posts.filter((p) => p.category_id === category.id).length} posts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Posts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Forum Posts ({filteredPosts.length})</CardTitle>
              <CardDescription>
                Manage and moderate forum posts
                {rateLimited && " (Limited functionality due to rate limiting)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts found</p>
                  {searchQuery ? (
                    <p className="text-sm">Try adjusting your search or filters</p>
                  ) : (
                    <p className="text-sm">Posts will appear here when users create them</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {post.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                            <span className="truncate max-w-[200px]">{post.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{post.author?.gamer_tag || "Unknown"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: post.category?.color || "#3b82f6" }}
                            />
                            <Badge variant="outline">{post.category?.name || "Unknown"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <div>{post.view_count || 0} views</div>
                            <div>{post.comment_count || 0} replies</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {post.pinned ? (
                            <Badge variant="secondary">Pinned</Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/forum/posts/${post.id}`, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Forum Categories</h3>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={rateLimited}
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name: "", description: "", color: "#3b82f6", admin_only: false })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription>Create a new forum category</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Category description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="admin-only"
                      checked={categoryForm.admin_only}
                      onCheckedChange={(checked) => setCategoryForm((prev) => ({ ...prev, admin_only: checked }))}
                    />
                    <Label htmlFor="admin-only">Admin Only</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateCategory} disabled={!categoryForm.name.trim() || rateLimited}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No categories found</p>
                <p className="text-sm text-muted-foreground">Create your first forum category to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                        />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {category.name}
                            {category.admin_only && <Badge variant="secondary">Admin Only</Badge>}
                          </CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Posts: {posts.filter((p) => p.category_id === category.id).length}</span>
                      {category.created_at && (
                        <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
