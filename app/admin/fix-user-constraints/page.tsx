import { Suspense } from "react"
import FixUserConstraints from "@/components/admin/fix-user-constraints"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Database } from "lucide-react"

export default function FixUserConstraintsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="hockey-title-enhanced mb-4 flex items-center justify-center gap-3">
              <div className="hockey-feature-icon">
                <Database className="h-6 w-6 text-white" />
              </div>
              Fix User Constraints
            </h1>
            <p className="hockey-subtitle-enhanced">
              Fix console constraint violations and duplicate gamer tag issues when syncing auth users with intelligent resolution
            </p>
            <div className="hockey-section-divider mt-6"></div>
          </div>
          <Suspense fallback={<Skeleton className="hockey-premium-card h-[600px] w-full" />}>
            <FixUserConstraints />
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}
