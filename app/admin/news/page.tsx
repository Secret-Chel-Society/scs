"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ArrowLeft, Edit, Eye, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminNewsPage() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    // Check if user is authenticated and has admin privileges
    if (!session) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to access this page.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // In a real app, you would check for admin role here
    // For now, we'll assume the logged-in user is an admin

    fetchArticles()
  }, [session, router, toast, filter])

  async function fetchArticles() {
    try {
      setLoading(true)

      let query = supabase.from("news").select("*")

      // Apply filters
      if (filter === "published") {
        query = query.eq("published", true)
      } else if (filter === "draft") {
        query = query.eq("published", false)
      } else if (filter === "featured") {
        query = query.eq("featured", true)
      }

      // Sort by created_at in descending order
      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setArticles(data || [])
    } catch (error: any) {
      toast({
        title: "Error loading articles",
        description: error.message || "Failed to load articles.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setArticleToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!articleToDelete) return

    try {
      const { error } = await supabase.from("news").delete().eq("id", articleToDelete)

      if (error) throw error

      toast({
        title: "Article deleted",
        description: "The article has been successfully deleted.",
      })

      // Refresh the articles list
      fetchArticles()
    } catch (error: any) {
      toast({
        title: "Error deleting article",
        description: error.message || "Failed to delete article.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    }
  }

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("news").update({ published: !currentStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: currentStatus ? "Article unpublished" : "Article published",
        description: `The article has been ${currentStatus ? "unpublished" : "published"} successfully.`,
      })

      // Refresh the articles list
      fetchArticles()
    } catch (error: any) {
      toast({
        title: "Error updating article",
        description: error.message || "Failed to update article status.",
        variant: "destructive",
      })
    }
  }

  const toggleFeaturedStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("news").update({ featured: !currentStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: currentStatus ? "Article unfeatured" : "Article featured",
        description: `The article has been ${currentStatus ? "removed from" : "added to"} featured articles.`,
      })

      // Refresh the articles list
      fetchArticles()
    } catch (error: any) {
      toast({
        title: "Error updating article",
        description: error.message || "Failed to update article status.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">News Management</h1>
            <p className="text-muted-foreground">Create, edit, and manage news articles</p>
          </div>

          <Button asChild>
            <Link href="/admin/news/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Article
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">All Articles</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            <Card>
              <CardHeader>
                <CardTitle>News Articles</CardTitle>
                <CardDescription>
                  {filter === "all" && "All news articles"}
                  {filter === "published" && "Published news articles"}
                  {filter === "draft" && "Draft news articles"}
                  {filter === "featured" && "Featured news articles"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-[500px]" />
                ) : articles.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article) => (
                          <TableRow key={article.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{article.title}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {article.published ? (
                                  <Badge variant="default">Published</Badge>
                                ) : (
                                  <Badge variant="outline">Draft</Badge>
                                )}
                                {article.featured && <Badge variant="secondary">Featured</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                                  <Link href={`/news/${article.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                                  <Link href={`/admin/news/edit/${article.id}`}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteClick(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                                <Button
                                  variant={article.published ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => togglePublishStatus(article.id, article.published)}
                                >
                                  {article.published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant={article.featured ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => toggleFeaturedStatus(article.id, article.featured)}
                                >
                                  {article.featured ? "Unfeature" : "Feature"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No articles found. Click "Create New Article" to add one.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
