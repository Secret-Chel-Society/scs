import type { Metadata } from "next"
import AuthDatabaseSync from "@/components/admin/auth-database-sync"
import { motion } from "framer-motion"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Auth to Database Sync - SCS Admin",
  description: "Sync users from Supabase Auth to database tables",
}

export default function SyncAuthDatabasePage() {
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
              Auth to Database Sync
            </h1>
            <p className="hockey-subtitle-enhanced">
              Sync users from Supabase Auth to your application database tables with enhanced security and reliability
            </p>
            <div className="hockey-section-divider mt-6"></div>
          </div>
          <AuthDatabaseSync />
        </motion.div>
      </div>
    </div>
  )
}
