"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DiscordLoginButton from "@/components/auth/discord-login-button"
import DiscordConnectButton from "@/components/auth/discord-connect-button"

export default function TestDiscordLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-2xl">
        <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Discord Login Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Login with Discord</h3>
              <DiscordLoginButton />
            </div>
            
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connect Discord (Settings)</h3>
              <DiscordConnectButton 
                userId="test-user-id"
                source="settings"
              />
            </div>
            
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connect Discord (Registration)</h3>
              <DiscordConnectButton 
                userId="registration"
                source="register"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
