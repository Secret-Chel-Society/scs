// Midnight Studios INTl - All rights reserved
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/client'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, session } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Check if user is logged in
        if (!session?.user) {
          router.push("/login?message=You must be logged in to access this page&redirect=/management")
          return
        }

        // Check if user has a team (GM, AGM, or Owner role)
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("role, team_id")
          .eq("user_id", session.user.id)
          .in("role", ["GM", "AGM", "Owner"])
          .single()

        if (playerError || !playerData) {
          setError("You don't have permission to access the management area")
          setIsAuthorized(false)
          return
        }

        // If we get here, user is authorized
        setIsAuthorized(true)
      } catch (err) {
        console.error("Authorization error:", err)
        setError("An error occurred while checking your permissions")
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthorization()
  }, [session, router, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p>Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            {error || "You don't have permission to access this page"}
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
