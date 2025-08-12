"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, RefreshCw, Key } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PasswordResetForm() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load saved admin key if available
  useState(() => {
    const savedKey = localStorage.getItem("mghl-admin-key")
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
      localStorage.setItem("mghl-admin-key", adminKey)

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset User Password</CardTitle>
        <CardDescription>Reset a user's password by email address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
