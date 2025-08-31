"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink, Star, Zap } from "lucide-react"
import DOMPurify from "dompurify"

interface NewsCardProps {
  news: {
    id: string
    title: string
    content: string
    image_url: string | null
    created_at: string
  }
}

export default function NewsCard({ news }: NewsCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Update the truncatedContent calculation to strip HTML tags
  const stripHtmlAndTruncate = (html: string, maxLength: number) => {
    if (typeof window === "undefined") {
      // Server-side rendering fallback
      return html.length > maxLength ? `${html.substring(0, maxLength)}...` : html
    }

    // Client-side rendering with DOM
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = DOMPurify.sanitize(html)

    // Get the text content without HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText || ""

    // Truncate the text content
    return textContent.length > maxLength ? `${textContent.substring(0, maxLength)}...` : textContent
  }

  // Truncate content for preview
  const truncatedContent = stripHtmlAndTruncate(news.content, 120)

  // Format date
  const formattedDate = formatDistanceToNow(new Date(news.created_at), { addSuffix: true })

  return (
    <>
      <motion.div 
        whileHover={{ y: -8, scale: 1.02 }} 
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card 
          className="relative overflow-hidden h-80 cursor-pointer group bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 hover:border-blue-500/50 transition-all duration-300" 
          onClick={() => setIsOpen(true)}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={news.image_url || "/placeholder.svg?height=320&width=400&query=hockey news"}
              alt={news.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80 group-hover:via-black/40 transition-all duration-300" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
            {/* Header */}
            <div className="flex items-start justify-between">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 font-semibold">
                <Star className="h-3 w-3 mr-1" />
                SCS NEWS
              </Badge>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="h-3 w-3" />
                {new Date(news.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors duration-300">
                {news.title}
              </h3>
              <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">
                {truncatedContent}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Clock className="h-3 w-3" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-2 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-medium">Read More</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30">
                <Zap className="h-3 w-3 mr-1" />
                SCS NEWS
              </Badge>
              <span className="text-sm text-white/60">{formattedDate}</span>
            </div>
            <DialogTitle className="text-3xl font-bold text-white leading-tight">{news.title}</DialogTitle>
            <DialogDescription className="text-white/70 text-lg">
              {new Date(news.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>

          {news.image_url && (
            <div className="relative h-80 w-full my-6 rounded-lg overflow-hidden">
              <Image
                src={news.image_url || "/placeholder.svg"}
                alt={news.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          <div className="space-y-6">
            <div
              className="prose prose-lg max-w-none text-white/90 prose-headings:text-white prose-strong:text-white prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/10 prose-blockquote:border-blue-500/30"
              dangerouslySetInnerHTML={{
                __html: typeof window !== "undefined" ? DOMPurify.sanitize(news.content) : news.content,
              }}
            />
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Published {formattedDate}</span>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Link href={`/news/${news.id}`} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View Full Article
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
