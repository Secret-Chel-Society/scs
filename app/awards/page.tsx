"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Award, 
  Target, 
  TrendingUp, 
  Users, 
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
  Lightning
} from "lucide-react"
import Link from "next/link"

interface Award {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  recipients: AwardRecipient[]
}

interface AwardRecipient {
  id: string
  name: string
  team: string
  team_logo?: string
  season: string
  stats?: string
  date_awarded: string
}

const awardCategories = [
  {
    id: "player",
    name: "Player Awards",
    description: "Individual player achievements and recognition",
    icon: Trophy,
    color: "hockey-gold"
  },
  {
    id: "team",
    name: "Team Awards",
    description: "Team-based accomplishments and milestones",
    icon: Crown,
    color: "hockey-blue"
  },
  {
    id: "season",
    name: "Season Awards",
    description: "End-of-season honors and achievements",
    icon: Medal,
    color: "hockey-purple"
  },
  {
    id: "special",
    name: "Special Recognition",
    description: "Unique achievements and special honors",
    icon: Star,
    color: "hockey-green"
  }
]

const mockAwards: Award[] = [
  {
    id: "1",
    name: "Hart Trophy",
    description: "Most Valuable Player of the Season",
    category: "player",
    icon: "Trophy",
    color: "hockey-gold",
    recipients: [
      {
        id: "1",
        name: "Connor McDavid",
        team: "Edmonton Oilers",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "45 Goals, 67 Assists, 112 Points",
        date_awarded: "2024-06-15"
      }
    ]
  },
  {
    id: "2",
    name: "Art Ross Trophy",
    description: "Leading Point Scorer of the Season",
    category: "player",
    icon: "Star",
    color: "hockey-blue",
    recipients: [
      {
        id: "2",
        name: "Nathan MacKinnon",
        team: "Colorado Avalanche",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "42 Goals, 69 Assists, 111 Points",
        date_awarded: "2024-06-15"
      }
    ]
  },
  {
    id: "3",
    name: "Stanley Cup",
    description: "League Champions",
    category: "team",
    icon: "Crown",
    color: "hockey-gold",
    recipients: [
      {
        id: "3",
        name: "Tampa Bay Lightning",
        team: "Tampa Bay Lightning",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "16-8 Playoff Record",
        date_awarded: "2024-06-15"
      }
    ]
  },
  {
    id: "4",
    name: "Presidents' Trophy",
    description: "Best Regular Season Record",
    category: "team",
    icon: "Shield",
    color: "hockey-blue",
    recipients: [
      {
        id: "4",
        name: "Boston Bruins",
        team: "Boston Bruins",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "65-12-5 Record",
        date_awarded: "2024-06-15"
      }
    ]
  },
  {
    id: "5",
    name: "Rookie of the Year",
    description: "Best First-Year Player",
    category: "player",
    icon: "Star",
    color: "hockey-green",
    recipients: [
      {
        id: "5",
        name: "Connor Bedard",
        team: "Chicago Blackhawks",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "28 Goals, 35 Assists, 63 Points",
        date_awarded: "2024-06-15"
      }
    ]
  },
  {
    id: "6",
    name: "Comeback Player of the Year",
    description: "Player who overcame adversity",
    category: "special",
    icon: "Heart",
    color: "hockey-purple",
    recipients: [
      {
        id: "6",
        name: "Patrice Bergeron",
        team: "Boston Bruins",
        team_logo: "/placeholder-logo.png",
        season: "Season 1",
        stats: "Returned from injury to lead team",
        date_awarded: "2024-06-15"
      }
    ]
  }
]

export default function AwardsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredAwards = mockAwards.filter(award => {
    if (selectedCategory !== "all" && award.category !== selectedCategory) {
      return false
    }
    return true
  })

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Trophy": return Trophy
      case "Crown": return Crown
      case "Medal": return Medal
      case "Star": return Star
      case "Shield": return Shield
      case "Heart": return Heart
      case "Flame": return Flame
      case "Lightning": return Lightning
      default: return Award
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "player": return "hockey-gold"
      case "team": return "hockey-blue"
      case "season": return "hockey-purple"
      case "special": return "hockey-green"
      default: return "hockey-silver"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-gold/20 via-hockey-purple/20 to-hockey-gold/20 border-b border-hockey-gold/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-gold/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-gold/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-purple/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div 
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-gold to-hockey-purple rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">SCS Awards</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Celebrating excellence and achievement in the Secret Chel Society. 
              Recognizing the best players, teams, and moments of the season.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-gold to-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Awards Overview */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="enhanced-card">
            <CardHeader className="enhanced-card-header">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-hockey-gold to-hockey-purple rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Awards Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-gold mb-2">{mockAwards.length}</div>
                  <div className="text-sm text-muted-foreground">Total Awards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-blue mb-2">
                    {mockAwards.filter(a => a.category === "player").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Player Awards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-purple mb-2">
                    {mockAwards.filter(a => a.category === "team").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Team Awards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-green mb-2">
                    {mockAwards.filter(a => a.category === "special").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Special Recognition</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-gradient-to-r from-hockey-gold to-hockey-purple text-white" : ""}
            >
              <Award className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            {awardCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? `bg-gradient-to-r from-${category.color} to-hockey-purple text-white` : ""}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Awards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAwards.map((award, index) => {
              const IconComponent = getIconComponent(award.icon)
              const categoryColor = getCategoryColor(award.category)
              
              return (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                    <CardHeader className="enhanced-card-header">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 bg-gradient-to-r from-${categoryColor} to-hockey-purple rounded-xl`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <Badge className={`badge-${award.category === "player" ? "champion" : award.category === "team" ? "playoff" : "regular"}`}>
                          {award.category.charAt(0).toUpperCase() + award.category.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{award.name}</h3>
                        <p className="text-sm text-muted-foreground">{award.description}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Recipients */}
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Recent Recipients
                        </h4>
                        {award.recipients.map((recipient) => (
                          <div key={recipient.id} className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                {recipient.team_logo ? (
                                  <img
                                    src={recipient.team_logo}
                                    alt={recipient.team}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-hockey-blue">
                                    {recipient.team.substring(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold">{recipient.name}</div>
                                <div className="text-sm text-muted-foreground">{recipient.team}</div>
                              </div>
                            </div>
                            {recipient.stats && (
                              <div className="text-sm text-muted-foreground mb-2">
                                {recipient.stats}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{recipient.season}</span>
                              <span>{formatDate(recipient.date_awarded)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-hockey-blue/10">
                        <div className="flex gap-2">
                          <Button className="flex-1 btn-ice" size="sm">
                            <Trophy className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                          <Button className="btn-championship" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Nominate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="enhanced-card bg-gradient-to-br from-hockey-gold/20 via-hockey-purple/10 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-hockey-gold to-hockey-purple rounded-xl">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Nominate for Awards</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Help recognize excellence in the SCS community. Nominate players, teams, 
                or special achievements that deserve recognition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-championship">
                  <Trophy className="h-5 w-5 mr-2" />
                  Submit Nomination
                </Button>
                <Button className="btn-ice" variant="outline">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Criteria
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
