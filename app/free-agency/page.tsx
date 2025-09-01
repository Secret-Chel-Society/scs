import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { FreeAgencyFilters } from "@/components/free-agency/free-agency-filters"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserPlus, Target, TrendingUp, DollarSign, Award } from "lucide-react"
import { DynamicFreeAgencyStats } from "@/components/free-agency/dynamic-free-agency-stats"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

function FreeAgencyLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function FreeAgencyPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Free Agency
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Discover talent and build your championship roster
            </p>
          </div>

          {/* Free Agency Statistics */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <div className="text-blue-300 flex items-center justify-center gap-2">
                  <Users className="h-5 w-5" />
                  Available Players
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <div className="text-green-300 flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Bids
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <div className="text-purple-300 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Teams
                </div>
              </div>
            </div>
          }>
            <DynamicFreeAgencyStats />
          </Suspense>

          {/* Main Content Tabs */}
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <Tabs defaultValue="free-agents" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                    <TabsTrigger 
                      value="free-agents" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Free Agents
                    </TabsTrigger>
                    <TabsTrigger 
                      value="player-signups" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Player Signups
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="free-agents" className="space-y-6">
                    <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
                      <Suspense fallback={<div className="text-sm text-blue-300">Loading position counts...</div>}>
                        <PositionCountsClient />
                      </Suspense>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
                      <FreeAgencyFilters initialParams={searchParams} />
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: "700ms" }}>
                      <Suspense fallback={<FreeAgencyLoadingSkeleton />}>
                        <FreeAgencyList searchParams={searchParams} />
                      </Suspense>
                    </div>
                  </TabsContent>

                  <TabsContent value="player-signups" className="space-y-6">
                    <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
                      <Suspense fallback={<FreeAgencyLoadingSkeleton />}>
                        <PlayerSignupsList />
                      </Suspense>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
