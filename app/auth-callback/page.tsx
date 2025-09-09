"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trackLogin = async () => {
      try {
        // Wait a bit for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Track IP address for login
        const response = await fetch("/api/auth/track-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          console.log("✅ Login IP tracked successfully")
        } else {
          const errorData = await response.json()
          console.warn("⚠️ Failed to track login IP:", errorData)
        }
      } catch (error) {
        console.warn("⚠️ Error tracking login IP:", error)
      }
    }

    // Track login and then redirect
    trackLogin().finally(() => {
      router.push("/auth-success")
    })
  }, [router, supabase])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
        <p className="mt-2">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      <h1 className="mt-4 text-2xl font-bold">Authenticating...</h1>
      <p className="mt-2">Please wait while we complete your authentication.</p>
    </div>
  )
}
