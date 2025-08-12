"use client"

import { useState } from "react"
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fix User Constraints</h1>
          <p className="text-muted-foreground">
            Fix console constraint violations and duplicate gamer tag issues when syncing auth users
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fix User Constraints
            </CardTitle>
            <CardDescription>
              This tool will fix console values and handle duplicate gamer tags when syncing users from auth to database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleFix()
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="admin-key">Admin Verification Key</Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" disabled={isLoading || !adminKey.trim()} className="w-full">
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

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-800 mb-2">What this tool does:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Maps console values (PlayStation 5 → PS5, Xbox Series X → XSX)</li>
                <li>• Handles duplicate gamer tags by adding numbers (player1, player2, etc.)</li>
                <li>• Creates missing user, player, and role records</li>
                <li>• Skips users that already exist in the database</li>
                <li>• Provides detailed error reporting</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Fix Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{results.authUsers}</div>
                  <div className="text-sm text-muted-foreground">Auth Users Found</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">{results.usersCreated}</div>
                  <div className="text-sm text-muted-foreground">Users Created</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Console className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold">{results.consoleFixed}</div>
                  <div className="text-sm text-muted-foreground">Console Values Fixed</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Tag className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold">{results.gamerTagFixed}</div>
                  <div className="text-sm text-muted-foreground">Gamer Tags Fixed</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-semibold">{results.playersCreated}</div>
                  <div className="text-sm text-muted-foreground">Player Records Created</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{results.rolesCreated}</div>
                  <div className="text-sm text-muted-foreground">Role Records Created</div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="font-medium text-red-800">Errors ({results.errors.length})</h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
