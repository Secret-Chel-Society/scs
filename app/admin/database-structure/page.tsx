import { DatabaseStructureExplorer } from "@/components/admin/database-structure-explorer"
// import { motion } from "framer-motion"
import { Database } from "lucide-react"

export default function DatabaseStructurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-fade-in-up">
          <div className="mb-8 text-center">
            <h1 className="hockey-title-enhanced mb-4 flex items-center justify-center gap-3">
              <div className="hockey-feature-icon">
                <Database className="h-6 w-6 text-white" />
              </div>
              Database Structure Explorer
            </h1>
            <p className="hockey-subtitle-enhanced">
              Explore table structures and column names in the database with advanced visualization
            </p>
            <div className="hockey-section-divider mt-6"></div>
          </div>
          <DatabaseStructureExplorer />
        </div>
      </div>
    </div>
  )
}
