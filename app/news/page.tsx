"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

export default function NewsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })

        if (error) throw error
        setNews(data || [])
      } catch (error: any) {
        toast({
          title: "Error loading news",
          description: error.message || "Failed to load news articles.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [supabase, toast])

  // Filter news based on search query
  const filteredNews = news.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCardSize = (index: number) => {
    // Create varied card sizes for masonry effect
    const patterns = [
      "col-span-2 row-span-2", // Large
      "col-span-1 row-span-1", // Small
      "col-span-1 row-span-1", // Small
      "col-span-2 row-span-1", // Wide
      "col-span-1 row-span-2", // Tall
      "col-span-1 row-span-1", // Small
    ]
    return patterns[index % patterns.length]
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">MGHL News</h1>
              <p className="text-gray-400">Stay up to date with the latest MGHL news and announcements</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm bg-gray-900 border-gray-700 text-white"
              />
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800"
              >
                <Link href="/news/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  View Trades
                </Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className={`${getCardSize(i)} rounded-lg`} />
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`${getCardSize(index)} relative overflow-hidden rounded-lg cursor-pointer group`}
                >
                  <Link href={`/news/${item.id}`} className="block h-full">
                    <div className="relative h-full">
                      {item.image_url ? (
                        <Image
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
                      )}

                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                      {/* Content overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-green-500 text-black text-xs font-bold uppercase tracking-wider rounded">
                            MGHL
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-3">{item.title}</h3>
                        <p className="text-gray-300 text-sm">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-white mb-2">No News Found</h2>
              <p className="text-gray-400">
                {searchQuery
                  ? "No articles match your search. Try different keywords."
                  : "There are no news articles available at this time."}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
