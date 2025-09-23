import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText } from "lucide-react"

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
            <TabsList className="flex flex-wrap w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg gap-2 sm:gap-3">
              <TabsTrigger 
                value="free-agents" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg min-h-[50px] sm:min-h-[60px] flex-shrink-0"
              >
                <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <span className="flex-1 text-center font-medium text-sm">Free Agents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="player-signups" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg min-h-[50px] sm:min-h-[60px] flex-shrink-0"
              >
                <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="flex-1 text-center font-medium text-sm">Player Signups</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free-agents" className="space-y-6 mt-6">
              {/* Free Agency List Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Free Agents</CardTitle>
                  <CardDescription>Browse and bid on available players</CardDescription>
                </CardHeader>
                <CardContent>
                  <FreeAgencyList searchParams={searchParams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="player-signups" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Player Signups</CardTitle>
                  <CardDescription>New players looking to join the league</CardDescription>
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
