"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, MessageSquare } from "lucide-react"
import { format } from "date-fns"

interface BanInfo {
  is_banned: boolean
  ban_reason: string | null
  ban_expiration: string | null
  created_at: string | null
}

export function BannedUserModal() {
  const { supabase, session } = useSupabase()
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    const checkBanStatus = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_banned, ban_reason, ban_expiration, created_at")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error checking ban status:", error)
          return
        }

        // Check if user is banned OR has ban info (even if is_banned is false)
        const isBanned = data?.is_banned || (data?.ban_reason && data?.ban_expiration)

        if (isBanned) {
          // Check if ban is still active (not expired)
          const isActive = !data.ban_expiration || new Date(data.ban_expiration) > new Date()

          if (isActive) {
            setBanInfo({
              ...data,
              is_banned: true, // Force to true if they have active ban info
            })
            setIsOpen(true)
          }
        }
      } catch (error) {
        console.error("Error in checkBanStatus:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkBanStatus()
  }, [session, supabase])

  if (!banInfo?.is_banned) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified"
    try {
      return format(new Date(dateString), "PPP 'at' p")
    } catch {
      return "Invalid date"
    }
  }

  const isTemporaryBan = banInfo.ban_expiration && new Date(banInfo.ban_expiration) > new Date()
  const isPermanentBan = !banInfo.ban_expiration

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Account Suspended
          </DialogTitle>
          <DialogDescription>Your account has been suspended from the Major Gaming Hockey League.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{isTemporaryBan ? "Temporary Suspension" : "Permanent Suspension"}</AlertTitle>
            <AlertDescription>
              You are currently unable to access league features including registration, bidding, and team management.
            </AlertDescription>
          </Alert>

          {banInfo.ban_reason && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Reason for Suspension
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm">{banInfo.ban_reason}</div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Suspension Details
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {banInfo.created_at && (
                <div>
                  <span className="font-medium">Suspended on:</span> {formatDate(banInfo.created_at)}
                </div>
              )}
              {isTemporaryBan ? (
                <div>
                  <span className="font-medium">Expires on:</span> {formatDate(banInfo.ban_expiration)}
                </div>
              ) : (
                <div className="text-destructive font-medium">This is a permanent suspension.</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this suspension was issued in error or would like to appeal, please contact league
              administration.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://discord.gg/mghl", "_blank")}
                className="flex-1"
              >
                Contact on Discord
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
