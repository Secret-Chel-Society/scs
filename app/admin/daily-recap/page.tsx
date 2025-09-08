import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecap from "@/components/admin/daily-recap"
import DailyRecapsTableMigration from "@/components/admin/daily-recaps-table-migration"
import { Newspaper, Calendar, Trophy, Star, Medal, Crown, Activity, TrendingUp, Users, Target, Zap, Shield, Database, Settings, BarChart3, Clock, Award } from "lucide-react"

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-200 to-rink-blue-200 dark:from-ice-blue-800 dark:to-rink-blue-800 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 bg-gradient-to-r from-ice-blue-200 to-rink-blue-200 dark:from-ice-blue-800 dark:to-rink-blue-800 rounded-lg w-32"></div>
              <div className="h-12 bg-gradient-to-r from-assist-green-200 to-goal-red-200 dark:from-assist-green-800 dark:to-goal-red-800 rounded-lg w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hockey-card border-2 border-rink-blue-200 dark:border-rink-blue-700 overflow-hidden">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-rink-blue-200 to-ice-blue-200 dark:from-rink-blue-800 dark:to-ice-blue-800 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gradient-to-r from-hockey-silver-200 to-rink-blue-200 dark:from-hockey-silver-700 dark:to-rink-blue-800 rounded w-2/3"></div>
                <div className="h-4 bg-gradient-to-r from-hockey-silver-200 to-rink-blue-200 dark:from-hockey-silver-700 dark:to-rink-blue-800 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gradient-to-r from-hockey-silver-200 to-rink-blue-200 dark:from-hockey-silver-700 dark:to-rink-blue-800 rounded w-full"></div>
              <div className="h-4 bg-gradient-to-r from-hockey-silver-200 to-rink-blue-200 dark:from-hockey-silver-700 dark:to-rink-blue-800 rounded w-5/6"></div>
              <div className="h-4 bg-gradient-to-r from-hockey-silver-200 to-rink-blue-200 dark:from-hockey-silver-700 dark:to-rink-blue-800 rounded w-4/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DailyRecapPage() {
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
          <div>
            <h1 className="hockey-title mb-6">
              Daily Recap Management
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Generate and manage comprehensive daily recaps for recent matches. 
              Create engaging content that highlights key moments, player performances, and league updates.
            </p>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <Newspaper className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    Daily
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Recaps
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    Match
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Coverage
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    Player
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Highlights
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    League
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Updates
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
            Recap Management Center
          </h2>
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto">
            Create engaging daily recaps that capture the excitement of recent matches, 
            highlight standout performances, and keep the league community informed.
          </p>
        </div>

        {/* Enhanced Content Areas */}
        <div className="space-y-8">
          {/* Daily Recaps Table Migration */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                Recap Data Management
              </h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Manage and organize daily recap data and migration tools.
              </p>
            </div>
            <DailyRecapsTableMigration />
          </div>

          {/* Daily Recap Generator */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                Daily Recap Generator
              </h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Generate comprehensive daily recaps for recent matches and league activities.
              </p>
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
              <DailyRecap />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
