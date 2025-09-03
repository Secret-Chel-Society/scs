"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ArrowLeft, Edit, Eye, EyeOff, Clock, User, Calendar, Star, TrendingUp, Newspaper } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DOMPurify from "dompurify"

export default function NewsDetailPage() {
  const params = useParams()
  const articleId = params.id as string
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true)

        // Check if user is admin (in a real app, you would check roles)
        setIsAdmin(!!session?.user)

        const { data, error } = await supabase
          .from("news")
          .select(`
            *,
            author:author_id (
              id,
              email,
              gamer_tag_id
            )
          `)
          .eq("id", articleId)
          .single()

        if (error) throw error

        // If article is not published and user is not admin, redirect
        if (!data.published && !isAdmin) {
          toast({
            title: "Article not available",
            description: "This article is not currently available.",
            variant: "destructive",
          })
          router.push("/news")
          return
        }

        setArticle(data)
      } catch (error: any) {
        toast({
          title: "Error loading article",
          description: error.message || "Failed to load article.",
          variant: "destructive",
        })
        router.push("/news")
      } finally {
        setLoading(false)
      }
    }

    if (articleId) {
      fetchArticle()
    }
  }, [articleId, router, supabase, toast, session, isAdmin])

  const togglePublishStatus = async () => {
    if (!article || !isAdmin) return

    try {
      const { error } = await supabase.from("news").update({ published: !article.published }).eq("id", articleId)

      if (error) throw error

      setArticle({ ...article, published: !article.published })

      toast({
        title: article.published ? "Article unpublished" : "Article published",
        description: `The article has been ${article.published ? "unpublished" : "published"} successfully.`,
      })
    } catch (error: any) {
      toast({
        title: "Error updating article",
        description: error.message || "Failed to update article status.",
        variant: "destructive",
      })
    }
  }

  const getAuthorInitials = () => {
    if (!article?.author?.email) return "MG"
    return article.author.email.substring(0, 2).toUpperCase()
  }

  const sanitizedContent = article ? DOMPurify.sanitize(article.content) : ""

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <Link href="/news" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200">
              Back to News
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-xl bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 rounded-lg bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              <Skeleton className="h-6 w-1/3 rounded-lg bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
                <Skeleton className="h-4 w-full rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
                <Skeleton className="h-4 w-2/3 rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <Link href="/news" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200">
              Back to News
            </Link>
          </div>
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-full w-fit mx-auto mb-6">
              <Newspaper className="h-16 w-16 text-goal-red-600 dark:text-goal-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">Article Not Found</h1>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">The article you are looking for does not exist or has been removed.</p>
            <Button asChild className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200">
              <Link href="/news">Browse All News</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Navigation and Admin Controls */}
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                  <Link href="/news" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200 font-medium">
                    Back to News
                  </Link>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hockey-button border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200 flex items-center gap-1" 
                      onClick={togglePublishStatus}
                    >
                      {article.published ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Publish</span>
                        </>
                      )}
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hockey-button border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200 flex items-center gap-1" 
                      asChild
                    >
                      <Link href={`/admin/news/edit/${articleId}`}>
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Mode Alert */}
          {!article.published && (
            <Card className="hockey-card border-yellow-200/50 dark:border-yellow-700/50 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 mb-8">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Preview Mode - This article is not published</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Article Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left side - Image */}
            <div className="relative">
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 overflow-hidden">
                <CardContent className="p-0">
                  {article.image_url ? (
                    <div className="relative h-96 lg:h-[600px] w-full overflow-hidden">
                      <Image
                        src={article.image_url || "/placeholder.svg"}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="h-96 lg:h-[600px] w-full bg-gradient-to-br from-ice-blue-600 to-rink-blue-700 flex items-center justify-center">
                      <div className="text-center">
                        <Newspaper className="h-16 w-16 text-white/50 mx-auto mb-2" />
                        <span className="text-white/70 text-lg">No Image Available</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right side - Content */}
            <div className="space-y-6">
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">
                        SCS
                      </Badge>
                      {article.featured && (
                        <Badge className="bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {!article.published && (
                        <Badge variant="outline" className="border-hockey-silver-300 dark:border-hockey-silver-600 text-hockey-silver-700 dark:text-hockey-silver-300 px-3 py-1 text-xs font-medium rounded-lg">
                          Draft
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl lg:text-4xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 leading-tight">
                      {article.title}
                    </h1>

                    {/* Author and Date Info */}
                    <div className="flex items-center gap-3 text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                      <Avatar className="h-8 w-8 border-2 border-ice-blue-200 dark:border-rink-blue-700">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.author?.gamer_tag_id || article.author?.email || "MG"}`}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white text-xs font-bold">
                          {getAuthorInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">
                        {article.author?.gamer_tag_id || article.author?.email || "SCS Staff"}
                      </span>
                      <span className="text-hockey-silver-400 dark:text-hockey-silver-500">•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Article Content */}
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardContent className="p-6">
                  <div
                    className="prose prose-lg max-w-none prose-headings:text-hockey-silver-800 dark:prose-headings:text-hockey-silver-200 prose-strong:text-hockey-silver-800 dark:prose-strong:text-hockey-silver-200 prose-a:text-ice-blue-600 dark:prose-a:text-ice-blue-400 prose-a:no-underline hover:prose-a:underline prose-p:text-hockey-silver-700 dark:prose-p:text-hockey-silver-300 prose-li:text-hockey-silver-700 dark:prose-li:text-hockey-silver-300"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
