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
  Users, 
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

interface PlayerMapping {
  id: string
  ea_player_id: string
  scs_user_id: string
  created_at: string
  updated_at: string
  ea_player?: {
    name: string
    team: string
    position: string
  }
  scs_user?: {
    email: string
    gamer_tag_id: string
  }
}

export default function AdminPlayerMappingsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mappings, setMappings] = useState<PlayerMapping[]>([])
  const [filteredMappings, setFilteredMappings] = useState<PlayerMapping[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMapping, setSelectedMapping] = useState<PlayerMapping | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEaPlayerId, setEditingEaPlayerId] = useState("")
  const [editingScsUserId, setEditingScsUserId] = useState("")
  const [updating, setUpdating] = useState(false)

  // Check if user is admin and load mappings
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

        // Load mappings with related data
        const { data: mappingsData, error: mappingsError } = await supabase
          .from("player_mappings")
          .select(`
            *,
            ea_player:ea_player_id (
              name,
              team,
              position
            ),
            scs_user:scs_user_id (
              email,
              gamer_tag_id
            )
          `)
          .order("created_at", { ascending: false })

        if (mappingsError) throw mappingsError

        setMappings(mappingsData || [])
        setFilteredMappings(mappingsData || [])
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

  // Filter mappings based on search
  useEffect(() => {
    let filtered = mappings

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((mapping) =>
        mapping.ea_player?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mapping.scs_user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mapping.scs_user?.gamer_tag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mapping.ea_player?.team.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredMappings(filtered)
  }, [mappings, searchQuery])

  // Handle mapping update
  const handleMappingUpdate = async () => {
    if (!selectedMapping) return

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("player_mappings")
        .update({
          ea_player_id: editingEaPlayerId,
          scs_user_id: editingScsUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMapping.id)

      if (error) throw error

      // Update local state
      setMappings((prev) =>
        prev.map((mapping) =>
          mapping.id === selectedMapping.id
            ? { ...mapping, ea_player_id: editingEaPlayerId, scs_user_id: editingScsUserId }
            : mapping
        )
      )

      toast({
        title: "Mapping updated",
        description: `Player mapping has been updated successfully.`,
      })

      setIsEditDialogOpen(false)
      setSelectedMapping(null)
    } catch (error: any) {
      console.error("Error updating mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update mapping",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Get statistics
  const getStats = () => {
    const total = mappings.length
    const mapped = mappings.filter((m) => m.ea_player_id && m.scs_user_id).length
    const unmapped = total - mapped

    return { total, mapped, unmapped }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading player mappings...</p>
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
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Player Mappings
              </h1>
              <p className="text-white/70 mt-1">Manage mappings between EA Sports players and SCS users</p>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-white/70 text-sm">Total Mappings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.mapped}</div>
                <div className="text-white/70 text-sm">Mapped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.unmapped}</div>
                <div className="text-white/70 text-sm">Unmapped</div>
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
                    placeholder="Search by player name, email, or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mappings Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Player Mappings</CardTitle>
            <CardDescription className="text-white/70">
              {filteredMappings.length} mapping{filteredMappings.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">EA Player</TableHead>
                    <TableHead className="text-white">Team</TableHead>
                    <TableHead className="text-white">Position</TableHead>
                    <TableHead className="text-white">SCS User</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{mapping.ea_player?.name || "N/A"}</TableCell>
                      <TableCell className="text-white">{mapping.ea_player?.team || "N/A"}</TableCell>
                      <TableCell className="text-white">{mapping.ea_player?.position || "N/A"}</TableCell>
                      <TableCell className="text-white">{mapping.scs_user?.gamer_tag_id || "N/A"}</TableCell>
                      <TableCell className="text-white">{mapping.scs_user?.email || "N/A"}</TableCell>
                      <TableCell className="text-white">
                        {new Date(mapping.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMapping(mapping)
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
                              setSelectedMapping(mapping)
                              setEditingEaPlayerId(mapping.ea_player_id)
                              setEditingScsUserId(mapping.scs_user_id)
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
                  {filteredMappings.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={7} className="text-center py-8 text-white/50">
                        No mappings found matching your criteria.
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
              <DialogTitle className="text-white">Mapping Details</DialogTitle>
              <DialogDescription className="text-white/70">
                View detailed information about this player mapping
              </DialogDescription>
            </DialogHeader>
            {selectedMapping && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">EA Player Name</Label>
                    <p className="text-white/70">{selectedMapping.ea_player?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Team</Label>
                    <p className="text-white/70">{selectedMapping.ea_player?.team || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Position</Label>
                    <p className="text-white/70">{selectedMapping.ea_player?.position || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">SCS User</Label>
                    <p className="text-white/70">{selectedMapping.scs_user?.gamer_tag_id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <p className="text-white/70">{selectedMapping.scs_user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-white">Mapping Date</Label>
                    <p className="text-white/70">
                      {new Date(selectedMapping.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Mapping</DialogTitle>
              <DialogDescription className="text-white/70">
                Update the EA player and SCS user mapping
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">EA Player ID</Label>
                <Input
                  value={editingEaPlayerId}
                  onChange={(e) => setEditingEaPlayerId(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter EA player ID"
                />
              </div>
              <div>
                <Label className="text-white">SCS User ID</Label>
                <Input
                  value={editingScsUserId}
                  onChange={(e) => setEditingScsUserId(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter SCS user ID"
                />
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
                onClick={handleMappingUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Mapping"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
