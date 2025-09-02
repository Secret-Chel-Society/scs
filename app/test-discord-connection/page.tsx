"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordConnectButton } from "@/components/auth/discord-connect-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"

export default function TestDiscordConnectionPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testDiscordConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/auth/discord/debug")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDebugInfo(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscordSuccess = (discordId: string, discordUsername: string) => {
    console.log("Discord connected successfully:", { discordId, discordUsername })
    alert(`Discord connected: ${discordUsername} (${discordId})`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Discord Connection Test</CardTitle>
            <CardDescription className="text-white/70">
              Test and debug Discord OAuth connection issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration Test */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">1. Test Discord Configuration</h3>
              <Button 
                onClick={testDiscordConfig} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {loading ? "Testing..." : "Test Discord Config"}
              </Button>
              
              {debugInfo && (
                <div className="space-y-4">
                  <Alert className="border-blue-500/30 bg-blue-500/10">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {error && (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Discord Connection Test */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">2. Test Discord Connection</h3>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <DiscordConnectButton
                  userId="test-user"
                  source="settings"
                  onSuccess={handleDiscordSuccess}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                />
              </div>
            </div>

            {/* Registration Flow Test */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">3. Test Registration Flow</h3>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <DiscordConnectButton
                  source="register"
                  onSuccess={handleDiscordSuccess}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                />
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">4. Troubleshooting</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200">
                    <strong>Common Issues:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Missing DISCORD_CLIENT_ID</li>
                      <li>• Missing DISCORD_CLIENT_SECRET</li>
                      <li>• Incorrect redirect URI</li>
                      <li>• Popup blockers enabled</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <strong>Expected Flow:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Click Discord Connect</li>
                      <li>• Redirect to Discord OAuth</li>
                      <li>• User authorizes app</li>
                      <li>• Redirect back with code</li>
                      <li>• Exchange code for token</li>
                      <li>• Get user info & redirect</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
