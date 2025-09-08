"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminProtectedProps {
  children: React.ReactNode
}

export function AdminProtected({ children }: AdminProtectedProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const { supabase, session } = useSupabase()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (retryCount >= 5) {
        setError("Maximum retry attempts reached. Please refresh the page or try again later.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Check if user is logged in
        if (!session?.user) {
          router.push("/login?message=You must be logged in to access this page&redirect=/admin/migrations")
          return
        }

        // Check if user has admin role
        try {
          // Check user_roles table for Admin role
          const { data: adminRole, error: adminError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "Admin")
            .single();

          if (adminError && adminError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw adminError;
          }
          
          if (adminRole) {
            setIsAdmin(true);
            setIsLoading(false);
          } else {
            router.push("/unauthorized?message=Admin access required");
          }
        } catch (error: any) {
          console.error("Error checking admin status:", error);
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds

          // Handle rate limiting errors
          if (
            error.message.includes("Rate limit") ||
            error.message.includes("Too Many") ||
            error.message.includes("429")
          ) {
            console.error("Rate limit error checking admin status:", error)
            setError(`Rate limit exceeded. Retrying in ${Math.ceil(retryDelay / 1000)} seconds...`)

            // Auto-retry with exponential backoff
            setTimeout(() => {
              setRetryCount((prev) => prev + 1)
            }, retryDelay)
            return
          } else {
            throw error
          }
        }
      } catch (err: any) {
        console.error("Error checking admin status:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [router, session, supabase, retryCount])

  // Manual retry function
  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {retryCount > 0 && <div className="text-sm text-muted-foreground mt-2">Retry attempt: {retryCount}/5</div>}
            <div className="mt-4 flex gap-2">
              <Button onClick={handleManualRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} variant="outline">
                Return to Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Only render children if user is admin
  return isAdmin ? <>{children}</> : null
}
