"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Search, Trash2, UserCheck, RefreshCw, Shield, Users, Database, Key, AlertTriangle, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

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
        <Card className="hockey-enhanced-card">
          <CardHeader>
            <CardTitle className="text-xl text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              Search Summary
            </CardTitle>
            <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
              Results for: {searchResults.searchEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Auth User:</span>
                <Badge className={searchResults.authUser ? "bg-assist-green-500 text-white" : "bg-hockey-silver-500 text-white"}>
                  {searchResults.authUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Database User:</span>
                <Badge className={searchResults.dbUser ? "bg-assist-green-500 text-white" : "bg-hockey-silver-500 text-white"}>
                  {searchResults.dbUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Verification Tokens:</span>
                <Badge className={hasTokens ? "bg-ice-blue-500 text-white" : "bg-hockey-silver-500 text-white"}>
                  {hasTokens ? `${searchResults.verificationTokens.length} Found` : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchResults.authUser && (
          <Card>
            <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-amber-700 dark:text-amber-400">Supabase Auth User</CardTitle>
                <Badge variant={searchResults.authUser.email_confirmed_at ? "success" : "destructive"}>
                  {searchResults.authUser.email_confirmed_at ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <CardDescription>User authentication record</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">User ID:</span>
                  <span className="col-span-2 font-mono text-sm">{searchResults.authUser.id}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Email:</span>
                  <span className="col-span-2">{searchResults.authUser.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Created:</span>
                  <span className="col-span-2">{new Date(searchResults.authUser.created_at).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Last Sign In:</span>
                  <span className="col-span-2">
                    {searchResults.authUser.last_sign_in_at
                      ? new Date(searchResults.authUser.last_sign_in_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Email Verified:</span>
                  <span className="col-span-2">
                    {searchResults.authUser.email_confirmed_at
                      ? new Date(searchResults.authUser.email_confirmed_at).toLocaleString()
                      : "No"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => handleVerifyUser(searchResults.authUser.id)}
                disabled={isLoading || searchResults.authUser.email_confirmed_at}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Email
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.authUser.id, "auth")}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Auth User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.dbUser && (
          <Card>
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="text-blue-700 dark:text-blue-400">Database User</CardTitle>
              <CardDescription>User record in the database</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">User ID:</span>
                  <span className="col-span-2 font-mono text-sm">{searchResults.dbUser.id}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Email:</span>
                  <span className="col-span-2">{searchResults.dbUser.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Created:</span>
                  <span className="col-span-2">{new Date(searchResults.dbUser.created_at).toLocaleString()}</span>
                </div>
                {searchResults.dbUser.is_active !== undefined && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-medium">Active:</span>
                    <span className="col-span-2">{searchResults.dbUser.is_active ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/20 px-6 py-4">
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.dbUser.id, "database")}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete DB User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.verificationTokens && searchResults.verificationTokens.length > 0 && (
          <Card>
            <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
              <CardTitle className="text-purple-700 dark:text-purple-400">Verification Tokens</CardTitle>
              <CardDescription>Email verification tokens for this user</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {searchResults.verificationTokens.map((token: any, index: number) => (
                  <div key={index} className="rounded-md border p-4">
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Token:</span>
                        <span className="col-span-2 font-mono text-sm truncate">{token.token}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Created:</span>
                        <span className="col-span-2">{new Date(token.created_at).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Expires:</span>
                        <span className="col-span-2">{new Date(token.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/20 px-6 py-4">
              <Button variant="destructive" onClick={() => handleDeleteUser(email, "tokens")} disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Tokens
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.roles && searchResults.roles.length > 0 && (
          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="text-green-700 dark:text-green-400">User Roles</CardTitle>
              <CardDescription>Assigned roles for this user</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {searchResults.roles.map((role: any, index: number) => (
                  <Badge key={index} variant="outline" className="bg-green-100 dark:bg-green-900/30">
                    {role.role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!searchResults.authUser && !searchResults.dbUser && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>User Not Found</AlertTitle>
            <AlertDescription>
              No user found with email {email}. This email is available for registration.
            </AlertDescription>
          </Alert>
        )}

        {searchResults.authUser && !searchResults.dbUser && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Orphaned Auth User</AlertTitle>
            <AlertDescription>
              This user exists in Auth but not in the database. This can cause issues with login and registration.
              Consider deleting the Auth user to allow re-registration.
            </AlertDescription>
          </Alert>
        )}

        {!searchResults.authUser && searchResults.dbUser && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Orphaned Database User</AlertTitle>
            <AlertDescription>
              This user exists in the database but not in Auth. This can cause issues with login and registration.
              Consider deleting the database user to allow re-registration.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-2 p-2 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded-xl">
              <TabsTrigger 
                value="search" 
                className="px-6 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Search className="mr-2 h-4 w-4" />
                Search User
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!searchResults}
                className="px-6 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Users className="mr-2 h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>
        <TabsContent value="search" className="space-y-4 pt-4">
          <Card className="hockey-enhanced-card">
            <CardHeader>
              <CardTitle className="text-2xl text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                Search for User Account
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Enter an email address to search for a user across all systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label htmlFor="email" className="text-sm font-medium text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-assist-green-500" />
                  User Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="hockey-search"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="adminKey" className="text-sm font-medium text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-2">
                  <Key className="h-4 w-4 text-ice-blue-500" />
                  Admin Key
                </label>
                <Input
                  id="adminKey"
                  type="password"
                  placeholder="Enter your admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="hockey-search"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="hockey-enhanced-card border-goal-red-200 dark:border-goal-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-hockey-silver-900 dark:text-hockey-silver-100">Error</AlertTitle>
                  <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSearch} disabled={isLoading || !email || !adminKey} className="w-full hockey-button-enhanced bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white">
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
            <h3 className="text-lg font-medium text-hockey-silver-900 dark:text-hockey-silver-100">
              Results for: <span className="font-bold text-ice-blue-600 dark:text-ice-blue-400">{email}</span>
            </h3>
            <Button variant="outline" onClick={() => handleSearch()} disabled={isLoading} className="hockey-button-enhanced">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <Separator className="bg-hockey-silver-200 dark:bg-hockey-silver-700" />
          {renderUserDetails()}
        </TabsContent>
      </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
