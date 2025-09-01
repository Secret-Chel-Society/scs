"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function AuthSuccessPage() {
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(true)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function createPlayerRecord() {
      try {
        // Create player record
        const response = await fetch("/api/auth/create-player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create player record")
        }

        setMessage(data.message || "Your account has been set up successfully!")
        setIsCreatingPlayer(false)

        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push("/")
        }, 3000)
      } catch (error) {
        console.error("Error creating player record:", error)
        setMessage(error instanceof Error ? error.message : "Failed to create player record")
        setIsCreatingPlayer(false)
      }
    }

    createPlayerRecord()
  }, [router])

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Setup</CardTitle>
          <CardDescription>Setting up your player profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreatingPlayer ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-center text-muted-foreground">Setting up your player profile...</p>
            </div>
          ) : (
            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isCreatingPlayer && (
            <p className="text-sm text-muted-foreground">
              Redirecting to home page... If you are not redirected,{" "}
              <Link href="/" className="text-primary hover:underline">
                click here
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
