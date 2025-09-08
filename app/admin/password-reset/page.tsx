"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert, Shield, Key, Mail, Lock, Eye, EyeOff, Users, Settings, RefreshCw, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPasswordResetPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAdminKey, setShowAdminKey] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate inputs
    if (!email) {
      setError("Email is required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!adminKey) {
      setError("Admin verification key is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/admin-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setIsSuccess(true)

      toast({
        title: "Password updated",
        description: `Password for ${email} has been successfully updated.`,
      })
    } catch (error: any) {
      console.error("Error resetting password:", error)
      setError(error.message || "Failed to reset password. Please try again.")

      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        {/* Enhanced Hero Header Section */}
        <div className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-assist-green-500/20 to-assist-green-500/20 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full shadow-2xl shadow-assist-green-500/30">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="hockey-title mb-4">
              Password Updated Successfully
            </h1>
            <p className="hockey-subtitle mb-8">
              The password for {email} has been successfully updated and the user can now log in with their new credentials.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                Password Reset Complete
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">The user account has been successfully updated</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10 rounded-lg">
                  <Mail className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                  <div>
                    <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">User Email</div>
                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/30 dark:from-hockey-silver-900 dark:to-assist-green-900/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                  <div>
                    <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Status</div>
                    <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Password successfully updated</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-6">
              <Button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail("")
                  setPassword("")
                  setConfirmPassword("")
                  setAdminKey("")
                }}
                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Another Password
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <ShieldAlert className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            Admin Password Reset
          </h1>
          <p className="hockey-subtitle mb-8">
            Reset a user's password directly by email address with admin verification
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Shield className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Admin Only</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/50 dark:border-assist-green-700/50">
              <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">User Management</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-rink-blue-100/50 to-rink-blue-100/50 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-rink-blue-200/50 dark:border-rink-blue-700/50">
              <Key className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Secure Reset</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <Settings className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Direct Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              Admin Password Reset
            </CardTitle>
            <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Reset a user's password directly by email</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  User Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ice-blue-600 dark:text-ice-blue-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">Password must be at least 8 characters long</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ice-blue-600 dark:text-ice-blue-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="adminKey" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Key className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Admin Verification Key
                </Label>
                <div className="relative">
                  <Input
                    id="adminKey"
                    type={showAdminKey ? "text" : "password"}
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ice-blue-600 dark:text-ice-blue-400"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                  >
                    {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                  <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
