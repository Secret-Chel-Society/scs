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

export default function AHLNewsPage() {
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
          .from("ahl_news")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })

        if (error) {
          // Fallback to mock data if ahl_news table doesn't exist yet
          console.warn("AHL news table not found, using mock data:", error)
          setNews([
            {
              id: "1",
              title: "AHL Season Kicks Off with Exciting Matchups",
              content: "The American Hockey League season has begun with several thrilling games...",
              published: true,
              featured: true,
              image_url:
                "https://cewrogcukeebjkpzsthw.supabase.co/storage/v1/object/public/media/photos/general/NEW_AHL_LOGO_FINAL2.webp",
              excerpt: "AHL season begins with exciting matchups across all divisions",
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              title: "Top AHL Prospects Making Waves",
              content: "Several young players are showing exceptional promise in the AHL...",
              published: true,
              featured: false,
              image_url: null,
              excerpt: "Young talent shining in the American Hockey League",
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
          ])
        } else {
          setNews(data || [])
        }
      } catch (error: any) {
        toast({
          title: "Error loading AHL news",
          description: error.message || "Failed to load AHL news articles.",
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
    <div className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 opacity-5 bg-center bg-no-repeat bg-contain pointer-events-none"
        style={{
          backgroundImage:
            "url('https://cewrogcukeebjkpzsthw.supabase.co/storage/v1/object/public/media/photos/general/NEW_AHL_LOGO_FINAL2.webp')",
        }}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">AHL News</h1>
              <p className="text-gray-400">
                Stay up to date with the latest American Hockey League news and announcements
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Input
                placeholder="Search AHL news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm bg-gray-900 border-gray-700 text-white"
              />
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
              >
                <Link href="/ahl/news/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  View AHL Trades
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
                  <Link href={`/ahl/news/${item.id}`} className="block h-full">
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
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-yellow-700" />
                      )}

                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                      {/* Content overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded">
                            AHL
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
              <h2 className="text-xl font-semibold text-white mb-2">No AHL News Found</h2>
              <p className="text-gray-400">
                {searchQuery
                  ? "No AHL articles match your search. Try different keywords."
                  : "There are no AHL news articles available at this time."}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
