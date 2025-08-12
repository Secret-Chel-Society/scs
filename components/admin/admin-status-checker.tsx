"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function AdminStatusChecker() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/check-admin-status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check admin status")
      }

      setStatus(data)
    } catch (error: any) {
      console.error("Error checking admin status:", error)
      setError(error.message || "Failed to check admin status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Admin Status Check</CardTitle>
        <CardDescription>Check your admin permissions status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : status ? (
          <div className="space-y-2">
            <p>
              <strong>Authenticated:</strong> {status.authenticated ? "Yes" : "No"}
            </p>
            <p>
              <strong>Admin:</strong> {status.isAdmin ? "Yes" : "No"}
            </p>
            {status.userId && (
              <p>
                <strong>User ID:</strong> {status.userId}
              </p>
            )}
            {status.email && (
              <p>
                <strong>Email:</strong> {status.email}
              </p>
            )}
            {status.adminRoles && (
              <div>
                <p>
                  <strong>Admin Roles:</strong>
                </p>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(status.adminRoles, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p>No status information available</p>
        )}

        <Button onClick={checkStatus} disabled={loading} className="mt-4">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
