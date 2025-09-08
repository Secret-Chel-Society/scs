"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, RefreshCw, Key, Shield, Users, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PasswordResetForm() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAdminKey, setShowAdminKey] = useState(false)

  // Load saved admin key if available
  useState(() => {
    const savedKey = localStorage.getItem("scs-admin-key")
    if (savedKey) {
      setAdminKey(savedKey)
    }
  })

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the user's email address",
        variant: "destructive",
      })
      return
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a new password",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "The password and confirmation don't match",
        variant: "destructive",
      })
      return
    }

    if (!adminKey.trim()) {
      toast({
        title: "Admin key required",
        description: "Please enter your admin key",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      // Save admin key for future use
      localStorage.setItem("scs-admin-key", adminKey)

      const response = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          adminKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setResult({
        success: true,
        message: `Password for ${email} has been reset successfully`,
      })

      // Clear form fields
      setPassword("")
      setConfirmPassword("")

      toast({
        title: "Password Reset Successful",
        description: `Password for ${email} has been reset successfully`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error resetting password:", error)

      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to reset password",
      })

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
          <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          Reset User Password
        </CardTitle>
        <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Reset a user's password by email address</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              User Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                required
                minLength={6}
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <Label htmlFor="admin-key" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Key className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              Admin Key
            </Label>
            <div className="relative">
              <Input
                id="admin-key"
                type={showAdminKey ? "text" : "password"}
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
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

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className={`hockey-card ${result.success 
              ? "border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20" 
              : "border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20"
            }`}>
              {result.success ? <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" /> : <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />}
              <AlertTitle className="text-hockey-silver-800 dark:text-hockey-silver-200">{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{result.message}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" 
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting Password...
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
  )
}
