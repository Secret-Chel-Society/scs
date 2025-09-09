"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Trash2, Shield, UserX, Database, Key, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { motion } from "framer-motion" - disabled due to Next.js 15.2.4 compatibility

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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-fade-in-up max-w-2xl mx-auto">
          {/* Hero Header Section */}
          <div className="relative overflow-hidden py-16 px-4 mb-8 text-center">
            <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-goal-red-200/30 to-goal-red-300/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-goal-red-500/25">
                  <Trash2 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="hockey-title text-4xl md:text-5xl mb-4">Complete User Deletion</h1>
                  <p className="hockey-subtitle text-xl md:text-2xl text-hockey-silver-600 dark:text-hockey-silver-400 max-w-2xl">
                    Permanently remove users from both Auth and Database systems
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="animate-fade-in-up mb-8">
            <Card className="hockey-card hockey-card-hover border-2 border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-800/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-goal-red-800 dark:text-goal-red-200 mb-2">
                      ⚠️ Irreversible Action Warning
                    </h3>
                    <p className="text-goal-red-700 dark:text-goal-red-300">
                      This action will completely and permanently remove a user from both the authentication system and database. 
                      All user data, roles, team associations, and history will be permanently deleted. 
                      <strong className="font-bold">This action cannot be undone.</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Deletion Form */}
          <div className="animate-fade-in-up">
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserX className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-hockey-silver-800 dark:text-hockey-silver-200">User Deletion Form</CardTitle>
                    <CardDescription className="text-lg text-hockey-silver-600 dark:text-hockey-silver-400">
                      Enter user email and admin verification key to proceed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-6">
                {/* Error Alert */}
                {error && (
                  <div
                  >
                    <Alert variant="destructive" className="border-2 border-goal-red-300 dark:border-goal-red-600 bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="text-goal-red-800 dark:text-goal-red-200 font-bold">Error</AlertTitle>
                      <AlertDescription className="text-goal-red-700 dark:text-goal-red-300">{error}</AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Success Alert */}
                {result && (
                  <div
                  >
                    <Alert className="border-2 border-assist-green-300 dark:border-assist-green-600 bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20">
                      <CheckCircle className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                      <AlertTitle className="text-assist-green-800 dark:text-assist-green-200 font-bold">Success</AlertTitle>
                      <AlertDescription className="text-assist-green-700 dark:text-assist-green-300">
                        {result.message}
                        <div className="mt-3 p-3 bg-gradient-to-r from-assist-green-100/50 to-assist-green-200/50 dark:from-assist-green-900/10 dark:to-assist-green-800/10 rounded-lg border border-assist-green-200/50 dark:border-assist-green-700/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                              <span>Database: <strong>{result.dbUserFound ? "Found & Deleted" : "Not Found"}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                              <span>Auth System: <strong>{result.authUserFound ? "Found & Deleted" : "Not Found"}</strong></span>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-3">
                  <label htmlFor="email" className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <UserX className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hockey-search h-14 text-lg border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                    Enter the email address of the user you want to completely delete from the system.
                  </p>
                </div>

                {/* Admin Key Input */}
                <div className="space-y-3">
                  <label htmlFor="adminKey" className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                    <Key className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    Admin Verification Key
                  </label>
                  <Input
                    id="adminKey"
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="hockey-search h-14 text-lg border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 focus:border-hockey-silver-500 dark:focus:border-hockey-silver-500 focus:ring-4 focus:ring-hockey-silver-500/20 dark:focus:ring-hockey-silver-500/20 transition-all duration-300"
                  />
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 p-2 bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-200/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-800/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                    Enter your admin verification key to confirm this destructive action.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="relative z-10 pt-6 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                <Button
                  onClick={handleDelete}
                  disabled={isLoading || !email || !adminKey}
                  className="w-full h-14 text-lg hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-goal-red-300 dark:border-goal-red-600"
                  variant="destructive"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Deleting User...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-3 h-5 w-5" />
                      Delete User Completely
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-8 animate-fade-in-up">
            <Card className="hockey-card hockey-card-hover border-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-r from-hockey-silver-50/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-800/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-3">
                      What Happens During Deletion?
                    </h3>
                    <div className="space-y-2 text-sm text-hockey-silver-700 dark:text-hockey-silver-300">
                      <p>• User account is permanently removed from the authentication system</p>
                      <p>• All user data is deleted from the database</p>
                      <p>• User roles and permissions are completely removed</p>
                      <p>• Team associations and player records are deleted</p>
                      <p>• Forum posts, comments, and activity history are removed</p>
                      <p>• All related records across all tables are permanently deleted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
