import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { FreeAgencyFilters } from "@/components/free-agency/free-agency-filters"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, FileText, Clock, TrendingUp, Award, Star, Zap } from "lucide-react"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default function FreeAgencyPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Free Agency
            </h1>
            <p className="hockey-subtitle mb-8">
              Browse available players and submit bids to strengthen your roster
            </p>
            
            {/* Free Agency Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  Available
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Free Agents
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Active
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Bids
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Player
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Signups
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Time
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Limited
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Enhanced Tabs Section */}
          <Tabs defaultValue="free-agents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 p-1 rounded-xl border border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg">
              <TabsTrigger 
                value="free-agents" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <div className="p-1 bg-white/20 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
                Free Agents
              </TabsTrigger>
              <TabsTrigger 
                value="player-signups" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <div className="p-1 bg-white/20 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                Player Signups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free-agents" className="space-y-6 mt-6">
              {/* Position Counts Section */}
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Available Players by Position
                      </div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        Real-time count of free agents in each position
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-blue-600 mx-auto mb-4"></div>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading position counts...</p>
                    </div>
                  }>
                    <PositionCountsClient />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Filters Section */}
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Search & Filters
                      </div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        Narrow down available players by position, console, and salary
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FreeAgencyFilters initialParams={searchParams} />
                </CardContent>
              </Card>

              {/* Free Agency List Section */}
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Available Players
                      </div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        Browse and submit bids on free agents
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FreeAgencyList searchParams={searchParams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="player-signups" className="space-y-6 mt-6">
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                        Player Signups
                      </div>
                      <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                        New players looking to join the league
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerSignupsList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
