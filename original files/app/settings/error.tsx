"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Settings page error:", error)
  }, [error])

  // Create a safe reset function that won't fail if reset is undefined
  const handleReset = () => {
    try {
      if (typeof reset === "function") {
        reset()
      } else {
        // Fallback if reset is not a function
        window.location.reload()
      }
    } catch (e) {
      console.error("Error during reset:", e)
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              There was an error loading your settings. Please try again or contact support if the problem persists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Error: {error.message}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
            <Button onClick={handleReset}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
