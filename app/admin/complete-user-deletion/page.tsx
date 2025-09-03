"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Trash2, Shield, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl">
                <UserX className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Complete User Deletion
              </h1>
            </motion.div>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Permanently remove users from both Auth and Database systems. This action cannot be undone.
            </p>
            <div className="h-1 w-40 bg-gradient-to-r from-red-500 to-transparent rounded-full mx-auto mt-6" />
          </div>

          {/* Enhanced Warning Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-red-500/10 backdrop-blur-sm border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-300 mb-2">⚠️ Critical Warning</h3>
                    <p className="text-red-200 text-sm leading-relaxed">
                      This tool will completely and permanently remove a user from the system. This includes:
                    </p>
                    <ul className="text-red-200 text-sm mt-2 space-y-1 list-disc list-inside">
                      <li>All user data and records</li>
                      <li>Authentication credentials</li>
                      <li>Team associations and statistics</li>
                      <li>All related database entries</li>
                    </ul>
                    <p className="text-red-300 font-medium mt-3">
                      This action cannot be undone. Please ensure you have the correct email address.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader className="border-b border-white/20 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Trash2 className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">Delete User</CardTitle>
                    <CardDescription className="text-white/70">
                      Enter the user's email and admin key to proceed with deletion
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <AlertTitle className="text-red-400">Error</AlertTitle>
                      <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-green-500/10 border-green-500/30">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <AlertTitle className="text-green-400">Success</AlertTitle>
                      <AlertDescription className="text-green-300">
                        {result.message}
                        <div className="mt-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                          <p className="text-sm text-green-200">
                            <span className="font-medium">Found in database:</span> {result.dbUserFound ? "Yes" : "No"}
                          </p>
                          <p className="text-sm text-green-200">
                            <span className="font-medium">Found in auth system:</span> {result.authUserFound ? "Yes" : "No"}
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <label htmlFor="email" className="text-sm font-medium text-white">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-500/50"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="adminKey" className="text-sm font-medium text-white">
                    Admin Key
                  </label>
                  <Input
                    id="adminKey"
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-500/50"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/20 pt-6">
                <Button
                  onClick={handleDelete}
                  disabled={isLoading || !email || !adminKey}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  variant="destructive"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Deleting User...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Delete User Completely
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
