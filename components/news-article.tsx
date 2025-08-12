"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import DOMPurify from "dompurify"

interface NewsArticleProps {
  article: {
    id: string
    title: string
    content: string
    image_url?: string
    created_at: string
    updated_at: string
    author?: {
      id: string
      email: string
      gamer_tag_id?: string
    }
    published: boolean
    featured: boolean
  }
  isPreview?: boolean
}

export default function NewsArticle({ article, isPreview = false }: NewsArticleProps) {
  const { title, content, image_url, created_at, updated_at, author, published, featured } = article

  // Format the date
  const formattedDate = formatDistanceToNow(new Date(created_at), { addSuffix: true })

  // Get author initials for avatar fallback
  const getAuthorInitials = () => {
    if (!author?.email) return "MG"
    return author.email.substring(0, 2).toUpperCase()
  }

  // Sanitize HTML content to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(content)

  return (
    <Card className={isPreview ? "border-dashed border-yellow-500" : ""}>
      {isPreview && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          Preview Mode - This article is not published
        </div>
      )}

      {image_url && (
        <div className="relative w-full h-64 sm:h-80 md:h-96">
          <Image src={image_url || "/placeholder.svg"} alt={title} fill className="object-cover" priority />
        </div>
      )}

      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <div className="flex gap-2">
              {featured && <Badge variant="default">Featured</Badge>}
              {!published && <Badge variant="outline">Draft</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${author?.gamer_tag_id || author?.email || "MG"}`}
              />
              <AvatarFallback>{getAuthorInitials()}</AvatarFallback>
            </Avatar>
            <span>{author?.gamer_tag_id || author?.email || "MGHL Staff"}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div
          className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </CardContent>
    </Card>
  )
}
