"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { 
  Newspaper, 
  Crown, 
  Medal, 
  Star, 
  Target, 
  TrendingUp, 
  Zap, 
  Shield,
  Gamepad2,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Coins,
  Gift,
  Heart,
  Flame,
  Lightning,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Plus,
  Minus,
  DollarSign,
  Award,
  Trophy,
  UserPlus,
  UserCheck,
  UserX,
  ExternalLink,
  Share2,
  Bookmark,
  MessageCircle,
  ThumbsUp
} from "lucide-react"
import Link from "next/link"

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  author_avatar?: string
  category: "league" | "team" | "player" | "trade" | "award" | "general"
  tags: string[]
  published_date: string
  read_time: number
  featured_image?: string
  views: number
  likes: number
  comments: number
  is_featured: boolean
}

const categories = [
  { id: "all", name: "All News", color: "hockey-blue" },
  { id: "league", name: "League News", color: "hockey-gold" },
  { id: "team", name: "Team Updates", color: "hockey-green" },
  { id: "player", name: "Player News", color: "hockey-purple" },
  { id: "trade", name: "Trades & Moves", color: "hockey-orange" },
  { id: "award", name: "Awards & Recognition", color: "hockey-red" },
  { id: "general", name: "General", color: "hockey-silver" }
]

const mockNewsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "SCS Season 2 Kicks Off with Record-Breaking Opening Night",
    excerpt: "The Secret Chel Society's second season begins with unprecedented excitement as teams prepare for the ultimate NHL 26 showdown.",
    content: "The highly anticipated second season of the Secret Chel Society is finally here...",
    author: "SCS Staff",
    author_avatar: "/placeholder-user.jpg",
    category: "league",
    tags: ["season", "opening", "nhl26"],
    published_date: "2024-01-15T10:00:00Z",
    read_time: 5,
    featured_image: "/placeholder.svg",
    views: 1247,
    likes: 89,
    comments: 23,
    is_featured: true
  },
  {
    id: "2",
    title: "Tampa Bay Lightning Crowned Season 1 Champions",
    excerpt: "In a thrilling seven-game series, the Lightning emerged victorious to claim the inaugural SCS Cup.",
    content: "After an intense playoff run that captivated the entire SCS community...",
    author: "Hockey Insider",
    author_avatar: "/placeholder-user.jpg",
    category: "award",
    tags: ["championship", "playoffs", "tampa-bay"],
    published_date: "2024-01-10T15:30:00Z",
    read_time: 8,
    featured_image: "/placeholder.svg",
    views: 2156,
    likes: 156,
    comments: 45,
    is_featured: true
  },
  {
    id: "3",
    title: "Major Trade Alert: Star Forward Changes Teams",
    excerpt: "A blockbuster trade sends one of the league's top scorers to a new franchise, shaking up the playoff race.",
    content: "In a move that has sent shockwaves through the SCS community...",
    author: "Trade Reporter",
    author_avatar: "/placeholder-user.jpg",
    category: "trade",
    tags: ["trade", "star-player", "playoffs"],
    published_date: "2024-01-08T12:15:00Z",
    read_time: 6,
    featured_image: "/placeholder.svg",
    views: 1893,
    likes: 134,
    comments: 67,
    is_featured: false
  },
  {
    id: "4",
    title: "New Team Joins SCS: Expansion Franchise Announced",
    excerpt: "The league welcomes its newest member as an expansion team prepares to enter the competition.",
    content: "The Secret Chel Society is proud to announce the addition of...",
    author: "League Commissioner",
    author_avatar: "/placeholder-user.jpg",
    category: "league",
    tags: ["expansion", "new-team", "announcement"],
    published_date: "2024-01-05T09:45:00Z",
    read_time: 4,
    featured_image: "/placeholder.svg",
    views: 1678,
    likes: 98,
    comments: 34,
    is_featured: false
  },
  {
    id: "5",
    title: "Player Spotlight: Rising Star's Journey to the Top",
    excerpt: "An in-depth look at one of the league's most promising young talents and their path to success.",
    content: "Every season brings new stories of players who rise above...",
    author: "Player Analyst",
    author_avatar: "/placeholder-user.jpg",
    category: "player",
    tags: ["player-spotlight", "rising-star", "success-story"],
    published_date: "2024-01-03T14:20:00Z",
    read_time: 7,
    featured_image: "/placeholder.svg",
    views: 1432,
    likes: 76,
    comments: 28,
    is_featured: false
  },
  {
    id: "6",
    title: "Rule Changes Announced for Season 2",
    excerpt: "The league introduces several rule modifications aimed at improving gameplay and competitive balance.",
    content: "After careful consideration and community feedback...",
    author: "Rules Committee",
    author_avatar: "/placeholder-user.jpg",
    category: "league",
    tags: ["rules", "season-2", "improvements"],
    published_date: "2024-01-01T11:00:00Z",
    read_time: 5,
    featured_image: "/placeholder.svg",
    views: 1987,
    likes: 145,
    comments: 52,
    is_featured: false
  }
]

export default function NewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("published_date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredArticles = mockNewsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case "published_date":
        aValue = new Date(a.published_date).getTime()
        bValue = new Date(b.published_date).getTime()
        break
      case "views":
        aValue = a.views
        bValue = b.views
        break
      case "likes":
        aValue = a.likes
        bValue = b.likes
        break
      case "read_time":
        aValue = a.read_time
        bValue = b.read_time
        break
      case "title":
        aValue = a.title
        bValue = b.title
        break
      default:
        aValue = new Date(a.published_date).getTime()
        bValue = new Date(b.published_date).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const featuredArticles = sortedArticles.filter(article => article.is_featured)
  const regularArticles = sortedArticles.filter(article => !article.is_featured)

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat ? cat.color : "hockey-silver"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(dateString)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-purple/20 via-hockey-pink/20 to-hockey-purple/20 border-b border-hockey-purple/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-purple/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-purple/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-pink/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-purple to-hockey-pink rounded-xl">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">SCS News</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stay up to date with the latest news, updates, and stories from the Secret Chel Society. 
              From game results to league announcements, get all the information you need.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-purple to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* News Overview */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="enhanced-card">
            <CardHeader className="enhanced-card-header">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-hockey-purple to-hockey-pink rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>News Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-purple mb-2">{mockNewsArticles.length}</div>
                  <div className="text-sm text-muted-foreground">Total Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-pink mb-2">
                    {mockNewsArticles.filter(a => a.is_featured).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Featured Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-blue mb-2">
                    {mockNewsArticles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-green mb-2">
                    {mockNewsArticles.reduce((sum, a) => sum + a.comments, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Comments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search news articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published_date">Date</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="read_time">Read Time</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-hockey-gold" />
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300 border-hockey-gold/30">
                    <CardHeader className="enhanced-card-header">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={`bg-${getCategoryColor(article.category)} text-white`}>
                          {categories.find(c => c.id === article.category)?.name}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTimeAgo(article.published_date)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-hockey-blue transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Article Meta */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            {article.author_avatar ? (
                              <img
                                src={article.author_avatar}
                                alt={article.author}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-hockey-blue">
                                {article.author.substring(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{article.author}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(article.published_date)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{article.read_time} min read</div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {article.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {article.comments}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button className="flex-1 btn-championship" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Read Full Article
                        </Button>
                        <Button className="btn-ice" size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-hockey-blue" />
            Latest News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                  <CardHeader className="enhanced-card-header">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`bg-${getCategoryColor(article.category)} text-white`}>
                        {categories.find(c => c.id === article.category)?.name}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {formatTimeAgo(article.published_date)}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-3 group-hover:text-hockey-blue transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">{article.excerpt}</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Article Meta */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {article.author_avatar ? (
                            <img
                              src={article.author_avatar}
                              alt={article.author}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-hockey-blue">
                              {article.author.substring(0, 2)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{article.author}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{article.read_time} min</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {article.comments}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button className="flex-1 btn-ice" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Read More
                      </Button>
                      <Button className="btn-championship" size="sm" variant="outline">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* No Results */}
        {sortedArticles.length === 0 && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="enhanced-card text-center p-12">
              <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No News Articles Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find relevant articles.
              </p>
              <Button 
                className="btn-ice"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="enhanced-card bg-gradient-to-br from-hockey-purple/20 via-hockey-pink/10 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-hockey-purple to-hockey-pink rounded-xl">
                  <Newspaper className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Stay Connected</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Never miss an important update from the Secret Chel Society. 
                Subscribe to our newsletter and follow us for the latest news and announcements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-championship">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Subscribe to Newsletter
                </Button>
                <Button className="btn-ice" variant="outline">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Follow on Social
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
