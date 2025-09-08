"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Search, Newspaper, Clock, TrendingUp, Star, Zap, Users, Target } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              SCS News
            </h1>
            <p className="hockey-subtitle mb-8">
              Stay up to date with the latest SCS news, announcements, and league updates
            </p>
            
            {/* News Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Newspaper className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  {news.length}
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Articles
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Latest
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Updates
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  League
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  News
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Real-time
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Search and Navigation Section */}
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Search & Navigation
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Find specific articles or browse different news categories
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-hockey-silver-400" />
                    <Input
                      placeholder="Search news articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="hockey-search pl-10 bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-rink-blue-900/20 border-ice-blue-200/50 dark:border-rink-blue-700/50 text-hockey-silver-800 dark:text-hockey-silver-200 placeholder:text-hockey-silver-400 dark:placeholder:text-hockey-silver-500"
                    />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  asChild
                  className="hockey-button border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Link href="/news/trades">
                    <ArrowLeftRight className="h-4 w-4" />
                    View Trades
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* News Grid Section */}
          <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Latest News Articles
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {searchQuery ? `Search results for "${searchQuery}"` : "Browse all published articles"}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className={`${getCardSize(i)} rounded-xl bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30`} />
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
                      className={`${getCardSize(index)} relative overflow-hidden rounded-xl cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl`}
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
                            <div className="w-full h-full bg-gradient-to-br from-ice-blue-600 to-rink-blue-700" />
                          )}

                          {/* Enhanced overlay with hockey theme */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300" />

                          {/* Content overlay */}
                          <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <div className="mb-3">
                              <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">
                                SCS
                              </Badge>
                            </div>
                            <h3 className="text-white font-bold text-lg leading-tight mb-3 line-clamp-3 group-hover:text-ice-blue-200 transition-colors duration-200">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 text-hockey-silver-300 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-6 bg-gradient-to-r from-hockey-silver-500/20 to-hockey-silver-500/20 rounded-full w-fit mx-auto mb-6">
                    <Newspaper className="h-16 w-16 text-hockey-silver-600 dark:text-hockey-silver-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">
                    {searchQuery ? "No Articles Found" : "No News Available"}
                  </h2>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400 max-w-md mx-auto">
                    {searchQuery
                      ? "No articles match your search. Try different keywords or browse all articles."
                      : "There are no news articles available at this time. Check back soon for updates!"}
                  </p>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
