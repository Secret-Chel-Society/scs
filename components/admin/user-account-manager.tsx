"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  Search, 
  Trash2, 
  UserCheck, 
  RefreshCw,
  Shield,
  Database,
  Key,
  Mail,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserX,
  Zap
} from "lucide-react"
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
        <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Search Summary
                </CardTitle>
                <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                  Results for: <span className="font-semibold text-ice-blue-600 dark:text-ice-blue-400">{searchResults.searchEmail}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Auth User:
                </span>
                <Badge className={`px-3 py-1 text-sm font-medium ${
                  searchResults.authUser 
                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                    : "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500 text-white"
                }`}>
                  {searchResults.authUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Database className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                  Database User:
                </span>
                <Badge className={`px-3 py-1 text-sm font-medium ${
                  searchResults.dbUser 
                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                    : "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500 text-white"
                }`}>
                  {searchResults.dbUser ? "Found" : "Not Found"}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Key className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  Verification Tokens:
                </span>
                <Badge className={`px-3 py-1 text-sm font-medium ${
                  hasTokens 
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                    : "bg-gradient-to-r from-hockey-silver-400 to-hockey-silver-500 text-white"
                }`}>
                  {hasTokens ? `${searchResults.verificationTokens.length} Found` : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchResults.authUser && (
          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardHeader className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Supabase Auth User</CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">User authentication record</CardDescription>
                  </div>
                </div>
                <Badge className={`px-3 py-1 text-sm font-medium ${
                  searchResults.authUser.email_confirmed_at 
                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                    : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                }`}>
                  {searchResults.authUser.email_confirmed_at ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">User ID:</span>
                  </div>
                  <span className="font-mono text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{searchResults.authUser.id}</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Email:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{searchResults.authUser.email}</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Created:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(searchResults.authUser.created_at).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Last Sign In:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    {searchResults.authUser.last_sign_in_at
                      ? new Date(searchResults.authUser.last_sign_in_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="p-3 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    {searchResults.authUser.email_confirmed_at ? (
                      <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    )}
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Email Verified:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    {searchResults.authUser.email_confirmed_at
                      ? new Date(searchResults.authUser.email_confirmed_at).toLocaleString()
                      : "No"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-50/20 to-rink-blue-50/20 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => handleVerifyUser(searchResults.authUser.id)}
                disabled={isLoading || searchResults.authUser.email_confirmed_at}
                className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Email
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.authUser.id, "auth")}
                disabled={isLoading}
                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Auth User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.dbUser && (
          <Card className="hockey-card hockey-card-hover border-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-rink-blue-500/10">
            <CardHeader className="bg-gradient-to-r from-rink-blue-50/50 to-rink-blue-100/50 dark:from-rink-blue-900/10 dark:to-rink-blue-800/20 border-b-2 border-rink-blue-200/50 dark:border-rink-blue-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-rink-blue-500/25">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Database User</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">User record in the database</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="p-3 bg-gradient-to-r from-rink-blue-50/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-800/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">User ID:</span>
                  </div>
                  <span className="font-mono text-sm text-hockey-silver-700 dark:text-hockey-silver-300">{searchResults.dbUser.id}</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-rink-blue-50/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-800/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Email:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{searchResults.dbUser.email}</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-rink-blue-50/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-800/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
                    <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Created:</span>
                  </div>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(searchResults.dbUser.created_at).toLocaleString()}</span>
                </div>
                {searchResults.dbUser.is_active !== undefined && (
                  <div className="p-3 bg-gradient-to-r from-rink-blue-50/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-800/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      {searchResults.dbUser.is_active ? (
                        <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                      )}
                      <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Active:</span>
                    </div>
                    <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{searchResults.dbUser.is_active ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t-2 border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-rink-blue-50/20 to-rink-blue-100/20 dark:from-rink-blue-900/10 dark:to-rink-blue-800/10 px-6 py-4">
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(searchResults.dbUser.id, "database")}
                disabled={isLoading}
                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete DB User
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.verificationTokens && searchResults.verificationTokens.length > 0 && (
          <Card className="hockey-card hockey-card-hover border-2 border-goal-red-200/50 dark:border-goal-red-700/50 shadow-lg shadow-goal-red-500/10">
            <CardHeader className="bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/10 dark:to-goal-red-800/20 border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-goal-red-500/25">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Verification Tokens</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Email verification tokens for this user</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {searchResults.verificationTokens.map((token: any, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-800/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                    <div className="space-y-3">
                      <div className="p-2 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-3 w-3 text-goal-red-600 dark:text-goal-red-400" />
                          <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 text-sm">Token:</span>
                        </div>
                        <span className="font-mono text-xs text-hockey-silver-700 dark:text-hockey-silver-300 break-all">{token.token}</span>
                      </div>
                      <div className="p-2 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-ice-blue-600 dark:text-ice-blue-400" />
                          <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 text-sm">Created:</span>
                        </div>
                        <span className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(token.created_at).toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          <span className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 text-sm">Expires:</span>
                        </div>
                        <span className="text-xs text-hockey-silver-700 dark:text-hockey-silver-300">{new Date(token.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/20 to-goal-red-100/20 dark:from-goal-red-900/10 dark:to-goal-red-800/10 px-6 py-4">
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteUser(email, "tokens")} 
                disabled={isLoading}
                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Tokens
              </Button>
            </CardFooter>
          </Card>
        )}

        {searchResults.roles && searchResults.roles.length > 0 && (
          <Card className="hockey-card hockey-card-hover border-2 border-assist-green-200/50 dark:border-assist-green-700/50 shadow-lg shadow-assist-green-500/10">
            <CardHeader className="bg-gradient-to-r from-assist-green-50/50 to-assist-green-100/50 dark:from-assist-green-900/10 dark:to-assist-green-800/20 border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">User Roles</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Assigned roles for this user</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {searchResults.roles.map((role: any, index: number) => (
                  <Badge key={index} className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
                    {role.role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!searchResults.authUser && !searchResults.dbUser && (
          <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
            <UserX className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
            <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">User Not Found</AlertTitle>
            <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">
              No user found with email {email}. This email is available for registration.
            </AlertDescription>
          </Alert>
        )}

        {searchResults.authUser && !searchResults.dbUser && (
          <Alert className="border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Orphaned Auth User</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              This user exists in Auth but not in the database. This can cause issues with login and registration.
              Consider deleting the Auth user to allow re-registration.
            </AlertDescription>
          </Alert>
        )}

        {!searchResults.authUser && searchResults.dbUser && (
          <Alert className="border-2 border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Orphaned Database User</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
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
        <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <TabsTrigger 
              value="search" 
              className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Search className="h-4 w-4" />
              Search User
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              disabled={!searchResults}
              className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Eye className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-6 p-6">
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                      Search for User Account
                    </CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Enter an email address to search for a user across all systems
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                      User Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="hockey-search h-12 text-base border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="adminKey" className="flex items-center gap-2 text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <Key className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                      Admin Key
                    </label>
                    <Input
                      id="adminKey"
                      type="password"
                      placeholder="Enter your admin key"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="hockey-search h-12 text-base border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
                    />
                  </div>
                  {error && (
                    <Alert className="border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                      <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                      <AlertTitle className="text-goal-red-800 dark:text-goal-red-200">Error</AlertTitle>
                      <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-6 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 relative z-10">
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !email || !adminKey} 
                  className="w-full h-12 text-lg hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
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
          <TabsContent value="results" className="space-y-6 p-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-assist-green-500/25">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    Results for: <span className="text-ice-blue-600 dark:text-ice-blue-400">{email}</span>
                  </h3>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">User account information and management options</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleSearch()} 
                disabled={isLoading}
                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <Separator className="border-ice-blue-200/50 dark:border-rink-blue-700/50" />
            {renderUserDetails()}
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
