"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    async function handleCallback() {
      try {
        setIsProcessing(true)
        
        // Check if this is a Discord login callback
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const isDiscordLogin = searchParams.get('discord_login') === 'true'
        
        if (isDiscordLogin && accessToken && refreshToken) {
          console.log("Processing Discord login callback")
          
          // Set the session in Supabase
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (sessionError) {
            console.error("Error setting Discord session:", sessionError)
            setError("Failed to complete Discord login. Please try again.")
            return
          }
          
          // Successfully logged in with Discord
          console.log("Discord login successful")
          router.push("/?discord_login_success=true")
          return
        }
        
        // Default behavior - redirect to auth-success
        router.push("/auth-success")
      } catch (err: any) {
        console.error("Auth callback error:", err)
        setError(err.message || "Authentication failed")
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Authentication Error</h1>
          <p className="text-red-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Authenticating...</h1>
        <p className="text-blue-200">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
