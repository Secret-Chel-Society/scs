"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import NewsForm from "@/components/news-form"

export default function EditNewsPage() {
  const params = useParams()
  const articleId = params.id as string
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

    async function fetchArticle() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("news").select("*").eq("id", articleId).single()

        if (error) throw error
        if (!data) {
          toast({
            title: "Article not found",
            description: "The article you are trying to edit does not exist.",
            variant: "destructive",
          })
          router.push("/admin/news")
          return
        }

        setArticle(data)
      } catch (error: any) {
        toast({
          title: "Error loading article",
          description: error.message || "Failed to load article data.",
          variant: "destructive",
        })
        router.push("/admin/news")
      } finally {
        setLoading(false)
      }
    }

    if (articleId) {
      fetchArticle()
    }
  }, [articleId, router, supabase, toast, session])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/admin/news" className="text-muted-foreground hover:text-foreground">
            Back to News Management
          </Link>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/admin/news" className="text-muted-foreground hover:text-foreground">
            Back to News Management
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground">
              The article you are trying to edit does not exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/admin/news" className="text-muted-foreground hover:text-foreground">
            Back to News Management
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit News Article</CardTitle>
            <CardDescription>Edit an existing news article</CardDescription>
          </CardHeader>
          <CardContent>
            <NewsForm
              articleId={articleId}
              defaultValues={{
                title: article.title || "",
                content: article.content || "",
                published: Boolean(article.published),
                featured: Boolean(article.featured),
                image_url: article.image_url || "",
                excerpt: article.excerpt || "",
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
