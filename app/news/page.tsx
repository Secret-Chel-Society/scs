"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Search, Newspaper, TrendingUp, Clock, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-orange-200 to-yellow-200 bg-clip-text text-transparent">
              SCS News
            </h1>
            <p className="text-xl text-orange-200 mb-8">
              Stay up to date with the latest SCS news and announcements
            </p>
          </div>

          {/* Search and Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-300" />
                <Input
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 max-w-sm bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-orange-300"
                />
              </div>
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 text-orange-200 hover:bg-orange-500/30 transition-all duration-300"
              >
                <Link href="/news/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  View Trades
                </Link>
              </Button>
            </div>
          </div>

          {/* News Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="text-3xl font-bold text-orange-200 mb-2">{news.length}</div>
              <div className="text-orange-300 flex items-center justify-center gap-2">
                <Newspaper className="h-5 w-5" />
                Total Articles
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
              <div className="text-3xl font-bold text-yellow-200 mb-2">{filteredNews.length}</div>
              <div className="text-yellow-300 flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                Filtered Results
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "500ms" }}>
              <div className="text-3xl font-bold text-red-200 mb-2">24/7</div>
              <div className="text-red-300 flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                Latest Updates
              </div>
            </div>
          </div>

          {/* News Grid */}
          <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className={`${getCardSize(i)} rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20`} />
                ))}
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                {filteredNews.map((item, index) => (
                  <div
                    key={item.id}
                    className={`${getCardSize(index)} relative overflow-hidden rounded-lg cursor-pointer group animate-slide-in`}
                    style={{ animationDelay: `${700 + index * 100}ms` }}
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
                          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-700" />
                        )}

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                        {/* Content overlay */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold uppercase tracking-wider rounded">
                              SCS
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-3">{item.title}</h3>
                          <div className="flex items-center gap-2 text-orange-300 text-sm">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                <CardContent className="text-center py-12">
                  <Newspaper className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                  <h2 className="text-xl font-semibold text-white mb-2">No News Found</h2>
                  <p className="text-orange-200">
                    {searchQuery
                      ? "No articles match your search. Try different keywords."
                      : "There are no news articles available at this time."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
