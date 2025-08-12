"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface RecalculateStandingsButtonProps {
  seasonId: number
  onSuccess?: () => void
}

export function RecalculateStandingsButton({ seasonId, onSuccess }: RecalculateStandingsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleRecalculate = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/recalculate-standings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seasonId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to recalculate standings")
      }

      toast({
        title: "Success",
        description: "Standings have been recalculated successfully.",
      })

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error recalculating standings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate standings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleRecalculate} disabled={isLoading} variant="outline" className="flex items-center gap-2">
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Recalculating..." : "Recalculate Standings"}
    </Button>
  )
}
