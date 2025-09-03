import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { FreeAgencyFilters } from "@/components/free-agency/free-agency-filters"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-white">Free Agents</h1>
          <p className="text-white/70">Browse and bid on available players</p>
        </div>

        <Tabs defaultValue="free-agents" className="w-full">
          <TabsList className="mb-6 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="free-agents" className="text-white data-[state=active]:bg-white/20">Free Agents</TabsTrigger>
            <TabsTrigger value="player-signups" className="text-white data-[state=active]:bg-white/20">Player Signups</TabsTrigger>
          </TabsList>

          <TabsContent value="free-agents">
            <div className="mb-6">
              <Suspense fallback={<div className="text-sm text-white/70">Loading position counts...</div>}>
                <PositionCountsClient />
              </Suspense>
            </div>

            <div className="mb-6">
              <FreeAgencyFilters initialParams={searchParams} />
            </div>

            <FreeAgencyList searchParams={searchParams} />
          </TabsContent>

          <TabsContent value="player-signups">
            <PlayerSignupsList />
          </TabsContent>
        </Tabs>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
