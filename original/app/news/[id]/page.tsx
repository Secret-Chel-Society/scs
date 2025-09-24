"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ArrowLeft, Edit, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-white" />
            <Link href="/news" className="text-gray-400 hover:text-white">
              Back to News
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-white" />
            <Link href="/news" className="text-gray-400 hover:text-white">
              Back to News
            </Link>
          </div>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
            <p className="text-gray-400 mb-6">The article you are looking for does not exist or has been removed.</p>
            <Button asChild>
              <Link href="/news">Browse All News</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-white" />
              <Link href="/news" className="text-gray-400 hover:text-white">
                Back to News
              </Link>
            </div>

            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={togglePublishStatus}>
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

                <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                  <Link href={`/admin/news/edit/${articleId}`}>
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {!article.published && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200 mb-8 rounded">
              Preview Mode - This article is not published
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left side - Image */}
            <div className="relative">
              {article.image_url ? (
                <div className="relative h-96 lg:h-[600px] w-full rounded-lg overflow-hidden">
                  <Image
                    src={article.image_url || "/placeholder.svg"}
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="h-96 lg:h-[600px] w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">No Image Available</span>
                </div>
              )}
            </div>

            {/* Right side - Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500 text-black">
                    MGHL
                  </Badge>
                  {article.featured && <Badge variant="default">Featured</Badge>}
                  {!article.published && <Badge variant="outline">Draft</Badge>}
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">{article.title}</h1>

                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.author?.gamer_tag_id || article.author?.email || "MG"}`}
                    />
                    <AvatarFallback>{getAuthorInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-white">
                    {article.author?.gamer_tag_id || article.author?.email || "MGHL Staff"}
                  </span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              <div
                className="prose prose-lg max-w-none text-gray-300 prose-headings:text-white prose-strong:text-white prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
