import { BiddingRecap } from "@/components/admin/bidding-recap"
import { Trophy, Award, Medal, Star, Shield, Database, Settings, Zap, Target, Users, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Activity, BarChart3 } from "lucide-react"

export default function BiddingRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <DollarSign className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            Bidding Recap
          </h1>
          <p className="hockey-subtitle mb-8">
            Comprehensive overview of all free agency bidding activity and team acquisitions
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Trophy className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Team Statistics</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/50 dark:border-assist-green-700/50">
              <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Player Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/50 dark:border-goal-red-700/50">
              <BarChart3 className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Financial Overview</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <Activity className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Bid History</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12">
        <BiddingRecap />
      </div>
    </div>
  )
}
