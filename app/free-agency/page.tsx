import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { FreeAgencyFilters } from "@/components/free-agency/free-agency-filters"
import { PositionCountsClient } from "@/components/free-agency/position-counts-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSignupsList } from "@/components/free-agency/player-signups-list"
import { Users, Target, Star, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Professional Free Agent Market Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hockey-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/8" />
        
        {/* Professional market floating elements */}
        <motion.div
          className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-primary/25 to-secondary/25 rounded-full shadow-xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-secondary/25 to-primary/25 rounded-xl shadow-xl"
          animate={{ y: [-20, 20, -20], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          {/* Enhanced Professional Free Agent Market Header */}
          <div className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-6 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 120 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90" />
                <Users className="h-12 w-12 text-white relative z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-40" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Free Agent Market
              </h1>
            </motion.div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-secondary rounded-full" />
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full" />
            </div>
            
            <motion.p 
              className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Browse and bid on <span className="font-bold text-primary">available professional players</span> in the Secret Chel Society Championship League
            </motion.p>
          </div>

          {/* Enhanced Professional Market Tabs */}
          <Tabs defaultValue="free-agents" className="w-full">
            <div className="bg-background/80 backdrop-blur-lg border-2 border-primary/20 p-4 rounded-2xl shadow-2xl mb-12">
              <TabsList className="grid w-full grid-cols-2 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-lg rounded-xl border border-primary/20">
                <TabsTrigger 
                  value="free-agents" 
                  className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <Target className="h-6 w-6" />
                  Free Agents
                </TabsTrigger>
                <TabsTrigger 
                  value="player-signups" 
                  className="py-4 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <Star className="h-6 w-6" />
                  Player Signups
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="free-agents" className="space-y-8">
              {/* Position Counts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="mb-6">
                  <Suspense fallback={
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 text-white/70">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading position counts...
                      </div>
                    </div>
                  }>
                    <PositionCountsClient />
                  </Suspense>
                </div>
              </motion.div>

              {/* Filters Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="mb-6">
                  <FreeAgencyFilters initialParams={searchParams} />
                </div>
              </motion.div>

              {/* Free Agency List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <FreeAgencyList searchParams={searchParams} />
              </motion.div>
            </TabsContent>

            <TabsContent value="player-signups" className="space-y-8 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <PlayerSignupsList />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
