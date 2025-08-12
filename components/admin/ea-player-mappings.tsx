"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Mapping {
  id: string
  ea_name: string
  player_id: string
  player_name?: string
}

interface Player {
  id: string
  user_id: string
  user?: {
    gamer_tag_id: string
  }
}

export function EaPlayerMappings() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newMapping, setNewMapping] = useState<{ ea_name: string; player_id: string }>({
    ea_name: "",
    player_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMappings()
    fetchPlayers()
  }, [])

  const fetchMappings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .select(`
          id,
          ea_name,
          player_id,
          players:player_id (
            id,
            users:user_id (
              gamer_tag_id
            )
          )
        `)
        .order("ea_name")

      if (error) throw error

      // Format the data to include player name
      const formattedMappings = data.map((mapping) => ({
        id: mapping.id,
        ea_name: mapping.ea_name,
        player_id: mapping.player_id,
        player_name: mapping.players?.users?.gamer_tag_id || "Unknown Player",
      }))

      setMappings(formattedMappings)
    } catch (error) {
      console.error("Error fetching mappings:", error)
      toast({
        title: "Error",
        description: "Failed to load EA player mappings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select(`
          id,
          user_id,
          users:user_id (
            gamer_tag_id
          )
        `)
        .order("users(gamer_tag_id)")

      if (error) throw error
      setPlayers(data)
    } catch (error) {
      console.error("Error fetching players:", error)
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive",
      })
    }
  }

  const handleAddMapping = async () => {
    try {
      setIsSubmitting(true)

      if (!newMapping.ea_name || !newMapping.player_id) {
        toast({
          title: "Validation Error",
          description: "EA name and player are required",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("ea_player_mappings")
        .insert({
          ea_name: newMapping.ea_name,
          player_id: newMapping.player_id,
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "EA player mapping added successfully",
      })

      setIsAddDialogOpen(false)
      setNewMapping({ ea_name: "", player_id: "" })
      fetchMappings()
    } catch (error: any) {
      console.error("Error adding mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add EA player mapping",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    try {
      const { error } = await supabase.from("ea_player_mappings").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "EA player mapping deleted successfully",
      })

      fetchMappings()
    } catch (error: any) {
      console.error("Error deleting mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete EA player mapping",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>EA Player Mappings</CardTitle>
            <CardDescription>Map EA player names to MGHL player profiles</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add EA Player Mapping</DialogTitle>
                <DialogDescription>
                  Create a mapping between an EA player name and an MGHL player profile.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="ea-name" className="text-right">
                    EA Name
                  </label>
                  <Input
                    id="ea-name"
                    value={newMapping.ea_name}
                    onChange={(e) => setNewMapping({ ...newMapping, ea_name: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. LispDoge"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="player" className="text-right">
                    MGHL Player
                  </label>
                  <Select
                    value={newMapping.player_id}
                    onValueChange={(value) => setNewMapping({ ...newMapping, player_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.user?.gamer_tag_id || "Unknown Player"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMapping} disabled={isSubmitting}>
                  {isSubmitting ? (
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
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No EA player mappings found. Add a mapping to link EA player names to MGHL player profiles.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EA Player Name</TableHead>
                  <TableHead>MGHL Player</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.ea_name}</TableCell>
                    <TableCell>{mapping.player_name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
