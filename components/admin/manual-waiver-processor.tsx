"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"

export function ManualWaiverProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const handleProcessWaivers = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to process waivers",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession) {
        throw new Error("Authentication session expired")
      }

      const response = await fetch("/api/admin/process-expired-waivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshSession.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process waivers")
      }

      setLastResult(result)
      toast({
        title: "Waivers Processed",
        description: result.message || "Waiver processing completed successfully",
      })
    } catch (error: any) {
      console.error("Error processing waivers:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process waivers",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Waiver Processing</CardTitle>
        <CardDescription>
          Manually process expired waivers. This is normally done automatically by cron jobs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleProcessWaivers} disabled={isProcessing} className="w-full">
          {isProcessing ? "Processing..." : "Process Expired Waivers"}
        </Button>

        {lastResult && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Last Processing Result:</h4>
            <pre className="text-sm overflow-auto">{JSON.stringify(lastResult, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
