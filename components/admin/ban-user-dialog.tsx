"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UserMinus, AlertCircle, Clock, Shield, Ban } from "lucide-react"
import { motion } from "framer-motion"

interface BanUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  userName?: string
  onBanSuccess?: () => void
}

export function BanUserDialog({ open, onOpenChange, userId, userName, onBanSuccess }: BanUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("")
  const [customDuration, setCustomDuration] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast({
        title: "Error",
        description: "No user selected for banning",
        variant: "destructive",
      })
      return
    }

    if (!banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ban reason",
        variant: "destructive",
      })
      return
    }

    const duration = banDuration === "custom" ? customDuration : banDuration

    if (!duration) {
      toast({
        title: "Error",
        description: "Please select or enter a ban duration",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          banReason: banReason.trim(),
          banDuration: duration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to ban user")
      }

      toast({
        title: "Success",
        description: `User has been banned successfully`,
      })

      // Reset form
      setBanReason("")
      setBanDuration("")
      setCustomDuration("")
      onOpenChange(false)
      onBanSuccess?.()
    } catch (error: any) {
      console.error("Ban user error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
              <UserMinus className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
            Ban User
          </DialogTitle>
          <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
            {userName ? (
              <>Ban user: <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">{userName}</span></>
            ) : (
              "Ban the selected user"
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="banReason" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-goal-red-500" />
              Ban Reason
            </Label>
            <Textarea
              id="banReason"
              placeholder="Enter the reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              required
              className="hockey-search min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="banDuration" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-ice-blue-500" />
              Ban Duration
            </Label>
            <Select value={banDuration} onValueChange={setBanDuration} required>
              <SelectTrigger className="hockey-search">
                <SelectValue placeholder="Select ban duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 day">1 Day</SelectItem>
                <SelectItem value="3 days">3 Days</SelectItem>
                <SelectItem value="1 week">1 Week</SelectItem>
                <SelectItem value="2 weeks">2 Weeks</SelectItem>
                <SelectItem value="1 month">1 Month</SelectItem>
                <SelectItem value="3 months">3 Months</SelectItem>
                <SelectItem value="6 months">6 Months</SelectItem>
                <SelectItem value="1 year">1 Year</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="custom">Custom Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {banDuration === "custom" && (
            <div className="space-y-3">
              <Label htmlFor="customDuration" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-rink-blue-500" />
                Custom Duration
              </Label>
              <Input
                id="customDuration"
                placeholder="e.g., 45 days, 2 months, 1.5 years"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                required
                className="hockey-search"
              />
              <p className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 bg-hockey-silver-100 dark:bg-hockey-silver-800 p-2 rounded">
                Examples: "45 days", "2 months", "1.5 years"
              </p>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hockey-button-enhanced"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="hockey-button-enhanced bg-goal-red-500 hover:bg-goal-red-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Ban User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
