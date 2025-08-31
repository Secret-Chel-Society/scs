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
import { ArrowLeft, Edit, Eye, Plus, Trash2, FileText, Activity, Zap, Settings } from "lucide-react"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading news management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                News Management
              </h1>
              <p className="text-white/70 mt-2">Create, edit, and manage news articles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Action Button */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                <Link href="/admin/news/create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Article
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Content */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              News Articles
            </CardTitle>
            <CardDescription className="text-white/70">
              Manage all news articles and their publication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800/50 border border-white/20">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">All Articles</TabsTrigger>
                <TabsTrigger value="published" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Published</TabsTrigger>
                <TabsTrigger value="draft" className="text-white data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">Drafts</TabsTrigger>
                <TabsTrigger value="featured" className="text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Featured</TabsTrigger>
              </TabsList>

              <TabsContent value={filter}>
                {loading ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-white/70">Loading articles...</p>
                    </div>
                  </div>
                ) : articles.length > 0 ? (
                  <div className="rounded-md border border-white/20 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-white/70">Title</TableHead>
                          <TableHead className="text-white/70">Status</TableHead>
                          <TableHead className="text-white/70">Created</TableHead>
                          <TableHead className="text-white/70">Last Updated</TableHead>
                          <TableHead className="text-center text-white/70">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article) => (
                          <TableRow key={article.id} className="border-white/20 hover:bg-white/5 transition-all duration-200">
                            <TableCell className="font-medium text-white">{article.title}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {article.published ? (
                                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Published</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">Draft</Badge>
                                )}
                                {article.featured && <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">Featured</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-white/70">
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-white/70">
                              {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/20 text-white hover:bg-white/10" asChild>
                                  <Link href={`/news/${article.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/20 text-blue-400 hover:bg-blue-500/10" asChild>
                                  <Link href={`/admin/news/edit/${article.id}`}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-white/20 text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleDeleteClick(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                                <Button
                                  variant={article.published ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => togglePublishStatus(article.id, article.published)}
                                  className={article.published 
                                    ? "bg-red-500 hover:bg-red-600 text-white" 
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                  }
                                >
                                  {article.published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant={article.featured ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => toggleFeaturedStatus(article.id, article.featured)}
                                  className={article.featured 
                                    ? "bg-purple-500 hover:bg-purple-600 text-white" 
                                    : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30"
                                  }
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
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                        <Settings className="h-8 w-8 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-white/50 mb-2">No articles found</p>
                    <p className="text-white/30 text-sm">Click "Create New Article" to add one.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
