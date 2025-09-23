import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Position Counts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Available Players by Position</CardTitle>
            <CardDescription>Real-time count of free agents in each position</CardDescription>
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

        {/* Main Tabs Section */}
        <Tabs defaultValue="free-agents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="free-agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Free Agents
            </TabsTrigger>
            <TabsTrigger value="player-signups" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Player Signups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="free-agents">
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

          <TabsContent value="player-signups">
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
  )
}
