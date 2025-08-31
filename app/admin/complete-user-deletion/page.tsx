"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Trash2, Shield, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <UserX className="h-8 w-8 text-red-400" />
            Complete User Deletion
          </h1>
          <p className="text-white/70 text-lg">
            Permanently remove users from both Auth and Database systems
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete User Completely
            </CardTitle>
            <CardDescription className="text-white/70">
              This will completely remove a user from both Auth and Database systems. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-400">Error</AlertTitle>
                <AlertDescription className="text-red-300/80">{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertTitle className="text-green-400">Success</AlertTitle>
                <AlertDescription className="text-green-300/80">
                  {result.message}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${result.dbUserFound ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm">Found in database: {result.dbUserFound ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${result.authUserFound ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm">Found in auth system: {result.authUserFound ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminKey" className="text-white">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleDelete}
              disabled={isLoading || !email || !adminKey}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting User...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User Completely
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6">
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <Shield className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Warning</AlertTitle>
            <AlertDescription className="text-amber-300/80">
              This action is irreversible and will permanently delete all user data including:
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li>Authentication records</li>
                <li>User profile information</li>
                <li>Team assignments</li>
                <li>Match history</li>
                <li>All associated data</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
