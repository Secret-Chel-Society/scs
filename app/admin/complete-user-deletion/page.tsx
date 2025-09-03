"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CompleteUserDeletionPage() {
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!email) {
      setError("Email is required")
      return
    }

    if (!adminKey) {
      setError("Admin key is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/delete-user-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      setResult(data)
      toast({
        title: "User deleted",
        description: data.message,
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      setError(error.message || "An error occurred")
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Complete User Deletion</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Delete User</CardTitle>
          <CardDescription>
            This will completely remove a user from both Auth and Database systems. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert
              variant="default"
              className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                {result.message}
                <div className="mt-2 text-sm">
                  <p>Found in database: {result.dbUserFound ? "Yes" : "No"}</p>
                  <p>Found in auth system: {result.authUserFound ? "Yes" : "No"}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="adminKey" className="text-sm font-medium">
              Admin Key
            </label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleDelete}
            disabled={isLoading || !email || !adminKey}
            className="w-full"
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting User...
              </>
            ) : (
              "Delete User Completely"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
