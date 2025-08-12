"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Settings, CheckCircle, AlertCircle } from "lucide-react"

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Setup Bot Configuration
        </CardTitle>
        <CardDescription>Initialize the Discord bot configuration with the correct settings for MGHL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSetup ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">Bot configuration has been set up successfully!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 dark:text-yellow-200">
              Bot configuration needs to be set up before roles can be synced.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Configuration Details:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Guild ID: 1345946042281234442</li>
            <li>• Registered Role ID: 1376351990354804848</li>
            <li>• Bot Token: Configured securely</li>
          </ul>
        </div>

        <Button onClick={setupBotConfig} disabled={isLoading || isSetup} className="w-full">
          {isLoading ? "Setting up..." : isSetup ? "Configuration Complete" : "Setup Bot Configuration"}
        </Button>
      </CardContent>
    </Card>
  )
}
