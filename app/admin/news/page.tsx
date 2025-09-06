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
import { ArrowLeft, Edit, Eye, Plus, Trash2, Newspaper, Calendar, Trophy, Star, Medal, Crown, Activity, TrendingUp, Users, Target, Zap, Shield, Database, Settings, BarChart3, Clock, Award, BookOpen, FileText, Globe, Send } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              News Management Center
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Create, edit, and manage news articles for the league. 
              Keep the community informed with engaging content, announcements, and updates.
            </p>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Newspaper className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {articles.length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Total Articles
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    {articles.filter(a => a.published).length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Published
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    {articles.filter(a => !a.published).length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Drafts
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    {articles.filter(a => a.featured).length}
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Featured
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Enhanced Navigation */}
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
          <Link href="/admin" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-300">
            Back to Admin Dashboard
          </Link>
        </div>

        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">
              News Management
            </h2>
            <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400">
              Manage all news articles, announcements, and content
            </p>
          </div>

          <Button asChild className="hockey-button hover:scale-105 transition-all duration-200">
            <Link href="/admin/news/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Article
            </Link>
          </Button>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
              Article Management
            </h3>
            <p className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl mx-auto">
              Filter and manage your news articles by status and category.
            </p>
          </div>
          
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 gap-2 p-2">
            <TabsTrigger 
              value="all" 
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold"
            >
              <Newspaper className="h-4 w-4" />
              All Articles
            </TabsTrigger>
            <TabsTrigger 
              value="published"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rink-blue-500 data-[state=active]:to-ice-blue-600 data-[state=active]:text-white hover:bg-rink-blue-200/50 dark:hover:bg-rink-blue-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Published
            </TabsTrigger>
            <TabsTrigger 
              value="draft"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white hover:bg-assist-green-200/50 dark:hover:bg-assist-green-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Drafts
            </TabsTrigger>
            <TabsTrigger 
              value="featured"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white hover:bg-goal-red-200/50 dark:hover:bg-goal-red-800/30 transition-all duration-300 flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Featured
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200">
                      News Articles
                    </CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                      {filter === "all" && "All news articles"}
                      {filter === "published" && "Published news articles"}
                      {filter === "draft" && "Draft news articles"}
                      {filter === "featured" && "Featured news articles"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : articles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20">
                        <TableRow className="border-ice-blue-200 dark:border-ice-blue-700">
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Title</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Status</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Created</TableHead>
                          <TableHead className="text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Last Updated</TableHead>
                          <TableHead className="text-center text-hockey-silver-700 dark:text-hockey-silver-300 font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article) => (
                          <TableRow 
                            key={article.id} 
                            className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 transition-all duration-300 border-hockey-silver-200 dark:border-hockey-silver-700"
                          >
                            <TableCell className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{article.title}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {article.published ? (
                                  <Badge className="bg-assist-green-100 text-assist-green-800 dark:bg-assist-green-900/30 dark:text-assist-green-300 border-assist-green-300 dark:border-assist-green-600">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-hockey-silver-300 dark:border-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Draft
                                  </Badge>
                                )}
                                {article.featured && (
                                  <Badge className="bg-goal-red-100 text-goal-red-800 dark:bg-goal-red-900/30 dark:text-goal-red-300 border-goal-red-300 dark:border-goal-red-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-hockey-silver-600 dark:text-hockey-silver-400">
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-hockey-silver-600 dark:text-hockey-silver-400">
                              {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-110 transition-all duration-200" asChild>
                                  <Link href={`/news/${article.id}`}>
                                    <Eye className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-rink-blue-100 dark:hover:bg-rink-blue-900/30 hover:scale-110 transition-all duration-200" asChild>
                                  <Link href={`/admin/news/edit/${article.id}`}>
                                    <Edit className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                                    <span className="sr-only">Edit</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-goal-red-500 hover:text-goal-red-600 hover:bg-goal-red-100 dark:hover:bg-goal-red-900/30 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleDeleteClick(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                                <Button
                                  variant={article.published ? "default" : "secondary"}
                                  size="sm"
                                  className={article.published ? "btn-ice hover:scale-105 transition-all duration-200" : "border-hockey-silver-300 dark:border-hockey-silver-600 hover:scale-105 transition-all duration-200"}
                                  onClick={() => togglePublishStatus(article.id, article.published)}
                                >
                                  {article.published ? (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="h-3 w-3 mr-1" />
                                      Publish
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant={article.featured ? "default" : "secondary"}
                                  size="sm"
                                  className={article.featured ? "btn-championship hover:scale-105 transition-all duration-200" : "border-hockey-silver-300 dark:border-hockey-silver-600 hover:scale-105 transition-all duration-200"}
                                  onClick={() => toggleFeaturedStatus(article.id, article.featured)}
                                >
                                  {article.featured ? (
                                    <>
                                      <Star className="h-3 w-3 mr-1" />
                                      Unfeature
                                    </>
                                  ) : (
                                    <>
                                      <Star className="h-3 w-3 mr-1" />
                                      Feature
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center">
                        <Newspaper className="h-8 w-8 text-hockey-silver-500 dark:text-hockey-silver-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-2">
                          No Articles Found
                        </h3>
                        <p className="text-hockey-silver-500 dark:text-hockey-silver-500">
                          No articles found matching your filter. Click "Create New Article" to add one.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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