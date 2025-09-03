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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Free Agents</h1>
          <p className="text-muted-foreground">Browse and bid on available players</p>
        </div>

        <Tabs defaultValue="free-agents" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="free-agents">Free Agents</TabsTrigger>
            <TabsTrigger value="player-signups">Player Signups</TabsTrigger>
          </TabsList>

          <TabsContent value="free-agents">
            <div className="mb-6">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading position counts...</div>}>
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
    </div>
  )
}
