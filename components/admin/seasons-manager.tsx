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
import { CheckCircle, Edit, Plus, Trash, Calendar, Trophy, Settings, Clock, Star, Shield } from "lucide-react"
import { motion } from "framer-motion"
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
      console.log("🔄 Setting active season:", season.name)
      
      // First, set all seasons to inactive
      console.log("Step 1: Setting all seasons to inactive...")
      const { error: updateAllError } = await supabase
        .from("seasons")
        .update({ is_active: false })

      if (updateAllError) {
        console.error("❌ Error setting all seasons inactive:", updateAllError)
        throw updateAllError
      }
      console.log("✅ All seasons set to inactive")

      // Then set the selected season to active
      console.log("Step 2: Setting target season to active...")
      const { error: updateTargetError } = await supabase
        .from("seasons")
        .update({ is_active: true })
        .eq("id", season.id)

      if (updateTargetError) {
        console.error("❌ Error setting target season active:", updateTargetError)
        throw updateTargetError
      }
      console.log("✅ Target season set to active")

      // Update system_settings (value is jsonb, so we need to wrap it)
      console.log("Step 3: Updating system settings...")
      try {
        const { error: settingsError } = await supabase
          .from("system_settings")
          .upsert({ 
            key: "current_season", 
            value: season.id, // This will be automatically converted to jsonb
            updated_at: new Date().toISOString()
          })

        if (settingsError) {
          console.warn("⚠️ Could not update system_settings:", settingsError)
        } else {
          console.log("✅ System settings updated")
        }
      } catch (settingsError: any) {
        console.warn("⚠️ Exception updating system_settings:", settingsError)
      }

      // Verify the change
      console.log("Step 4: Verifying season change...")
      const { data: verifyData, error: verifyError } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", season.id)
        .single()

      if (verifyError) {
        console.error("❌ Error verifying season change:", verifyError)
      } else {
        console.log("✅ Season change verified:", verifyData)
      }

      toast({
        title: "Success",
        description: `Season "${season.name}" is now the active season`,
      })

      // Refresh the seasons list
      await fetchSeasons()
      
      console.log("🎉 Season switching completed successfully!")
    } catch (error: any) {
      console.error("❌ Error setting active season:", error)
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="space-y-6">
        {/* Enhanced Hockey-Themed Header */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hockey-enhanced-card p-6 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-ice-blue-500/20 to-rink-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-goal-red-500/20 to-assist-green-500/20 rounded-full blur-lg"></div>
            
            <div className="relative z-10">
              <motion.div 
                className="flex items-center justify-center gap-4 mb-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-3 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <motion.h2 
                className="hockey-title-enhanced mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Seasons Management
              </motion.h2>
              
              <motion.p 
                className="hockey-subtitle-enhanced text-hockey-silver-600 dark:text-hockey-silver-300 max-w-2xl mx-auto mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Manage league seasons, set active periods, and control the competitive calendar
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Button 
                  onClick={openCreateDialog}
                  className="hockey-button-enhanced bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white"
                >
                  <Plus className="mr-2 h-5 w-5" /> 
                  Add New Season
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert variant="destructive" className="hockey-enhanced-card border-goal-red-200 dark:border-goal-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-hockey-silver-900 dark:text-hockey-silver-100">Error</AlertTitle>
              <AlertDescription className="text-hockey-silver-700 dark:text-hockey-silver-300">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {seasons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hockey-enhanced-card p-8 text-center">
              <div className="p-6 bg-gradient-to-br from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700 rounded-xl">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-ice-blue-500 opacity-60" />
                <h3 className="text-lg font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 mb-2">
                  No Seasons Found
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                  Create your first season to get started with league management
                </p>
                <Button 
                  onClick={openCreateDialog}
                  className="hockey-button-enhanced"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Season
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hockey-enhanced-card p-6">
              <div className="overflow-hidden rounded-xl border border-hockey-silver-200 dark:border-hockey-silver-700">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-800 dark:to-hockey-silver-700">
                    <TableRow className="border-hockey-silver-200 dark:border-hockey-silver-600">
                      <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Season Name</TableHead>
                      <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Start Date</TableHead>
                      <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">End Date</TableHead>
                      <TableHead className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season, index) => (
                      <motion.tr 
                        key={season.id}
                        className="border-hockey-silver-200 dark:border-hockey-silver-600 hover:bg-hockey-silver-50 dark:hover:bg-hockey-silver-800/50 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900 dark:to-rink-blue-900 rounded-lg">
                              <Trophy className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            </div>
                            <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100">{season.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-ice-blue-500" />
                            <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{format(new Date(season.start_date), "MMM d, yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-rink-blue-500" />
                            <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{format(new Date(season.end_date), "MMM d, yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {season.is_active ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-assist-green-100 dark:bg-assist-green-900 rounded-full">
                                <CheckCircle className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                              </div>
                              <span className="text-assist-green-700 dark:text-assist-green-300 font-medium">Active</span>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setActiveSeason(season)}
                              className="hockey-button-enhanced hover:bg-ice-blue-500 hover:text-white hover:border-ice-blue-500"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set Active
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEditDialog(season)}
                              className="hockey-button-enhanced hover:bg-ice-blue-500 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(season)}
                              disabled={season.is_active}
                              className="hockey-button-enhanced hover:bg-goal-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
      )}

        {/* Enhanced Create Season Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
                  <Plus className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                Create New Season
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Add a new season to the system. You can set it as active after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-ice-blue-500" />
                  Season Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Season 5"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="hockey-search"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-ice-blue-500" />
                    Start Date
                  </Label>
                  <DatePicker date={formData.startDate} setDate={(date) => handleInputChange("startDate", date)} />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endDate" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rink-blue-500" />
                    End Date
                  </Label>
                  <DatePicker date={formData.endDate} setDate={(date) => handleInputChange("endDate", date)} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="hockey-button-enhanced"
              >
                Cancel
              </Button>
              <Button 
                onClick={createSeason}
                className="hockey-button-enhanced bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Season
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Edit Season Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-assist-green-500 to-ice-blue-500 rounded-full shadow-lg">
                  <Edit className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                Edit Season
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Update the details for this season.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="edit-name" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-ice-blue-500" />
                  Season Name
                </Label>
                <Input 
                  id="edit-name" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="hockey-search"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="edit-startDate" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-ice-blue-500" />
                    Start Date
                  </Label>
                  <DatePicker date={formData.startDate} setDate={(date) => handleInputChange("startDate", date)} />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="edit-endDate" className="text-hockey-silver-900 dark:text-hockey-silver-100 font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rink-blue-500" />
                    End Date
                  </Label>
                  <DatePicker date={formData.endDate} setDate={(date) => handleInputChange("endDate", date)} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="hockey-button-enhanced"
              >
                Cancel
              </Button>
              <Button 
                onClick={updateSeason}
                className="hockey-button-enhanced bg-gradient-to-r from-assist-green-500 to-ice-blue-500 hover:from-assist-green-600 hover:to-ice-blue-600 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Update Season
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-goal-red-500 to-assist-green-500 rounded-full shadow-lg">
                  <Trash className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-hockey-silver-900 dark:text-hockey-silver-100">
                Delete Season
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Are you sure you want to delete this season? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {currentSeason && (
              <div className="space-y-4 p-4 bg-hockey-silver-50 dark:bg-hockey-silver-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 min-w-[80px]">Season:</span>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">{currentSeason.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-hockey-silver-900 dark:text-hockey-silver-100 min-w-[80px]">Period:</span>
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    {format(new Date(currentSeason.start_date), "MMM d, yyyy")} - {format(new Date(currentSeason.end_date), "MMM d, yyyy")}
                  </span>
                </div>
                {currentSeason.is_active && (
                  <div className="flex items-center gap-2 p-3 bg-goal-red-100 dark:bg-goal-red-900 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                    <span className="text-goal-red-700 dark:text-goal-red-300 text-sm font-medium">
                      This is the currently active season. Deleting it may affect ongoing operations.
                    </span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="hockey-button-enhanced"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteSeason}
                className="hockey-button-enhanced bg-goal-red-500 hover:bg-goal-red-600 text-white"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Season
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
