"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { 
  Users, 
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
  UserX
} from "lucide-react"
import Link from "next/link"

interface FreeAgent {
  id: string
  name: string
  position: string
  overall: number
  age: number
  experience: number
  asking_price: number
  status: "available" | "negotiating" | "signed" | "retired"
  team_preference?: string
  stats: {
    goals: number
    assists: number
    points: number
    games_played: number
  }
  last_team?: string
  last_team_logo?: string
  availability: string
  contract_demands: string
}

const positions = ["C", "LW", "RW", "D", "G"]
const statuses = ["available", "negotiating", "signed", "retired"]

const mockFreeAgents: FreeAgent[] = [
  {
    id: "1",
    name: "Connor McDavid",
    position: "C",
    overall: 95,
    age: 27,
    experience: 8,
    asking_price: 12500000,
    status: "available",
    team_preference: "Contender",
    stats: {
      goals: 45,
      assists: 67,
      points: 112,
      games_played: 82
    },
    last_team: "Edmonton Oilers",
    last_team_logo: "/placeholder-logo.png",
    availability: "Immediate",
    contract_demands: "Long-term, NMC"
  },
  {
    id: "2",
    name: "Nathan MacKinnon",
    position: "C",
    overall: 94,
    age: 28,
    experience: 10,
    asking_price: 12000000,
    status: "negotiating",
    team_preference: "West Coast",
    stats: {
      goals: 42,
      assists: 69,
      points: 111,
      games_played: 80
    },
    last_team: "Colorado Avalanche",
    last_team_logo: "/placeholder-logo.png",
    availability: "July 1st",
    contract_demands: "8 years, NTC"
  },
  {
    id: "3",
    name: "Auston Matthews",
    position: "C",
    overall: 93,
    age: 26,
    experience: 7,
    asking_price: 11500000,
    status: "available",
    team_preference: "Any",
    stats: {
      goals: 48,
      assists: 58,
      points: 106,
      games_played: 78
    },
    last_team: "Toronto Maple Leafs",
    last_team_logo: "/placeholder-logo.png",
    availability: "Immediate",
    contract_demands: "7 years, NMC"
  },
  {
    id: "4",
    name: "Cale Makar",
    position: "D",
    overall: 92,
    age: 25,
    experience: 5,
    asking_price: 11000000,
    status: "available",
    team_preference: "Contender",
    stats: {
      goals: 18,
      assists: 52,
      points: 70,
      games_played: 75
    },
    last_team: "Colorado Avalanche",
    last_team_logo: "/placeholder-logo.png",
    availability: "July 1st",
    contract_demands: "6 years, NTC"
  },
  {
    id: "5",
    name: "Connor Hellebuyck",
    position: "G",
    overall: 91,
    age: 30,
    experience: 9,
    asking_price: 8500000,
    status: "negotiating",
    team_preference: "Playoff Team",
    stats: {
      goals: 0,
      assists: 0,
      points: 0,
      games_played: 65
    },
    last_team: "Winnipeg Jets",
    last_team_logo: "/placeholder-logo.png",
    availability: "July 1st",
    contract_demands: "5 years, NTC"
  },
  {
    id: "6",
    name: "David Pastrnak",
    position: "RW",
    overall: 90,
    age: 27,
    experience: 8,
    asking_price: 10000000,
    status: "available",
    team_preference: "East Coast",
    stats: {
      goals: 38,
      assists: 55,
      points: 93,
      games_played: 79
    },
    last_team: "Boston Bruins",
    last_team_logo: "/placeholder-logo.png",
    availability: "Immediate",
    contract_demands: "7 years, NMC"
  }
]

export default function FreeAgencyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPosition, setSelectedPosition] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("overall")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all")

  const filteredAgents = mockFreeAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.last_team?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = selectedPosition === "all" || agent.position === selectedPosition
    const matchesStatus = selectedStatus === "all" || agent.status === selectedStatus
    
    return matchesSearch && matchesPosition && matchesStatus
  })

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case "overall":
        aValue = a.overall
        bValue = b.overall
        break
      case "age":
        aValue = a.age
        bValue = b.age
        break
      case "experience":
        aValue = a.experience
        bValue = b.experience
        break
      case "asking_price":
        aValue = a.asking_price
        bValue = b.asking_price
        break
      case "name":
        aValue = a.name
        bValue = b.name
        break
      default:
        aValue = a.overall
        bValue = b.overall
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="badge-regular"><UserPlus className="h-3 w-3 mr-1" />Available</Badge>
      case "negotiating":
        return <Badge className="badge-playoff"><UserCheck className="h-3 w-3 mr-1" />Negotiating</Badge>
      case "signed":
        return <Badge className="badge-champion"><UserCheck className="h-3 w-3 mr-1" />Signed</Badge>
      case "retired":
        return <Badge className="bg-gray-500 text-white"><UserX className="h-3 w-3 mr-1" />Retired</Badge>
      default:
        return <Badge className="badge-regular">{status}</Badge>
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "C": return "hockey-blue"
      case "LW": return "hockey-green"
      case "RW": return "hockey-purple"
      case "D": return "hockey-orange"
      case "G": return "hockey-red"
      default: return "hockey-silver"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return "text-hockey-gold"
    if (overall >= 85) return "text-hockey-blue"
    if (overall >= 80) return "text-hockey-green"
    if (overall >= 75) return "text-hockey-orange"
    return "text-hockey-red"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-green/20 via-hockey-blue/20 to-hockey-green/20 border-b border-hockey-green/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-green/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-green/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-blue/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div 
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">Free Agency</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Build your championship roster with the best available talent. 
              Scout, negotiate, and sign the players who will lead your team to victory.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-green to-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Free Agency Overview */}
        <div
          className="mb-8"
        >
          <Card className="enhanced-card">
            <CardHeader className="enhanced-card-header">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Free Agency Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-green mb-2">
                    {mockFreeAgents.filter(a => a.status === "available").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Players</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-blue mb-2">
                    {mockFreeAgents.filter(a => a.status === "negotiating").length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Negotiations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-purple mb-2">
                    {mockFreeAgents.filter(a => a.status === "signed").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recently Signed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-hockey-gold mb-2">
                    {formatCurrency(mockFreeAgents.reduce((sum, a) => sum + a.asking_price, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Asking Price</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div
          className="mb-8"
        >
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players or teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Position Filter */}
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                      <SelectItem value="overall">Overall</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="asking_price">Asking Price</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
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
        </div>

        {/* Free Agents Grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="group hover:-translate-y-2 transition-transform duration-300"
              >
                <Card className="enhanced-card h-full overflow-hidden group-hover:shadow-hockey-xl transition-all duration-300">
                  <CardHeader className="enhanced-card-header">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-r from-${getPositionColor(agent.position)} to-hockey-purple rounded-xl`}>
                        <span className="text-white font-bold text-lg">{agent.position}</span>
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                      <div className={`text-3xl font-bold ${getOverallColor(agent.overall)} mb-2`}>
                        {agent.overall}
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Rating</div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Player Info */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Age</div>
                          <div className="font-semibold">{agent.age}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Experience</div>
                          <div className="font-semibold">{agent.experience} years</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                          Last Season Stats
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-hockey-blue">{agent.stats.goals}</div>
                            <div className="text-xs text-muted-foreground">Goals</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-hockey-green">{agent.stats.assists}</div>
                            <div className="text-xs text-muted-foreground">Assists</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-hockey-purple">{agent.stats.points}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                        </div>
                      </div>

                      {/* Contract Info */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Asking Price</span>
                          <span className="font-bold text-hockey-gold">{formatCurrency(agent.asking_price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Availability</span>
                          <span className="font-semibold">{agent.availability}</span>
                        </div>
                        {agent.team_preference && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Team Preference</span>
                            <span className="font-semibold">{agent.team_preference}</span>
                          </div>
                        )}
                      </div>

                      {/* Last Team */}
                      {agent.last_team && (
                        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            {agent.last_team_logo ? (
                              <img
                                src={agent.last_team_logo}
                                alt={agent.last_team}
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <span className="text-xs font-bold text-hockey-blue">
                                {agent.last_team.substring(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Last Team</div>
                            <div className="font-semibold">{agent.last_team}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-hockey-blue/10">
                      <div className="flex gap-2">
                        <Button className="flex-1 btn-ice" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        {agent.status === "available" && (
                          <Button className="btn-championship" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Make Offer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* No Results */}
        {sortedAgents.length === 0 && (
          <div
            className="mt-8"
          >
            <Card className="enhanced-card text-center p-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Free Agents Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find available players.
              </p>
              <Button 
                className="btn-ice"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedPosition("all")
                  setSelectedStatus("all")
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Call to Action */}
        <div
          className="mt-12"
        >
          <Card className="enhanced-card bg-gradient-to-br from-hockey-green/20 via-hockey-blue/10 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Ready to Build Your Team?</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                The free agency period is your chance to transform your roster. 
                Make strategic signings and build the team that will bring home the championship.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-championship">
                  <Users className="h-5 w-5 mr-2" />
                  View All Players
                </Button>
                <Button className="btn-ice" variant="outline">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Salary Cap Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
