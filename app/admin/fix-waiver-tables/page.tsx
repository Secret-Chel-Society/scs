import { FixWaiverTablesMigration } from "@/components/admin/fix-waiver-tables-migration"
// import { motion } from "framer-motion"
import { Settings } from "lucide-react"

export default function FixWaiverTablesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in-up">
            <div className="mb-8 text-center">
              <h1 className="hockey-title-enhanced mb-4 flex items-center justify-center gap-3">
                <div className="hockey-feature-icon">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Fix Waiver Tables
              </h1>
              <p className="hockey-subtitle-enhanced">
                Repair and initialize waiver priority and claims tables with enhanced database management
              </p>
              <div className="hockey-section-divider mt-6"></div>
            </div>
            <FixWaiverTablesMigration />
          </div>
        </div>
      </div>
    </div>
  )
}
