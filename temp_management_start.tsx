// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Trophy, DollarSign, Filter, History, Search, ArrowLeftRight } from "lucide-react"
import { SalaryProgress } from "@/components/management/salary-progress"
import { RosterProgress } from "@/components/management/roster-progress"
import { TeamAvailabilityTab } from "@/components/management/team-availability-tab"
import Image from "next/image"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamLogos } from "@/components/management/team-logos"
import { BidPlayerModal } from "@/components/management/bid-player-modal"
import { Textarea } from "@/components/ui/textarea"
import { XCircle, CheckCircle2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Home, Gavel } from "lucide-react"
import { getTeamStats, getCurrentSeasonId } from "@/lib/team-utils"

interface Player {
  id: string
  salary: number
  role: string
  users: {
    id: string
    gamer_tag_id: string
    primary_position: string
    secondary_position?: string
    console: string
    avatar_url?: string
  }
}

interface Team {
  id: string
  name: string
  logo_url?: string
  salary_cap: number
  max_players: number
  wins: number
  losses: number
  otl: number
  points: number
  games_played: number
  goals_for: number
  goals_against: number
  goal_differential: number
}

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  scheduled_time: string
  status: string
  home_score?: number
  away_score?: number
  home_team: {
    name: string
    logo_url?: string
  }
  away_team: {
    name: string
    logo_url?: string
  }
}

interface FreeAgent {
  id: string
  salary: number
  users: {
    id: string
    gamer_tag_id: string
    primary_position: string
    secondary_position?: string
    console: string
    avatar_url?: string
  }
}

interface Bid {
  id: string
  amount: number
  expires_at: string
  status: string
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
    }
  }
}


// Update the getPositionAbbreviation function to handle both full names and abbreviations
const getPositionAbbreviation = (position: string): string => {
  if (!position) return "?"

  const trimmedPosition = position.trim().toLowerCase()

  // Position mapping that handles both full names and abbreviations
  const positionMap: Record<string, string> = {
    goalie: "G",
    g: "G",
    center: "C",
    c: "C",
    "left wing": "LW",
    lw: "LW",
    "right wing": "RW",
    rw: "RW",
    "left defense": "LD",
    ld: "LD",
    "right defense": "RD",
    rd: "RD",
  }

  return positionMap[trimmedPosition] || position.toUpperCase()
}

// Function to get position color
const getPositionColor = (position: string): string => {
  switch (position) {
    case "Goalie":
    case "G":
      return "text-purple-400"
    case "Center":
    case "C":
      return "text-red-400"
    case "Left Wing":
    case "LW":
      return "text-green-400"
    case "Right Wing":
    case "RW":
      return "text-ice-blue-400"
    case "Left Defense":
    case "LD":
      return "text-cyan-400"
    case "Right Defense":
    case "RD":
      return "text-yellow-400"
    default:
      return "text-hockey-silver-400"
  }
}

const tabs = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "bids", label: "Bids", icon: Gavel },
  { id: "lineups", label: "Lineups", icon: Users },
  { id: "availability", label: "Availability", icon: Calendar },
]

const ManagementPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  // Safe search params handling
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [teamMatches, setTeamMatches] = useState<any[]>([])
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [filteredFreeAgents, setFilteredFreeAgents] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [playerBids, setPlayerBids] = useState<Record<string, any>>({})
  const [myBids, setMyBids] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState<any>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<any>(false)
  const [historyPlayer, setHistoryPlayer] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const [activeBidsCount, setActiveBidsCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [freeAgentsError, setFreeAgentsError] = useState<string | null>(null)
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)

  // Get active tab from search params or default to "roster"
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

