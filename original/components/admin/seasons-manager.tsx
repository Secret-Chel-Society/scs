"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { CheckCircle, Edit, Plus, Trash } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/ui/date-picker"

interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at?: string
}

export function SeasonsManager() {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  })

  // Fetch seasons
  const fetchSeasons = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if seasons table exists
      const { error: checkError } = await supabase.from("seasons").select("id").limit(1)

      if (checkError && checkError.message.includes("does not exist")) {
        setError("Seasons table does not exist. Please run the seasons table migration first.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("seasons").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setSeasons(data || [])
    } catch (error: any) {
      console.error("Error fetching seasons:", error)
      setError(`Failed to load seasons: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      name: "",
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    })
    setIsCreateDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (season: Season) => {
    setCurrentSeason(season)
    setFormData({
      name: season.name,
      startDate: new Date(season.start_date),
      endDate: new Date(season.end_date),
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (season: Season) => {
    setCurrentSeason(season)
    setIsDeleteDialogOpen(true)
  }

  // Create season
  const createSeason = async () => {
    try {
      const { data, error } = await supabase
        .from("seasons")
        .insert({
          name: formData.name,
          start_date: formData.startDate.toISOString(),
          end_date: formData.endDate.toISOString(),
          is_active: false,
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: `Season "${formData.name}" created successfully`,
      })

      setIsCreateDialogOpen(false)
      fetchSeasons()
    } catch (error: any) {
      console.error("Error creating season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create season",
        variant: "destructive",
      })
    }
  }

  // Update season
  const updateSeason = async () => {
    if (!currentSeason) return

    try {
      const { error } = await supabase
        .from("seasons")
        .update({
          name: formData.name,
          start_date: formData.startDate.toISOString(),
          end_date: formData.endDate.toISOString(),
        })
        .eq("id", currentSeason.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Season "${formData.name}" updated successfully`,
      })

      setIsEditDialogOpen(false)
      fetchSeasons()
    } catch (error: any) {
      console.error("Error updating season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update season",
        variant: "destructive",
      })
    }
  }

  // Delete season
  const deleteSeason = async () => {
    if (!currentSeason) return

    try {
      // Check if this is the active season
      if (currentSeason.is_active) {
        toast({
          title: "Error",
          description: "Cannot delete the active season. Please set another season as active first.",
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        return
      }

      const { error } = await supabase.from("seasons").delete().eq("id", currentSeason.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Season "${currentSeason.name}" deleted successfully`,
      })

      setIsDeleteDialogOpen(false)
      fetchSeasons()
    } catch (error: any) {
      console.error("Error deleting season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete season",
        variant: "destructive",
      })
    }
  }

  // Set active season
  const setActiveSeason = async (season: Season) => {
    try {
      // First, set all seasons to inactive
      const { error: updateAllError } = await supabase
        .from("seasons")
        .update({ is_active: false })
        .neq("id", "placeholder") // Update all rows

      if (updateAllError) throw updateAllError

      // Then set the selected season to active
      const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", season.id)

      if (error) throw error

      // Update system_settings if it exists
      try {
        await supabase
          .from("system_settings")
          .upsert({ key: "current_season", value: season.id })
          .eq("key", "current_season")
      } catch (settingsError) {
        console.log("Could not update system_settings, but season was set active:", settingsError)
      }

      toast({
        title: "Success",
        description: `Season "${season.name}" is now the active season`,
      })

      fetchSeasons()
    } catch (error: any) {
      console.error("Error setting active season:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to set active season",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seasons Management</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Season
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No seasons found. Create your first season to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell>{season.name}</TableCell>
                    <TableCell>{format(new Date(season.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(season.end_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {season.is_active ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" /> Active
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setActiveSeason(season)}>
                          Set Active
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(season)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(season)}
                          disabled={season.is_active}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Season Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Season</DialogTitle>
            <DialogDescription>
              Add a new season to the system. You can set it as active after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Season Name</Label>
              <Input
                id="name"
                placeholder="e.g., Season 5"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker date={formData.startDate} setDate={(date) => handleInputChange("startDate", date)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker date={formData.endDate} setDate={(date) => handleInputChange("endDate", date)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createSeason}>Create Season</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Season Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Season</DialogTitle>
            <DialogDescription>Update the details for this season.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Season Name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <DatePicker date={formData.startDate} setDate={(date) => handleInputChange("startDate", date)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <DatePicker date={formData.endDate} setDate={(date) => handleInputChange("endDate", date)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateSeason}>Update Season</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Season</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this season? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSeason}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
