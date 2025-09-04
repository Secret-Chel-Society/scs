"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Loader2, Users, Database, Tag, TerminalIcon as Console } from "lucide-react"

export default function FixUserConstraints() {
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFix = async () => {
    if (!adminKey.trim()) {
      toast({
        title: "Admin key required",
        description: "Please enter your admin verification key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/admin/fix-user-constraints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix user constraints")
      }

      setResults(data.results)
      toast({
        title: "User constraints fixed",
        description: `Successfully processed ${data.results.usersCreated} users`,
      })
    } catch (error: any) {
      console.error("Error fixing user constraints:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fix user constraints",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="hockey-premium-card">
        <CardHeader>
          <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
            <div className="hockey-feature-icon">
              <Database className="h-5 w-5 text-white" />
            </div>
            Fix User Constraints
          </CardTitle>
          <CardDescription className="hockey-subtitle text-center">
            This tool will fix console values and handle duplicate gamer tags when syncing users from auth to database with intelligent conflict resolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFix()
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label htmlFor="admin-key" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-ice-blue-500" />
                Admin Verification Key
              </Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                disabled={isLoading}
                className="hockey-form-enhanced"
              />
            </div>

            <Button type="submit" disabled={isLoading || !adminKey.trim()} className="w-full hockey-button-enhanced">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing User Constraints...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Fix User Constraints
                </>
              )}
            </Button>
          </form>

          <div className="hockey-premium-card bg-gradient-to-br from-ice-blue-25 to-rink-blue-25 dark:from-ice-blue-950/30 dark:to-rink-blue-950/30">
            <h3 className="hockey-title text-lg mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-ice-blue-500" />
              What this tool does:
            </h3>
            <ul className="hockey-subtitle text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ice-blue-500 rounded-full"></div>
                Maps console values (PlayStation 5 → PS5, Xbox Series X → XSX)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rink-blue-500 rounded-full"></div>
                Handles duplicate gamer tags by adding numbers (player1, player2, etc.)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-assist-green-500 rounded-full"></div>
                Creates missing user, player, and role records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-goal-red-500 rounded-full"></div>
                Skips users that already exist in the database
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-hockey-silver-500 rounded-full"></div>
                Provides detailed error reporting
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card className="hockey-premium-card">
          <CardHeader>
            <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
              <div className="hockey-feature-icon">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              Fix Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="hockey-stats-enhanced bg-gradient-to-br from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 border-ice-blue-200 dark:border-ice-blue-700">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-ice-blue-600 dark:text-ice-blue-400" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">{results.authUsers}</div>
                <div className="text-sm text-ice-blue-600 dark:text-ice-blue-400 font-medium">Auth Users Found</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border-assist-green-200 dark:border-assist-green-700">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-6 w-6 text-assist-green-600 dark:text-assist-green-400" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">{results.usersCreated}</div>
                <div className="text-sm text-assist-green-600 dark:text-assist-green-400 font-medium">Users Created</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 border-rink-blue-200 dark:border-rink-blue-700">
                <div className="flex items-center justify-center mb-2">
                  <Console className="h-6 w-6 text-rink-blue-600 dark:text-rink-blue-400" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">{results.consoleFixed}</div>
                <div className="text-sm text-rink-blue-600 dark:text-rink-blue-400 font-medium">Console Values Fixed</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border-goal-red-200 dark:border-goal-red-700">
                <div className="flex items-center justify-center mb-2">
                  <Tag className="h-6 w-6 text-goal-red-600 dark:text-goal-red-400" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">{results.gamerTagFixed}</div>
                <div className="text-sm text-goal-red-600 dark:text-goal-red-400 font-medium">Gamer Tags Fixed</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="hockey-stats-enhanced bg-gradient-to-br from-hockey-silver-50 to-hockey-silver-100 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20 border-hockey-silver-200 dark:border-hockey-silver-700">
                <div className="text-2xl font-bold text-hockey-silver-700 dark:text-hockey-silver-300">{results.playersCreated}</div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Player Records Created</div>
              </div>
              <div className="hockey-stats-enhanced bg-gradient-to-br from-hockey-silver-50 to-hockey-silver-100 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20 border-hockey-silver-200 dark:border-hockey-silver-700">
                <div className="text-2xl font-bold text-hockey-silver-700 dark:text-hockey-silver-300">{results.rolesCreated}</div>
                <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Role Records Created</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="hockey-premium-card bg-gradient-to-br from-goal-red-25 to-goal-red-50 dark:from-goal-red-950/30 dark:to-goal-red-900/30 border-2 border-goal-red-200 dark:border-goal-red-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="hockey-feature-icon bg-gradient-to-r from-goal-red-500 to-goal-red-600">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="hockey-title text-lg text-goal-red-800 dark:text-goal-red-200">
                    Errors ({results.errors.length})
                  </h3>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  <ul className="hockey-subtitle text-goal-red-700 dark:text-goal-red-300 space-y-2">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-goal-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  )
}
