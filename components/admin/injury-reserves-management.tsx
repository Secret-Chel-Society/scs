"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Edit, Trash2, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"

interface InjuryReserve {
  id: string
  user_id: string
  player_id: string
  team_id: string
  season_id: number
  week_start_date: string
  week_end_date: string
  week_number: number
  reason: string | null
  status: string
  created_at: string
  users: {
    id: string
    gamer_tag_id: string
  }
  teams: {
    id: string
    name: string
  }
}

export function InjuryReservesManagement() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [injuryReserves, setInjuryReserves] = useState<InjuryReserve[]>([])
  const [editingIR, setEditingIR] = useState<InjuryReserve | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [editForm, setEditForm] = useState({
    status: "",
    reason: "",
    weekStartDate: "",
    weekEndDate: "",
    weekNumber: 1,
  })

  useEffect(() => {
    fetchInjuryReserves()
  }, [])

  const fetchInjuryReserves = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/injury-reserves", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch injury reserves")
      }

      const data = await response.json()
      setInjuryReserves(data.injuryReserves || [])
    } catch (error: any) {
      console.error("Error fetching injury reserves:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load injury reserves",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditIR = (ir: InjuryReserve) => {
    setEditingIR(ir)
    setEditForm({
      status: ir.status,
      reason: ir.reason || "",
      weekStartDate: ir.week_start_date,
      weekEndDate: ir.week_end_date,
      weekNumber: ir.week_number,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingIR || !session?.access_token) return

    setSaving(true)
    try {
      const response = await fetch(`/api/injury-reserves/${editingIR.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: editForm.status,
          reason: editForm.reason.trim() || null,
          weekStartDate: editForm.weekStartDate,
          weekEndDate: editForm.weekEndDate,
          weekNumber: editForm.weekNumber,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update IR request")
      }

      toast({
        title: "Success",
        description: "Injury reserve request updated successfully",
      })

      setEditDialogOpen(false)
      setEditingIR(null)
      fetchInjuryReserves()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update IR request",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteIR = async (ir: InjuryReserve) => {
    if (!session?.access_token) return

    if (!confirm(`Are you sure you want to cancel ${ir.users.gamer_tag_id}'s IR request?`)) {
      return
    }

    try {
      const response = await fetch(`/api/injury-reserves/${ir.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel IR request")
      }

      toast({
        title: "Success",
        description: "Injury reserve request cancelled successfully",
      })

      fetchInjuryReserves()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel IR request",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive">Active</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Injury Reserves Management
          </CardTitle>
          <CardDescription>Manage all injury reserve requests across all teams and seasons</CardDescription>
        </CardHeader>
        <CardContent>
          {injuryReserves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No injury reserve requests found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {injuryReserves.map((ir) => (
                    <TableRow key={ir.id}>
                      <TableCell className="font-medium">{ir.users.gamer_tag_id}</TableCell>
                      <TableCell>{ir.teams.name}</TableCell>
                      <TableCell>Season {ir.season_id}</TableCell>
                      <TableCell>Week {ir.week_number}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(parseISO(ir.week_start_date), "MMM d")}</div>
                          <div className="text-muted-foreground">
                            to {format(parseISO(ir.week_end_date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ir.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={ir.reason || ""}>
                          {ir.reason || "No reason provided"}
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(ir.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditIR(ir)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteIR(ir)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Injury Reserve Request</DialogTitle>
            <DialogDescription>Modify the injury reserve request for {editingIR?.users.gamer_tag_id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekStartDate">Week Start Date</Label>
                <Input
                  id="weekStartDate"
                  type="date"
                  value={editForm.weekStartDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, weekStartDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekEndDate">Week End Date</Label>
                <Input
                  id="weekEndDate"
                  type="date"
                  value={editForm.weekEndDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, weekEndDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <Input
                id="weekNumber"
                type="number"
                min="1"
                value={editForm.weekNumber}
                onChange={(e) => setEditForm((prev) => ({ ...prev, weekNumber: Number.parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for injury reserve..."
                value={editForm.reason}
                onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
