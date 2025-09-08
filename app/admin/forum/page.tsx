import { Suspense } from "react"
import { SimpleForumManagement } from "@/components/admin/simple-forum-management"
import { ErrorBoundary } from "@/components/error-boundary"
import { MessageSquare, Users, Shield, Settings, Database, Activity, TrendingUp, Target, Zap, Trophy, Star, Medal, Crown, BarChart3, Clock, Award, BookOpen, FileText, Globe, Publish, AlertTriangle, CheckCircle } from "lucide-react"

export default function AdminForumPage() {
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
              Forum Management Center
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Comprehensive forum management and moderation tools for the league community. 
              Manage categories, posts, user interactions, and maintain a healthy discussion environment.
            </p>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-ice-blue-500/25 transition-all duration-300">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    Forum
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Management
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-rink-blue-500/25 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300 mb-2">
                    User
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Moderation
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-assist-green-500/25 transition-all duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    Content
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Moderation
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mx-auto mt-3 group-hover:w-20 transition-all duration-300"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="hockey-stat-item hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl group-hover:shadow-goal-red-500/25 transition-all duration-300">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    System
                  </div>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">
                    Configuration
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
            Community Management Hub
          </h2>
          <p className="text-xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-3xl mx-auto">
            Manage forum categories, posts, and moderation to maintain a healthy and engaging 
            community discussion environment for all league members.
          </p>
        </div>

        {/* Enhanced Content Area */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
              Forum Management Interface
            </h3>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
              Access comprehensive forum management tools and moderation controls.
            </p>
          </div>

          <ErrorBoundary
            fallback={
              <div className="hockey-card border-2 border-goal-red-200 dark:border-goal-red-700 overflow-hidden">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-goal-red-200 to-assist-green-200 dark:from-goal-red-800 dark:to-assist-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-goal-red-600 dark:text-goal-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    Error Loading Forum Management
                  </h3>
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    There was an error loading the forum management interface. Please try again later.
                  </p>
                </div>
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden">
                  <div className="p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-200 to-rink-blue-200 dark:from-ice-blue-800 dark:to-rink-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <MessageSquare className="h-8 w-8 text-ice-blue-600 dark:text-ice-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                        Loading Forum Management
                      </h3>
                      <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                        Initializing forum management interface...
                      </p>
                      <div className="mt-6">
                        <div className="animate-spin h-8 w-8 border-4 border-ice-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <SimpleForumManagement />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
