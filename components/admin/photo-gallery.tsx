"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Search, Trash2, Copy, ExternalLink, ImageIcon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Photo = {
  id: string
  title: string
  description: string | null
  category: string
  url: string
  file_path: string
  created_at: string
  updated_at: string
}

export function PhotoGallery() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isCreatingTable, setIsCreatingTable] = useState(false)

  useEffect(() => {
    checkTableExists()
  }, [])

  const checkTableExists = async () => {
    try {
      const response = await fetch("/api/admin/check-table-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName: "photos" }),
      })
      const data = await response.json()
      setTableExists(data.exists)
      
      if (data.exists) {
        fetchPhotos()
      }
    } catch (error) {
      console.error("Error checking table existence:", error)
      setTableExists(false)
    }
  }

  const createPhotosTable = async () => {
    setIsCreatingTable(true)
    try {
      const response = await fetch("/api/setup-photos-table", {
        method: "POST",
      })
      const data = await response.json()
      
      if (data.success) {
        setTableExists(true)
        toast({
          title: "Success",
          description: "Photos table created successfully",
        })
        fetchPhotos()
      } else {
        throw new Error(data.error || "Failed to create table")
      }
    } catch (error: any) {
      console.error("Error creating photos table:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create photos table",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTable(false)
    }
  }

  const fetchPhotos = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from("photos").select("*").order("created_at", { ascending: false })

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setPhotos(data || [])
    } catch (error: any) {
      console.error("Error fetching photos:", error)
      setError(error.message || "Failed to load photos")
      toast({
        title: "Error",
        description: error.message || "Failed to load photos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPhotos()
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setTimeout(() => {
      fetchPhotos()
    }, 100)
  }

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return

    setDeleting(true)
    setError(null)
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from("media").remove([selectedPhoto.file_path])

      if (storageError) {
        throw storageError
      }

      // Delete from database
      const { error: dbError } = await supabase.from("photos").delete().eq("id", selectedPhoto.id)

      if (dbError) {
        throw dbError
      }

      toast({
        title: "Photo deleted",
        description: "The photo has been deleted successfully",
      })

      // Refresh the list
      fetchPhotos()
      setDeleteDialogOpen(false)
      setSelectedPhoto(null)
    } catch (error: any) {
      console.error("Delete error:", error)
      setError(error.message || "An error occurred while deleting the photo")
      toast({
        title: "Delete failed",
        description: error.message || "An error occurred while deleting the photo",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The URL has been copied to your clipboard",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      general: "General",
      teams: "Teams",
      players: "Players",
      matches: "Matches",
      events: "Events",
    }
    return categories[category] || category
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tableExists === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Photos table not found</AlertTitle>
          <AlertDescription>
            The photos table doesn't exist in your database. Click the button below to create it.
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={createPhotosTable} disabled={isCreatingTable}>
              {isCreatingTable ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating table...
                </>
              ) : (
                "Create Photos Table"
              )}
            </Button>
          </div>
        </Alert>
      )}

      {tableExists === null && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-blue-500 mx-auto mb-4"></div>
            <p>Checking database setup...</p>
          </div>
        </div>
      )}

      {tableExists === true && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search photos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="teams">Teams</SelectItem>
            <SelectItem value="players">Players</SelectItem>
            <SelectItem value="matches">Matches</SelectItem>
            <SelectItem value="events">Events</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-5 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No photos found</h3>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Upload some photos to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group">
              <div className="aspect-video relative bg-muted">
                <Image src={photo.url || "/placeholder.svg"} alt={photo.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => copyToClipboard(photo.url)} title="Copy URL">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => window.open(photo.url, "_blank")}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setSelectedPhoto(photo)
                      setDeleteDialogOpen(true)
                    }}
                    title="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate" title={photo.title}>
                  {photo.title}
                </h3>
                <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                  <span>{getCategoryLabel(photo.category)}</span>
                  <span>{formatDate(photo.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden my-4">
              <Image
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={selectedPhoto.title}
                fill
                className="object-contain"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePhoto} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
