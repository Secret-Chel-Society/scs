"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Clock, Eye, Twitch, Youtube, Users, Star } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { TeamLogo } from "@/components/team-logo"
import { useToast } from "@/components/ui/use-toast"

interface LiveStreamData {
  teams: Array<{
    id: string
    name: string
    logo_url: string | null
    isLive: boolean
    liveStreams: Array<{
      id: string
      twitch_username: string
      stream_title: string
      viewer_count: number
      started_at: string
      player_name: string
      stream_url: string
    }>
  }>
  liveStreams: Array<{
    id: string
    twitch_username: string
    stream_title: string
    viewer_count: number
    started_at: string
    player_name: string
    team_name: string
    team_logo: string | null
    stream_url: string
  }>
  featuredStream: {
    id: string
    twitch_username: string
    stream_title: string
    viewer_count: number
    started_at: string
    stream_url: string
  } | null
}

// Mock data for past streams - in a real app, this would come from a database
const pastStreams = [
  {
    id: "3",
    title: "Raptors vs Wolves - Regular Season",
    thumbnail: "/placeholder.svg?height=400&width=600",
    date: "2023-12-05",
    time: "9:00 PM EST",
    platform: "twitch",
    url: "https://twitch.tv/scs",
    views: 723,
    featured: false,
    live: false,
  },
  {
    id: "4",
    title: "Draft Day Coverage",
    thumbnail: "/placeholder.svg?height=400&width=600",
    date: "2023-11-28",
    time: "6:00 PM EST",
    platform: "youtube",
    url: "https://youtube.com/scs",
    views: 1432,
    featured: false,
    live: false,
  },
  {
    id: "5",
    title: "Free Agency Special",
    thumbnail: "/placeholder.svg?height=400&width=600",
    date: "2023-11-20",
    time: "7:30 PM EST",
    platform: "twitch",
    url: "https://twitch.tv/scs",
    views: 967,
    featured: false,
    live: false,
  },
  {
    id: "6",
    title: "Panthers vs Bears - Playoff Quarterfinals",
    thumbnail: "/placeholder.svg?height=400&width=600",
    date: "2023-11-15",
    time: "8:00 PM EST",
    platform: "youtube",
    url: "https://youtube.com/scs",
    views: 1876,
    featured: false,
    live: false,
  },
]

// Team logo component with live indicator
function TeamLogoWithLive({ team }: { team: LiveStreamData["teams"][0] }) {
  return (
    <div className="relative">
      <TeamLogo
        teamName={team.name}
        teamId={team.id}
        logoUrl={team.logo_url}
        size="xl"
        className="transition-all hover:scale-105"
      />
      {team.isLive && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="destructive" className="animate-pulse text-xs px-2 py-1">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
            LIVE
          </Badge>
        </div>
      )}
      {team.liveStreams.length > 0 && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <Badge variant="secondary" className="text-xs">
            {team.liveStreams.length} streaming
          </Badge>
        </div>
      )}
    </div>
  )
}

// Live stream card component
function LiveStreamCard({ stream }: { stream: LiveStreamData["liveStreams"][0] }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative">
        <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <Twitch className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-medium">{stream.twitch_username}</p>
          </div>
        </div>
        <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          {stream.team_logo && (
            <TeamLogo teamName={stream.team_name || "Unknown"} logoUrl={stream.team_logo} size="sm" />
          )}
          <Badge variant="secondary" className="bg-black/70 text-white">
            <Twitch className="h-3 w-3 mr-1" />
            Twitch
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold">
          {stream.stream_title || `${stream.player_name} is streaming`}
        </h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{stream.player_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{stream.viewer_count?.toLocaleString() || 0} viewers</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Started {new Date(stream.started_at).toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={stream.stream_url} target="_blank" rel="noopener noreferrer">
            <Twitch className="mr-2 h-4 w-4" />
            Watch Stream
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Featured stream component
function FeaturedStreamCard({ stream }: { stream: LiveStreamData["featuredStream"] }) {
  if (!stream) return null

  return (
    <Card className="overflow-hidden border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-yellow-700">Featured Stream</CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
          <div className="text-center text-white">
            <Twitch className="h-16 w-16 mx-auto mb-2" />
            <p className="text-lg font-medium">{stream.twitch_username}</p>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{stream.stream_title || `${stream.twitch_username} is streaming`}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{stream.viewer_count?.toLocaleString() || 0} viewers</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Started {new Date(stream.started_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href={stream.stream_url} target="_blank" rel="noopener noreferrer">
            <Twitch className="mr-2 h-5 w-5" />
            Watch Featured Stream
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// Past stream card component
function PastStreamCard({ stream }: { stream: any }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative">
        <div className="aspect-video overflow-hidden">
          <Image
            src={stream.thumbnail || "/placeholder.svg"}
            alt={stream.title}
            width={600}
            height={400}
            className="object-cover transition-transform hover:scale-105"
          />
        </div>
        <Badge variant="secondary" className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white">
          {stream.platform === "twitch" ? <Twitch className="h-3 w-3" /> : <Youtube className="h-3 w-3" />}
          {stream.platform === "twitch" ? "Twitch" : "YouTube"}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-1 text-xl font-bold">{stream.title}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>{stream.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{stream.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{stream.views.toLocaleString()} views</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={stream.url} target="_blank" rel="noopener noreferrer">
            Watch Replay
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function LiveStreamPage() {
  const [data, setData] = useState<LiveStreamData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchLiveStreamData()
    // Refresh data every 15 minutes
    const interval = setInterval(fetchLiveStreamData, 900000)
    return () => clearInterval(interval)
  }, [])

  const fetchLiveStreamData = async () => {
    try {
      const response = await fetch("/api/livestream/data")
      if (!response.ok) {
        throw new Error("Failed to fetch livestream data")
      }
      const streamData = await response.json()
      setData(streamData)
    } catch (error: any) {
      console.error("Error fetching livestream data:", error)
      toast({
        title: "Error loading streams",
        description: "Failed to load live stream data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader heading="LiveStream" text="Loading live streams..." />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader heading="LiveStream" text="Watch live streams from SCS players and teams" />

      {/* Featured Stream Section */}
      {data?.featuredStream && (
        <section className="mb-12">
          <h2 className="mb-6 text-3xl font-bold">Featured Stream</h2>
          <div className="max-w-2xl mx-auto">
            <FeaturedStreamCard stream={data.featuredStream} />
          </div>
        </section>
      )}

      {/* Team Live Status Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-3xl font-bold">Teams Live Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {data?.teams.map((team) => (
            <div key={team.id} className="text-center">
              <TeamLogoWithLive team={team} />
              <p className="mt-2 text-sm font-medium truncate">{team.name}</p>
              {team.liveStreams.length > 0 && (
                <div className="mt-1 space-y-1">
                  {team.liveStreams.map((stream) => (
                    <Link
                      key={stream.id}
                      href={stream.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:text-blue-800 truncate"
                    >
                      {stream.player_name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Live Streams Section */}
      {data?.liveStreams && data.liveStreams.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-3xl font-bold">Live Now ({data.liveStreams.length})</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.liveStreams.map((stream) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* No Live Streams Message */}
      {(!data?.liveStreams || data.liveStreams.length === 0) && !data?.featuredStream && (
        <section className="mb-12">
          <Card className="text-center py-12">
            <CardContent>
              <Twitch className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
              <p className="text-muted-foreground mb-4">No SCS players are currently streaming. Check back later!</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={fetchLiveStreamData}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Past Streams Section with Tabs */}
      <section>
        <h2 className="mb-6 text-3xl font-bold">Stream Archive</h2>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 gap-2 p-2">
            <TabsTrigger value="all" className="flex-1 min-w-0">
              <span className="truncate">All Streams</span>
            </TabsTrigger>
            <TabsTrigger value="twitch" className="flex-1 min-w-0">
              <span className="truncate">Twitch</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex-1 min-w-0">
              <span className="truncate">YouTube</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pastStreams.map((stream) => (
                <PastStreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="twitch">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pastStreams
                .filter((stream) => stream.platform === "twitch")
                .map((stream) => (
                  <PastStreamCard key={stream.id} stream={stream} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="youtube">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pastStreams
                .filter((stream) => stream.platform === "youtube")
                .map((stream) => (
                  <PastStreamCard key={stream.id} stream={stream} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Upcoming Schedule Section */}
      <section className="mt-12">
        <div className="rounded-lg border bg-card p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Connect Your Stream</h2>
          <p className="mb-4">
            Are you an SCS player? Connect your Twitch account to appear on this page when you go live!
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/settings">
                <Twitch className="mr-2 h-4 w-4" />
                Connect Twitch Account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="https://twitch.tv" target="_blank" rel="noopener noreferrer">
                <Twitch className="mr-2 h-4 w-4" />
                Visit Twitch
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
