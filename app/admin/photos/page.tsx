"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image, 
  ArrowLeft 
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"

interface Photo {
  id: string
  title: string
  description: string
  image_url: string
  category: string
  status: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    gamer_tag_id: string
  }
}

export default function AdminPhotosPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingDescription, setEditingDescription] = useState("")
  const [editingCategory, setEditingCategory] = useState("")
  const [editingStatus, setEditingStatus] = useState("")
  const [updating, setUpdating] = useState(false)

  // Check if user is admin and load photos
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

        // Load photos with user data
        const { data: photosData, error: photosError } = await supabase
          .from("photos")
          .select(`
            *,
            user:user_id (
              email,
              gamer_tag_id
            )
          `)
          .order("created_at", { ascending: false })

        if (photosError) throw photosError

        setPhotos(photosData || [])
        setFilteredPhotos(photosData || [])
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

  // Filter photos based on search and category
  useEffect(() => {
    let filtered = photos

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((photo) =>
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((photo) => photo.category === categoryFilter)
    }

    setFilteredPhotos(filtered)
  }, [photos, searchQuery, categoryFilter])

  // Handle photo update
  const handlePhotoUpdate = async () => {
    if (!selectedPhoto) return

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("photos")
        .update({
          title: editingTitle,
          description: editingDescription,
          category: editingCategory,
          status: editingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPhoto.id)

      if (error) throw error

      // Update local state
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === selectedPhoto.id
            ? { 
                ...photo, 
                title: editingTitle,
                description: editingDescription,
                category: editingCategory,
                status: editingStatus
              }
            : photo
        )
      )

      toast({
        title: "Photo updated",
        description: `Photo "${editingTitle}" has been updated.`,
      })

      setIsEditDialogOpen(false)
      setSelectedPhoto(null)
    } catch (error: any) {
      console.error("Error updating photo:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update photo",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Draft":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Archived":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get statistics
  const getStats = () => {
    const total = photos.length
    const published = photos.filter((p) => p.status === "Published").length
    const drafts = photos.filter((p) => p.status === "Draft").length
    const archived = photos.filter((p) => p.status === "Archived").length

    return { total, published, drafts, archived }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading photos...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Image className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Photo Gallery
              </h1>
              <p className="text-white/70 mt-1">Manage photo gallery and media content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Statistics */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-white/70 text-sm">Total Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.published}</div>
                <div className="text-white/70 text-sm">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.drafts}</div>
                <div className="text-white/70 text-sm">Drafts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">{stats.archived}</div>
                <div className="text-white/70 text-sm">Archived</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-white">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="search"
                    placeholder="Search by title, description, or uploader..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="category-filter" className="text-white">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Categories</SelectItem>
                    <SelectItem value="Gameplay" className="text-white hover:bg-slate-700">Gameplay</SelectItem>
                    <SelectItem value="Team" className="text-white hover:bg-slate-700">Team</SelectItem>
                    <SelectItem value="Events" className="text-white hover:bg-slate-700">Events</SelectItem>
                    <SelectItem value="Other" className="text-white hover:bg-slate-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Photos</CardTitle>
            <CardDescription className="text-white/70">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">Title</TableHead>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Uploader</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhotos.map((photo) => (
                    <TableRow key={photo.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{photo.title}</TableCell>
                      <TableCell className="text-white">{photo.category}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(photo.status)}>
                          {photo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{photo.user?.gamer_tag_id || "N/A"}</TableCell>
                      <TableCell className="text-white">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPhoto(photo)
                              setIsViewDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPhoto(photo)
                              setEditingTitle(photo.title)
                              setEditingDescription(photo.description)
                              setEditingCategory(photo.category)
                              setEditingStatus(photo.status)
                              setIsEditDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPhotos.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={6} className="text-center py-8 text-white/50">
                        No photos found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Photo Details</DialogTitle>
              <DialogDescription className="text-white/70">
                View detailed information about this photo
              </DialogDescription>
            </DialogHeader>
            {selectedPhoto && (
              <div className="space-y-4">
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPhoto.image_url} 
                    alt={selectedPhoto.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Title</Label>
                    <p className="text-white/70">{selectedPhoto.title}</p>
                  </div>
                  <div>
                    <Label className="text-white">Category</Label>
                    <p className="text-white/70">{selectedPhoto.category}</p>
                  </div>
                  <div>
                    <Label className="text-white">Status</Label>
                    <Badge className={getStatusBadgeVariant(selectedPhoto.status)}>
                      {selectedPhoto.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-white">Uploader</Label>
                    <p className="text-white/70">{selectedPhoto.user?.gamer_tag_id || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Description</Label>
                  <p className="text-white/70">{selectedPhoto.description}</p>
                </div>
                <div>
                  <Label className="text-white">Upload Date</Label>
                  <p className="text-white/70">
                    {new Date(selectedPhoto.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Photo</DialogTitle>
              <DialogDescription className="text-white/70">
                Update the photo information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter photo title"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Input
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter photo description"
                />
              </div>
              <div>
                <Label className="text-white">Category</Label>
                <Select value={editingCategory} onValueChange={setEditingCategory}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="Gameplay" className="text-white hover:bg-slate-700">Gameplay</SelectItem>
                    <SelectItem value="Team" className="text-white hover:bg-slate-700">Team</SelectItem>
                    <SelectItem value="Events" className="text-white hover:bg-slate-700">Events</SelectItem>
                    <SelectItem value="Other" className="text-white hover:bg-slate-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Status</Label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="Published" className="text-white hover:bg-slate-700">Published</SelectItem>
                    <SelectItem value="Draft" className="text-white hover:bg-slate-700">Draft</SelectItem>
                    <SelectItem value="Archived" className="text-white hover:bg-slate-700">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhotoUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
