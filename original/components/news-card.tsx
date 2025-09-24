"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  const truncatedContent = stripHtmlAndTruncate(news.content, 150)

  // Format date
  const formattedDate = formatDistanceToNow(new Date(news.created_at), { addSuffix: true })

  return (
    <>
      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="relative overflow-hidden h-80 cursor-pointer group" onClick={() => setIsOpen(true)}>
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={news.image_url || "/placeholder.svg?height=320&width=400&query=hockey news"}
              alt={news.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
            {/* Category Badge */}
            <div className="self-start">
              <span className="bg-green-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider">MGHL</span>
            </div>

            {/* Title and Date */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold leading-tight line-clamp-3 group-hover:text-green-400 transition-colors">
                {news.title}
              </h3>
              <p className="text-sm text-gray-300 uppercase tracking-wide">
                {new Date(news.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">{news.title}</DialogTitle>
            <DialogDescription className="text-gray-400">{formattedDate}</DialogDescription>
          </DialogHeader>

          {news.image_url && (
            <div className="relative h-64 w-full my-4">
              <Image
                src={news.image_url || "/placeholder.svg"}
                alt={news.title}
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            </div>
          )}

          <div className="space-y-4">
            <div
              className="prose prose-sm max-w-none text-gray-300 prose-headings:text-white prose-strong:text-white"
              dangerouslySetInnerHTML={{
                __html: typeof window !== "undefined" ? DOMPurify.sanitize(news.content) : news.content,
              }}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Link href={`/news/${news.id}`} className="text-blue-400 hover:underline">
              View full article
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
