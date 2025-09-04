import type { Metadata } from "next"
import { motion } from "framer-motion"
import { Shield, Search, UserCheck, AlertTriangle, Database, Wrench } from "lucide-react"
import UserDiagnostics from "@/components/admin/user-diagnostics"

export const metadata: Metadata = {
  title: "User Diagnostics",
  description: "Diagnose and fix user account issues",
}

export default function UserDiagnosticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-ice-blue-500/25">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="hockey-title mb-6">
              User Diagnostics
            </h1>
            <p className="hockey-subtitle mx-auto mb-8 max-w-3xl">
              Comprehensive diagnostic tool for troubleshooting user account issues, verification problems, and system inconsistencies
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Search className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">User Lookup</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
                <UserCheck className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Verification Fix</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
                <AlertTriangle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Issue Detection</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <Database className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Data Analysis</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <UserDiagnostics />
        </motion.div>
      </div>
    </div>
  )
}
