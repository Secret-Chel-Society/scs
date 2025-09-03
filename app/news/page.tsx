"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Search, Newspaper, Clock, Eye, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-xl">
                <Newspaper className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                SCS News
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Stay up to date with the latest SCS news, announcements, and community updates
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-primary to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Search and Actions Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm rounded-xl"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-3 px-6 py-3 border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 hover:border-primary/50 rounded-xl backdrop-blur-sm"
              >
                <Link href="/news/trades">
                  <ArrowLeftRight className="h-5 w-5" />
                  View Trades
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* News Count Display */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-white font-semibold">
                {loading ? "Loading..." : `${filteredNews.length} Articles Found`}
              </span>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Skeleton className={`${getCardSize(i)} rounded-2xl bg-white/10`} />
                </motion.div>
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`${getCardSize(index)} relative overflow-hidden rounded-2xl cursor-pointer group`}
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
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600" />
                      )}

                      {/* Enhanced Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 group-hover:via-black/30 group-hover:to-black/10 transition-all duration-300" />

                      {/* Enhanced Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="mb-3">
                          <Badge className="px-3 py-1 bg-primary/90 text-white text-xs font-bold uppercase tracking-wider rounded-full border-0">
                            SCS
                          </Badge>
                        </div>
                        
                        <h3 className="text-white font-bold text-lg leading-tight mb-3 line-clamp-3 group-hover:text-primary transition-colors duration-300">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-white/80 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
                  <Search className="h-16 w-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No News Found</h3>
                  <p className="text-white/70">
                    {searchQuery
                      ? "No articles match your search. Try different keywords."
                      : "There are no news articles available at this time."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
