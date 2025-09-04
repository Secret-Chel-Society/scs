import { SyncMissingUsers } from "@/components/admin/sync-missing-users"
import { motion } from "framer-motion"
import { Users } from "lucide-react"

export default function SyncMissingUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 text-center">
              <h1 className="hockey-title-enhanced mb-4 flex items-center justify-center gap-3">
                <div className="hockey-feature-icon">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Sync Missing Users
              </h1>
              <p className="hockey-subtitle-enhanced">
                Find and sync users who exist in Supabase Auth but are missing from the users table with intelligent detection
              </p>
              <div className="hockey-section-divider mt-6"></div>
            </div>

            <SyncMissingUsers />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
