"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function AuthReset() {
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const clearAuth = async () => {
    setIsClearing(true)
    setMessage("Clearing authentication data...")

    try {
      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear local storage
      localStorage.clear()

      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.trim().split("=")
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      setMessage("Authentication data cleared successfully. Redirecting to home page...")

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Error clearing auth data:", error)
      setMessage("Error clearing authentication data. Please try again.")
    } finally {
      setIsClearing(false)
    }
  }

  useEffect(() => {
    // Auto-clear on page load
    clearAuth()
  }, [])

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Reset</CardTitle>
          <CardDescription>Clearing authentication data to fix token issues</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            {isClearing && (
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/")} className="w-full" disabled={isClearing}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
