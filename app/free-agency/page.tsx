import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { FreeAgencyFilters } from "@/components/free-agency/free-agency-filters"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Users, UserPlus } from "lucide-react"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function FreeAgencyPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header Section */}
      <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Free Agency</h1>
              <p className="text-slate-400 text-sm mt-1">Browse and bid on available NHL players</p>
            </div>
            <Suspense fallback={<div className="text-sm text-slate-500">Loading counts...</div>}>
              <PositionCountsClient />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="free-agents" className="w-full">
          <TabsList className="mb-6 bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger 
              value="free-agents" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Free Agents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="player-signups"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Player Signups</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="free-agents" className="space-y-6">
            <FreeAgencyFilters initialParams={resolvedSearchParams} />
            <FreeAgencyList searchParams={resolvedSearchParams} league="nhl" />
          </TabsContent>

          <TabsContent value="player-signups">
            <PlayerSignupsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
