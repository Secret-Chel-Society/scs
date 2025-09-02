"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle } from "lucide-react"

interface CompleteGameButtonProps {
  matchId: string
  onComplete: () => void
  className?: string
}

export function CompleteGameButton({ matchId, onComplete, className = "" }: CompleteGameButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleComplete = async () => {
    try {
      setIsSubmitting(true)

      // Call API to update match status
      const response = await fetch("/api/matches/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          status: "completed",
        }),
      })

      if (response.ok) {
        toast({
          title: "Match completed",
          description: "The match has been marked as completed.",
          variant: "default",
        })
        onComplete()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update match status")
      }
    } catch (error: any) {
      console.error("Error completing match:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to complete the match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsConfirmOpen(true)} className={className} disabled={isSubmitting}>
        <CheckCircle className="mr-2 h-4 w-4" />
        {isSubmitting ? "Processing..." : "Complete Match"}
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this match as completed? This will finalize the score and statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleComplete()
              }}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Processing..." : "Complete Match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
