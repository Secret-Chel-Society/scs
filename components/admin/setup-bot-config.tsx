"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Settings, CheckCircle, AlertCircle, Bot, Shield, Zap, Database, Globe, RefreshCw, Target, Users } from "lucide-react"

export default function SetupBotConfig() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSetup, setIsSetup] = useState(false)

  const setupBotConfig = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/discord/setup-bot-config", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to setup bot configuration")
      }

      const data = await response.json()

      setIsSetup(true)
      toast({
        title: "Bot configuration setup",
        description: "Discord bot configuration has been set up successfully.",
      })
    } catch (error: any) {
      console.error("Error setting up bot config:", error)
      toast({
        title: "Error setting up bot config",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Main Setup Card */}
      <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Setup Bot Configuration
          </CardTitle>
          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Initialize the Discord bot configuration with the correct settings for SCS.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Status Display */}
          {isSetup ? (
            <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 border border-assist-green-200/30 dark:border-assist-green-700/30 rounded-xl">
              <div className="p-2 bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-assist-green-800 dark:text-assist-green-200">Bot configuration has been set up successfully!</p>
                <p className="text-sm text-assist-green-600 dark:text-assist-green-400">Your Discord bot is now ready to sync roles and manage user connections.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-goal-red-100/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 border border-goal-red-200/30 dark:border-goal-red-700/30 rounded-xl">
              <div className="p-2 bg-gradient-to-r from-goal-red-500/20 to-goal-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-goal-red-600 dark:text-goal-red-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-goal-red-800 dark:text-goal-red-200">Bot configuration needs to be set up</p>
                <p className="text-sm text-goal-red-600 dark:text-goal-red-400">Initialize the configuration before roles can be synced.</p>
              </div>
            </div>
          )}

          {/* Configuration Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Database className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
              Configuration Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Guild ID</span>
                </div>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">1345946042281234442</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                  <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Registered Role ID</span>
                </div>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">1376351990354804848</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-900/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                  <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Bot Token</span>
                </div>
                <Badge variant="outline" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
                  Configured Securely
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={setupBotConfig} 
            disabled={isLoading || isSetup} 
            className={`w-full hockey-button ${isSetup 
              ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700" 
              : "bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700"
            } text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : isSetup ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Configuration Complete
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Setup Bot Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card className="hockey-card hockey-card-hover border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
            <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            What This Setup Does
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Users className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                User Management
              </h4>
              <ul className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Enables Discord user connection tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Automatic role assignment based on team membership</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Real-time synchronization with SCS database</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Shield className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                Security Features
              </h4>
              <ul className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Secure token storage and management</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Encrypted communication with Discord API</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-rink-blue-500 rounded-full mt-2"></div>
                  <span>Role-based access control integration</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
