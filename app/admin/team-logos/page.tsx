"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { TEAM_LOGOS } from "@/lib/team-logos"
import Image from "next/image"
import { TeamLogo } from "@/components/team-logo"
import { Loader2, Check, AlertCircle, Upload, RefreshCw, Info, Trophy, Award, Medal, Star, Shield, Database, Settings, Zap, Target, Clock, Image as ImageIcon, Eye, Edit, Save, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useForm } from "react-hook-form"

export default function AdminTeamLogosPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploadingTeam, setUploadingTeam] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [teams, setTeams] = useState<any[]>([])
  const [storageLogos, setStorageLogos] = useState<Record<string, string | null>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState("current")
  const [updateResults, setUpdateResults] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; logoUrl: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form for editing logo URL
  const logoForm = useForm({
    defaultValues: {
      logoUrl: "",
    },
  })

  // Check if user is admin and load teams
  useEffect(() => {
    async function checkAuthAndLoadData() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        setLoading(true)

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Load teams
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, logo_url")
          .order("name")

        if (teamsError) throw teamsError
        setTeams(teamsData || [])

        // Check storage for logos
        const storageUrls: Record<string, string | null> = {}
        const debugData: Record<string, any> = {}

        for (const [teamName, filename] of Object.entries(TEAM_LOGOS)) {
          try {
            // Get the public URL from storage
            const { data } = supabase.storage.from("media").getPublicUrl(`teams/${filename}`)

            storageUrls[teamName] = data?.publicUrl || null

            // Store debug info
            debugData[teamName] = {
              filename,
              storagePath: `teams/${filename}`,
              publicUrl: data?.publicUrl || null,
            }

            // Check if file exists in storage
            const { data: fileData, error: fileError } = await supabase.storage.from("media").list("teams", {
              search: filename,
            })

            debugData[teamName].fileExists = fileData && fileData.length > 0
            debugData[teamName].fileListError = fileError ? fileError.message : null
            debugData[teamName].fileListResult = fileData
          } catch (error: any) {
            console.error(`Error checking storage for ${teamName}:`, error)
            debugData[teamName] = {
              error: error.message,
              filename,
              storagePath: `teams/${filename}`,
            }
          }
        }

        // Check for teams that don't have a mapping in TEAM_LOGOS
        for (const team of teamsData || []) {
          if (!TEAM_LOGOS[team.name]) {
            debugData[team.name] = {
              error: "No mapping in TEAM_LOGOS",
              missingMapping: true,
            }
            console.warn(`Team "${team.name}" does not have a mapping in TEAM_LOGOS`)
          }
        }

        setStorageLogos(storageUrls)
        setDebugInfo(debugData)
      } catch (error: any) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  // Handle updating all team logos from storage
  const handleUpdateAllLogos = async () => {
    try {
      setUpdating(true)
      setUpdateResults([])

      const results = []

      for (const [teamName, filename] of Object.entries(TEAM_LOGOS)) {
        try {
          // Get the public URL from storage
          const { data } = supabase.storage.from("media").getPublicUrl(`teams/${filename}`)

          if (!data?.publicUrl) {
            results.push({ team: teamName, success: false, error: "Could not get public URL" })
            continue
          }

          // Update the team's logo_url in the database
          const { error } = await supabase.from("teams").update({ logo_url: data.publicUrl }).eq("name", teamName)

          if (error) {
            results.push({ team: teamName, success: false, error: error.message })
          } else {
            results.push({ team: teamName, success: true, url: data.publicUrl })
          }
        } catch (error: any) {
          results.push({ team: teamName, success: false, error: error.message })
        }
      }

      setUpdateResults(results)

      const successCount = results.filter((r: any) => r.success).length

      toast({
        title: "Logos updated",
        description: `${successCount} of ${results.length} team logos have been updated.`,
      })

      // Reload teams to show updated logos
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name")

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // Set active tab to results
      setActiveTab("results")
    } catch (error: any) {
      console.error("Error updating logos:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update team logos",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle uploading a logo for a specific team
  const handleUploadLogo = async (teamName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingTeam(teamName)
      setUploadProgress(0)

      const filename = TEAM_LOGOS[teamName]
      if (!filename) {
        throw new Error(`No filename mapping for team: ${teamName}`)
      }

      // Upload the file to storage
      const { data, error } = await supabase.storage.from("media").upload(`teams/${filename}`, file, {
        cacheControl: "3600",
        upsert: true,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          setUploadProgress(percent)
        },
      })

      if (error) throw error

      // Get the public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(`teams/${filename}`)

      if (!urlData?.publicUrl) {
        throw new Error("Could not get public URL for uploaded file")
      }

      // Update the team in the database
      const { error: updateError } = await supabase
        .from("teams")
        .update({ logo_url: urlData.publicUrl })
        .eq("name", teamName)

      if (updateError) throw updateError

      // Update the local state
      setStorageLogos((prev) => ({
        ...prev,
        [teamName]: urlData.publicUrl,
      }))

      // Reload teams to show updated logo
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name")

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // Update debug info
      const { data: fileData } = await supabase.storage.from("media").list("teams", {
        search: filename,
      })

      setDebugInfo((prev) => ({
        ...prev,
        [teamName]: {
          ...prev[teamName],
          publicUrl: urlData.publicUrl,
          fileExists: fileData && fileData.length > 0,
          fileListResult: fileData,
        },
      }))

      toast({
        title: "Logo uploaded",
        description: `Logo for ${teamName} has been uploaded and updated.`,
      })
    } catch (error: any) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload team logo",
        variant: "destructive",
      })
    } finally {
      setUploadingTeam(null)
      setUploadProgress(0)
    }
  }

  // Open the edit dialog for a team
  const openEditDialog = (team: any) => {
    setEditingTeam({
      id: team.id,
      name: team.name,
      logoUrl: team.logo_url || "",
    })
    logoForm.reset({ logoUrl: team.logo_url || "" })
    setDialogOpen(true)
  }

  // Handle manually setting a logo URL
  const handleManualLogoUpdate = async (values: { logoUrl: string }) => {
    if (!editingTeam) return

    try {
      setUpdating(true)

      // Update the team in the database
      const { error: updateError } = await supabase
        .from("teams")
        .update({ logo_url: values.logoUrl })
        .eq("name", editingTeam.name)

      if (updateError) throw updateError

      // Reload teams to show updated logo
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name")

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      toast({
        title: "Logo URL updated",
        description: `Logo URL for ${editingTeam.name} has been updated.`,
      })

      // Close the dialog
      setDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating logo URL:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update team logo URL",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 font-medium">Loading Team Logo Management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <div className="w-20 h-20 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-ice-blue-500/25">
              <ImageIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="hockey-title mb-6">
              Team Logo Management
            </h1>
            <p className="hockey-subtitle mx-auto mb-8 max-w-3xl">
              Comprehensive team logo management and storage system. Upload, update, and manage team logos with advanced storage integration and debugging tools.
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/30 dark:border-assist-green-700/30">
                <ImageIcon className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Logo Upload</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                <Database className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Storage Management</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-goal-red-100/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 px-4 py-2 rounded-full border border-goal-red-200/30 dark:border-goal-red-700/30">
                <Settings className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Debug Tools</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                <Eye className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
                <span className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300">Preview System</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Enhanced Header with Action Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Logo Management Dashboard</h2>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Manage team logos and storage integration</p>
            </div>
          </div>
          <Button 
            onClick={handleUpdateAllLogos} 
            disabled={updating}
            className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update All Team Logos from Storage
              </>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="hockey-card border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10 mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <TabsTrigger 
                value="current" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Eye className="h-4 w-4" />
                Current Logos
              </TabsTrigger>
              <TabsTrigger 
                value="storage" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Database className="h-4 w-4" />
                Storage Management
              </TabsTrigger>
              <TabsTrigger 
                value="debug" 
                className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Settings className="h-4 w-4" />
                Debug Info
              </TabsTrigger>
              {updateResults.length > 0 && (
                <TabsTrigger 
                  value="results" 
                  className="hockey-button flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-hockey-silver-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Check className="h-4 w-4" />
                  Update Results
                </TabsTrigger>
              )}
            </TabsList>

          <TabsContent value="current" className="p-6">
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-t-lg"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Current Team Logos</CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Current logos assigned to teams in the database</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Team Name</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Current Logo</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Storage Logo</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Status</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => {
                        const storageUrl = storageLogos[team.name]
                        const hasStorageLogo = !!storageUrl
                        const isUsingStorageLogo = team.logo_url === storageUrl

                        return (
                          <TableRow 
                            key={team.id}
                            className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30"
                          >
                            <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{team.name}</TableCell>
                            <TableCell>
                              <div className="h-16 w-16 relative bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30">
                                {team.logo_url ? (
                                  <>
                                    <Image
                                      src={team.logo_url || "/placeholder.svg"}
                                      alt={`${team.name} logo`}
                                      fill
                                      className="object-contain rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                        const parent = e.currentTarget.parentElement
                                        if (parent) {
                                          const fallback = document.createElement("div")
                                          fallback.className = "flex items-center justify-center h-full w-full"
                                          fallback.innerHTML = `<span class="text-xs text-goal-red-500">Image not found</span>`
                                          parent.appendChild(fallback)
                                        }
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                                      onClick={() => setSelectedImage(team.logo_url)}
                                    >
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <TeamLogo teamName={team.name} size="lg" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasStorageLogo ? (
                                <div className="h-16 w-16 relative bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border-2 border-assist-green-200/30 dark:border-assist-green-700/30">
                                  <Image
                                    src={storageUrl || "/placeholder.svg"}
                                    alt={`Storage ${team.name} logo`}
                                    fill
                                    className="object-contain rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        const fallback = document.createElement("div")
                                        fallback.className = "flex items-center justify-center h-full w-full"
                                        fallback.innerHTML = `<span class="text-xs text-goal-red-500">Image not found</span>`
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                                    onClick={() => setSelectedImage(storageUrl)}
                                  >
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2">
                                  <Database className="h-4 w-4" />
                                  No storage logo
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {!hasStorageLogo ? (
                                <span className="flex items-center text-goal-red-600 dark:text-goal-red-400">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  No logo in storage
                                </span>
                              ) : isUsingStorageLogo ? (
                                <span className="flex items-center text-assist-green-600 dark:text-assist-green-400">
                                  <Check className="h-4 w-4 mr-1" />
                                  Using storage logo
                                </span>
                              ) : (
                                <span className="flex items-center text-hockey-silver-600 dark:text-hockey-silver-400">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Not using storage logo
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEditDialog(team)}
                                className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit URL
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="p-6">
          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-t-lg"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Logo Storage Management</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Upload and manage team logos in storage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-assist-green-50/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50">
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Team Name</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Storage Filename</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Preview</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(TEAM_LOGOS).map(([teamName, filename]) => {
                      const storageUrl = storageLogos[teamName]
                      const debug = debugInfo[teamName] || {}

                      return (
                        <TableRow 
                          key={teamName}
                          className="hover:bg-gradient-to-r hover:from-assist-green-50/30 hover:to-assist-green-100/30 dark:hover:from-assist-green-900/10 dark:hover:to-assist-green-900/10 transition-all duration-300 border-b border-assist-green-200/30 dark:border-assist-green-700/30"
                        >
                          <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{teamName}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-2 py-1 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30 text-ice-blue-700 dark:text-ice-blue-300">
                              teams/{filename}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="h-16 w-16 relative bg-gradient-to-r from-assist-green-50/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border-2 border-assist-green-200/30 dark:border-assist-green-700/30">
                              {storageUrl ? (
                                <>
                                  <Image
                                    src={storageUrl || "/placeholder.svg"}
                                    alt={`${teamName} logo`}
                                    fill
                                    className="object-contain rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        const fallback = document.createElement("div")
                                        fallback.className = "flex items-center justify-center h-full w-full"
                                        fallback.innerHTML = `<span class="text-xs text-goal-red-500">Image not found</span>`
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                                    onClick={() => setSelectedImage(storageUrl)}
                                  >
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-200/50 dark:from-hockey-silver-800/50 dark:to-hockey-silver-700/50 rounded-lg">
                                  <span className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400">No logo</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <div className="relative">
                                <input
                                  type="file"
                                  id={`logo-upload-${teamName}`}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  accept="image/png,image/jpeg,image/gif"
                                  onChange={(e) => handleUploadLogo(teamName, e)}
                                  disabled={uploadingTeam !== null}
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300" 
                                  disabled={uploadingTeam !== null}
                                >
                                  {uploadingTeam === teamName ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Logo
                                    </>
                                  )}
                                </Button>
                              </div>

                              {uploadingTeam === teamName && (
                                <Progress 
                                  value={uploadProgress} 
                                  className="h-2 bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20" 
                                />
                              )}

                              {debug.fileExists === false && (
                                <p className="text-xs text-goal-red-600 dark:text-goal-red-400 mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  File not found in storage
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="p-6">
          <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-goal-red-50/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-t-lg"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Debug Information</CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Detailed information about team logos and storage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-goal-red-50/50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50">
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Team Name</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Storage Path</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Public URL</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">File Exists</TableHead>
                      <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(debugInfo).map(([teamName, info]) => (
                      <TableRow 
                        key={teamName}
                        className="hover:bg-gradient-to-r hover:from-goal-red-50/30 hover:to-goal-red-100/30 dark:hover:from-goal-red-900/10 dark:hover:to-goal-red-900/10 transition-all duration-300 border-b border-goal-red-200/30 dark:border-goal-red-700/30"
                      >
                        <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{teamName}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-2 py-1 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30 text-ice-blue-700 dark:text-ice-blue-300">
                            {info.storagePath}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            <code className="text-xs bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-2 py-1 rounded border border-assist-green-200/30 dark:border-assist-green-700/30 text-assist-green-700 dark:text-assist-green-300">
                              {info.publicUrl || "N/A"}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          {info.fileExists === true ? (
                            <span className="flex items-center text-assist-green-600 dark:text-assist-green-400">
                              <Check className="h-4 w-4 mr-1" />
                              Yes
                            </span>
                          ) : info.fileExists === false ? (
                            <span className="flex items-center text-goal-red-600 dark:text-goal-red-400">
                              <X className="h-4 w-4 mr-1" />
                              No
                            </span>
                          ) : (
                            <span className="text-hockey-silver-600 dark:text-hockey-silver-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {info.error || info.fileListError ? (
                            <div className="max-w-[200px] truncate text-goal-red-600 dark:text-goal-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {info.error || info.fileListError}
                            </div>
                          ) : (
                            <span className="text-hockey-silver-600 dark:text-hockey-silver-400">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {updateResults.length > 0 && (
          <TabsContent value="results" className="p-6">
            <Card className="hockey-card hockey-card-hover border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-lg shadow-ice-blue-500/10">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-hockey-silver-50/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-900/10 rounded-t-lg"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Update Results</CardTitle>
                    <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">Results from the last logo update operation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-xl border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-hockey-silver-50/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Team Name</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Status</TableHead>
                        <TableHead className="text-base font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {updateResults.map((result, index) => (
                        <TableRow 
                          key={index}
                          className="hover:bg-gradient-to-r hover:from-hockey-silver-50/30 hover:to-hockey-silver-100/30 dark:hover:from-hockey-silver-900/10 dark:hover:to-hockey-silver-900/10 transition-all duration-300 border-b border-hockey-silver-200/30 dark:border-hockey-silver-700/30"
                        >
                          <TableCell className="font-bold text-hockey-silver-800 dark:text-hockey-silver-200">{result.team}</TableCell>
                          <TableCell>
                            {result.success ? (
                              <span className="flex items-center text-assist-green-600 dark:text-assist-green-400">
                                <Check className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="flex items-center text-goal-red-600 dark:text-goal-red-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Failed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.success ? (
                              <span className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 truncate max-w-[200px] block">
                                {result.url}
                              </span>
                            ) : (
                              <span className="text-xs text-goal-red-600 dark:text-goal-red-400">{result.error}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
          </Card>
        </Tabs>

        {/* Edit URL Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                  <Edit className="h-4 w-4 text-white" />
                </div>
                Edit Logo URL for {editingTeam?.name}
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                Enter a new URL for the team logo. This will update the logo URL in the database.
              </DialogDescription>
            </DialogHeader>
            <Form {...logoForm}>
              <form onSubmit={logoForm.handleSubmit(handleManualLogoUpdate)} className="space-y-4 py-4">
                <FormField
                  control={logoForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                        Logo URL
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/logo.png" 
                          {...field} 
                          disabled={updating}
                          className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Image preview dialog */}
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-3xl bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
            <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                Image Preview
              </DialogTitle>
              <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
                URL: <code className="text-xs bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-2 py-1 rounded border border-ice-blue-200/30 dark:border-rink-blue-700/30 text-ice-blue-700 dark:text-ice-blue-300">{selectedImage}</code>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4 bg-gradient-to-r from-ice-blue-50/30 to-rink-blue-50/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border-2 border-ice-blue-200/30 dark:border-rink-blue-700/30">
              {selectedImage && (
                <div className="relative h-[300px] w-full">
                  <Image
                    src={selectedImage || "/placeholder.svg"}
                    alt="Image preview"
                    fill
                    className="object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML =
                          '<div class="flex items-center justify-center h-full w-full"><span class="text-goal-red-500 font-medium">Failed to load image</span></div>'
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
