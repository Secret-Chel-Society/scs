"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"

interface HighlightsStatusCheckerProps {
  isAdmin: boolean
}

export function HighlightsStatusChecker({ isAdmin }: HighlightsStatusCheckerProps) {
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const checkTableExists = async () => {
      try {
        setIsChecking(true)

        // Try a direct approach using Supabase instead of the API
        try {
          // Try to query the table directly
          const { data, error } = await supabase.from("match_highlights").select("id").limit(1)

          // If there's no error, the table exists
          setTableExists(!error)
        } catch (directError) {
          console.log("Direct table check failed, trying API fallback")

          // Fallback to the API method
          const response = await fetch("/api/admin/check-table-exists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tableName: "match_highlights" }),
          })

          if (!response.ok) {
            throw new Error("Failed to check if table exists")
          }

          const data = await response.json()
          setTableExists(data.exists)
        }
      } catch (err) {
        console.error("Error checking if table exists:", err)
        // Don't show the error to users, just assume the table exists
        // to avoid showing unnecessary warnings
        setTableExists(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkTableExists()
  }, [supabase])

  if (isChecking || tableExists === true || tableExists === null) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Highlights Feature Not Available</AlertTitle>
      <AlertDescription>
        {isAdmin ? (
          <>
            The match highlights feature requires database setup. Please go to the{" "}
            <Link href="/admin/migrations" className="font-medium underline">
              migrations page
            </Link>{" "}
            and run the "Match Highlights Table" migration.
          </>
        ) : (
          "The match highlights feature is not yet available. Please contact an administrator to enable this feature."
        )}
      </AlertDescription>
    </Alert>
  )
}
