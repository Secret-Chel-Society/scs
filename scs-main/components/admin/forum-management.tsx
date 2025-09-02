"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { MessageSquare, Users, Pin, Trash2, Plus, Edit, Eye, Shield, TrendingUp, Search } from "lucide-react"

interface ForumCategory {
  id: string
  name: string
  description: string
  admin_only: boolean
  created_at: string
  post_count?: number
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
  author?: {
    gamer_tag: string
    email: string
  }
  category?: {
    name: string
  }
  reply_count?: number
}

interface ForumStats {
  total_posts: number
  total_categories: number
  total_replies: number
  recent_activity: number
}

export function ForumManagement() {
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [stats, setStats] = useState<ForumStats>({
    total_posts: 0,
    total_categories: 0,
    total_replies: 0,
    recent_activity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    admin_only: false,
  })
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  useEffect(() => {
    loadForumData()
  }, [])

  const loadForumData = async () => {
    try {
      setLoading(true)

      // Load categories
      try {
        const categoriesRes = await fetch("/api/forum/categories")
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } else {
          console.warn("Categories API not available")
          setCategories([])
        }
      } catch (error) {
        console.warn("Error loading categories:", error)
        setCategories([])
      }

      // Load posts
      try {
        const postsRes = await fetch("/api/forum/posts")
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(Array.isArray(postsData) ? postsData : [])
        } else {
          console.warn("Posts API not available")
          setPosts([])
        }
      } catch (error) {
        console.warn("Error loading posts:", error)
        setPosts([])
      }

      // Calculate stats after data is loaded
      setTimeout(() => {
        const currentPosts = posts.length > 0 ? posts : []
        const currentCategories = categories.length > 0 ? categories : []

        const statsData: ForumStats = {
          total_posts: currentPosts.length,
          total_categories: currentCategories.length,
          total_replies: currentPosts.reduce((sum, post) => sum + (post.reply_count || 0), 0),
          recent_activity: currentPosts.filter(
            (post) => new Date(post.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
        }
        setStats(statsData)
      }, 100)
    } catch (error) {
      console.error("Error loading forum data:", error)
      toast({
        title: "Error",
        description: "Failed to load forum data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      const response = await fetch("/api/forum/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category created successfully",
        })
        setCategoryForm({ name: "", description: "", admin_only: false })
        setCategoryDialogOpen(false)
        loadForumData()
      } else {
        throw new Error("Failed to create category")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category. API may not be available.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/forum/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
        setEditingCategory(null)
        setCategoryForm({ name: "", description: "", admin_only: false })
        setCategoryDialogOpen(false)
        loadForumData()
      } else {
        throw new Error("Failed to update category")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/forum/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        loadForumData()
      } else {
        throw new Error("Failed to delete category")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const handlePinPost = async (postId: string, pinned: boolean) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Post ${pinned ? "pinned" : "unpinned"} successfully`,
        })
        loadForumData()
      } else {
        throw new Error("Failed to update post")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        loadForumData()
      } else {
        throw new Error("Failed to delete post")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const openEditCategory = (category: ForumCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
      admin_only: category.admin_only,
    })
    setCategoryDialogOpen(true)
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author?.gamer_tag || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || post.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading forum management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_posts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_categories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_replies}</div>
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

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

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
              <CardDescription>Manage and moderate forum posts</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts found</p>
                  <p className="text-sm">Posts will appear here when users create them</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Replies</TableHead>
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
                          <Badge variant="outline">{post.category?.name || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>{post.reply_count || 0}</TableCell>
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
                            <Button variant="outline" size="sm" onClick={() => handlePinPost(post.id, !post.pinned)}>
                              <Pin className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name: "", description: "", admin_only: false })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? "Update the category details" : "Create a new forum category"}
                  </DialogDescription>
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
                  <Button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    disabled={!categoryForm.name.trim()}
                  >
                    {editingCategory ? "Update" : "Create"}
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
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {category.name}
                          {category.admin_only && <Badge variant="secondary">Admin Only</Badge>}
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this category? All posts in this category will also be
                                deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Posts: {category.post_count || 0}</span>
                      <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
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
