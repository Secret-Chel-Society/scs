"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Search, Trash2, UserCheck, RefreshCw, User, Database, Shield, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

export function UserAccountManager() {
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("search")
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }

    if (!adminKey.trim()) {
      setError("Please enter your admin key")
      return
    }

    setIsLoading(true)
    setError(null)
    setSearchResults(null)

    try {
      console.log("Searching for user:", email)

      const response = await fetch("/api/admin/search-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey: adminKey.trim(),
        }),
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to search for user`)
      }

      setSearchResults(data)
      setActiveTab("results")

      toast({
        title: "Search completed",
        description: `Found ${data.authUser ? "1" : "0"} auth user and ${data.dbUser ? "1" : "0"} database user`,
      })
    } catch (err: any) {
      console.error("Search error:", err)
      setError(err.message || "An error occurred while searching for the user")
      toast({
        title: "Search failed",
        description: err.message || "An error occurred while searching for the user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, source: string) => {
    if (!confirm(`Are you sure you want to delete this user from ${source}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, source, adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      toast({
        title: "User deleted",
        description: `User has been deleted from ${source}`,
      })

      // Refresh search results
      handleSearch()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyUser = async (userId: string) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/manual-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify user")
      }

      toast({
        title: "User verified",
        description: `User ${data.email || email} has been manually verified`,
      })

      // Refresh search results
      handleSearch()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to verify user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderUserDetails = () => {
    if (!searchResults) return null

    const hasAnyUser = searchResults.authUser || searchResults.dbUser
    const hasTokens = searchResults.verificationTokens && searchResults.verificationTokens.length > 0

    return (
      <div className="space-y-6">
        {/* Show summary first */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Search Summary
            </CardTitle>
            <CardDescription className="text-white/70">Results for: {searchResults.searchEmail}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Auth User:</span>
                <Badge variant={searchResults.authUser ? "default" : "secondary"} className={searchResults.authUser ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>
                  {searchResults.authUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Database User:</span>
                <Badge variant={searchResults.dbUser ? "default" : "secondary"} className={searchResults.dbUser ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>
                  {searchResults.dbUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Verification Tokens:</span>
                <Badge variant={hasTokens ? "warning" : "secondary"} className={hasTokens ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>
                  {hasTokens ? `${searchResults.verificationTokens.length} Found` : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchResults.authUser && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader className="bg-amber-500/10 border-amber-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-amber-400 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Supabase Auth User
                </CardTitle>
                <Badge variant={searchResults.authUser.email_confirmed_at ? "default" : "destructive"} className={searchResults.authUser.email_confirmed_at ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                  {searchResults.authUser.email_confirmed_at ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <CardDescription className="text-amber-300/80">User authentication record</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">User ID:</span>
                  <span className="col-span-2 font-mono text-sm text-white/60">{searchResults.authUser.id}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Email:</span>
                  <span className="col-span-2 text-white">{searchResults.authUser.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Created:</span>
                  <span className="col-span-2 text-white/80">{new Date(searchResults.authUser.created_at).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Last Sign In:</span>
                  <span className="col-span-2 text-white/80">
                    {searchResults.authUser.last_sign_in_at
                      ? new Date(searchResults.authUser.last_sign_in_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Email Verified:</span>
                  <span className="col-span-2 text-white/80">
                    {searchResults.authUser.email_confirmed_at
                      ? new Date(searchResults.authUser.email_confirmed_at).toLocaleString()
                      : "No"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-white/20 bg-slate-800/30 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => handleVerifyUser(searchResults.authUser.id)}
                disabled={isLoading || searchResults.authUser.email_confirmed_at}
                className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Email
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.authUser.id, "auth")}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Auth User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.dbUser && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader className="bg-blue-500/10 border-blue-500/20">
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database User
              </CardTitle>
              <CardDescription className="text-blue-300/80">User record in the database</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">User ID:</span>
                  <span className="col-span-2 font-mono text-sm text-white/60">{searchResults.dbUser.id}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Email:</span>
                  <span className="col-span-2 text-white">{searchResults.dbUser.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium text-white/80">Created:</span>
                  <span className="col-span-2 text-white/80">{new Date(searchResults.dbUser.created_at).toLocaleString()}</span>
                </div>
                {searchResults.dbUser.is_active !== undefined && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-medium text-white/80">Active:</span>
                    <span className="col-span-2 text-white/80">{searchResults.dbUser.is_active ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-white/20 bg-slate-800/30 px-6 py-4">
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.dbUser.id, "database")}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete DB User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.verificationTokens && searchResults.verificationTokens.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader className="bg-purple-500/10 border-purple-500/20">
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Verification Tokens
              </CardTitle>
              <CardDescription className="text-purple-300/80">Email verification tokens for this user</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {searchResults.verificationTokens.map((token: any, index: number) => (
                  <div key={index} className="rounded-md border border-white/20 p-4 bg-slate-800/30">
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium text-white/80">Token:</span>
                        <span className="col-span-2 font-mono text-sm truncate text-white/60">{token.token}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium text-white/80">Created:</span>
                        <span className="col-span-2 text-white/80">{new Date(token.created_at).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium text-white/80">Expires:</span>
                        <span className="col-span-2 text-white/80">{new Date(token.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-white/20 bg-slate-800/30 px-6 py-4">
              <Button variant="destructive" onClick={() => handleDeleteUser(email, "tokens")} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Tokens
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.roles && searchResults.roles.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader className="bg-green-500/10 border-green-500/20">
              <CardTitle className="text-green-400 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Roles
              </CardTitle>
              <CardDescription className="text-green-300/80">Assigned roles for this user</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {searchResults.roles.map((role: any, index: number) => (
                  <Badge key={index} variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {role.role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!searchResults.authUser && !searchResults.dbUser && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">User Not Found</AlertTitle>
            <AlertDescription className="text-red-300/80">
              No user found with email {email}. This email is available for registration.
            </AlertDescription>
          </Alert>
        )}

        {searchResults.authUser && !searchResults.dbUser && (
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Orphaned Auth User</AlertTitle>
            <AlertDescription className="text-amber-300/80">
              This user exists in Auth but not in the database. This can cause issues with login and registration.
              Consider deleting the Auth user to allow re-registration.
            </AlertDescription>
          </Alert>
        )}

        {!searchResults.authUser && searchResults.dbUser && (
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Orphaned Database User</AlertTitle>
            <AlertDescription className="text-amber-300/80">
              This user exists in the database but not in Auth. This can cause issues with login and registration.
              Consider deleting the database user to allow re-registration.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/20">
          <TabsTrigger value="search" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Search User</TabsTrigger>
          <TabsTrigger value="results" disabled={!searchResults} className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="space-y-4 pt-4">
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-400" />
                Search for User Account
              </CardTitle>
              <CardDescription className="text-white/70">Enter an email address to search for a user across all systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">User Email</Label>
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
                  placeholder="Enter your admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertTitle className="text-red-400">Error</AlertTitle>
                  <AlertDescription className="text-red-300/80">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSearch} disabled={isLoading || !email || !adminKey} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search User
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="results" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Results for: <span className="font-bold text-blue-400">{email}</span>
            </h3>
            <Button 
              variant="outline" 
              onClick={() => handleSearch()} 
              disabled={isLoading}
              className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <Separator className="bg-white/20" />
          {renderUserDetails()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
