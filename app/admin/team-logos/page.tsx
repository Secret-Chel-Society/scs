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
import { Loader2, Check, AlertCircle, Upload, RefreshCw, Info } from "lucide-react"
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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Logo Management</h1>
        <Button onClick={handleUpdateAllLogos} disabled={updating}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Logos</TabsTrigger>
          <TabsTrigger value="storage">Storage Management</TabsTrigger>
          <TabsTrigger value="debug">Debug Info</TabsTrigger>
          {updateResults.length > 0 && <TabsTrigger value="results">Update Results</TabsTrigger>}
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Current Team Logos</CardTitle>
              <CardDescription>Current logos assigned to teams in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Current Logo</TableHead>
                      <TableHead>Storage Logo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => {
                      const storageUrl = storageLogos[team.name]
                      const hasStorageLogo = !!storageUrl
                      const isUsingStorageLogo = team.logo_url === storageUrl

                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <div className="h-16 w-16 relative">
                              {team.logo_url ? (
                                <>
                                  <Image
                                    src={team.logo_url || "/placeholder.svg"}
                                    alt={`${team.name} logo`}
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        const fallback = document.createElement("div")
                                        fallback.className = "flex items-center justify-center h-full w-full"
                                        fallback.innerHTML = `<span class="text-xs text-red-500">Image not found</span>`
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    onClick={() => setSelectedImage(team.logo_url)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <TeamLogo teamName={team.name} size="lg" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasStorageLogo ? (
                              <div className="h-16 w-16 relative">
                                <Image
                                  src={storageUrl || "/placeholder.svg"}
                                  alt={`Storage ${team.name} logo`}
                                  fill
                                  className="object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                    const parent = e.currentTarget.parentElement
                                    if (parent) {
                                      const fallback = document.createElement("div")
                                      fallback.className = "flex items-center justify-center h-full w-full"
                                      fallback.innerHTML = `<span class="text-xs text-red-500">Image not found</span>`
                                      parent.appendChild(fallback)
                                    }
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                  onClick={() => setSelectedImage(storageUrl)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No storage logo</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!hasStorageLogo ? (
                              <span className="flex items-center text-amber-500">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                No logo in storage
                              </span>
                            ) : isUsingStorageLogo ? (
                              <span className="flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" />
                                Using storage logo
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-500">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Not using storage logo
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(team)}>
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

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Logo Storage Management</CardTitle>
              <CardDescription>Upload and manage team logos in storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Storage Filename</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(TEAM_LOGOS).map(([teamName, filename]) => {
                      const storageUrl = storageLogos[teamName]
                      const debug = debugInfo[teamName] || {}

                      return (
                        <TableRow key={teamName}>
                          <TableCell className="font-medium">{teamName}</TableCell>
                          <TableCell>teams/{filename}</TableCell>
                          <TableCell>
                            <div className="h-16 w-16 relative">
                              {storageUrl ? (
                                <>
                                  <Image
                                    src={storageUrl || "/placeholder.svg"}
                                    alt={`${teamName} logo`}
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        const fallback = document.createElement("div")
                                        fallback.className = "flex items-center justify-center h-full w-full"
                                        fallback.innerHTML = `<span class="text-xs text-red-500">Image not found</span>`
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    onClick={() => setSelectedImage(storageUrl)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded">
                                  <span className="text-xs text-muted-foreground">No logo</span>
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
                                <Button variant="outline" className="w-full" disabled={uploadingTeam !== null}>
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

                              {uploadingTeam === teamName && <Progress value={uploadProgress} className="h-2" />}

                              {debug.fileExists === false && (
                                <p className="text-xs text-amber-500 mt-1">File not found in storage</p>
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

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>Detailed information about team logos and storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Storage Path</TableHead>
                      <TableHead>Public URL</TableHead>
                      <TableHead>File Exists</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(debugInfo).map(([teamName, info]) => (
                      <TableRow key={teamName}>
                        <TableCell className="font-medium">{teamName}</TableCell>
                        <TableCell>
                          <code className="text-xs">{info.storagePath}</code>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            <code className="text-xs">{info.publicUrl || "N/A"}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          {info.fileExists === true ? (
                            <span className="text-green-500">Yes</span>
                          ) : info.fileExists === false ? (
                            <span className="text-red-500">No</span>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {info.error || info.fileListError ? (
                            <div className="max-w-[200px] truncate text-red-500 text-xs">
                              {info.error || info.fileListError}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
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
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Update Results</CardTitle>
                <CardDescription>Results from the last logo update operation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {updateResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{result.team}</TableCell>
                          <TableCell>
                            {result.success ? (
                              <span className="flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="flex items-center text-red-500">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Failed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.success ? (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                                {result.url}
                              </span>
                            ) : (
                              <span className="text-xs text-red-500">{result.error}</span>
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
      </Tabs>

      {/* Edit URL Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Logo URL for {editingTeam?.name}</DialogTitle>
            <DialogDescription>Enter a new URL for the team logo</DialogDescription>
          </DialogHeader>
          <Form {...logoForm}>
            <form onSubmit={logoForm.handleSubmit(handleManualLogoUpdate)} className="space-y-4 py-4">
              <FormField
                control={logoForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} disabled={updating} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              URL: <code className="text-xs">{selectedImage}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-gray-100 rounded-md">
            {selectedImage && (
              <div className="relative h-[300px] w-full">
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt="Image preview"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML =
                        '<div class="flex items-center justify-center h-full w-full"><span class="text-red-500">Failed to load image</span></div>'
                    }
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
