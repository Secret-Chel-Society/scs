"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Mapping {
  id: string
  persona: string
  player_id: string
  player_name?: string
}

export function EaPlayerMappingsManager() {
  const { supabase } = useSupabase()
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([])
  const [newPersona, setNewPersona] = useState("")
  const [newPlayerId, setNewPlayerId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchMappings()
    fetchPlayers()
  }, [])

  const fetchMappings = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .select("id, persona, player_id")
        .order("persona")

      if (error) throw error

      // Fetch player names for each mapping
      const mappingsWithNames = await Promise.all(
        (data || []).map(async (mapping) => {
          const { data: playerData } = await supabase
            .from("players")
            .select("id, first_name, last_name")
            .eq("id", mapping.player_id)
            .single()

          return {
            ...mapping,
            player_name: playerData ? `${playerData.first_name} ${playerData.last_name}` : "Unknown Player",
          }
        }),
      )

      setMappings(mappingsWithNames)
    } catch (error) {
      console.error("Error fetching mappings:", error)
      toast({
        title: "Error",
        description: "Failed to load EA player mappings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase.from("players").select("id, first_name, last_name").order("last_name")

      if (error) throw error

      setPlayers(
        (data || []).map((player) => ({
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
        })),
      )
    } catch (error) {
      console.error("Error fetching players:", error)
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive",
      })
    }
  }

  const addMapping = async () => {
    if (!newPersona || !newPlayerId) {
      toast({
        title: "Error",
        description: "Please enter both EA persona and select a player",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .insert([{ persona: newPersona, player_id: newPlayerId }])
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Mapping added successfully",
      })

      setNewPersona("")
      setNewPlayerId("")
      fetchMappings()
    } catch (error) {
      console.error("Error adding mapping:", error)
      toast({
        title: "Error",
        description: "Failed to add mapping",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase.from("ea_player_mappings").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Mapping deleted successfully",
      })

      fetchMappings()
    } catch (error) {
      console.error("Error deleting mapping:", error)
      toast({
        title: "Error",
        description: "Failed to delete mapping",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EA Player Mappings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="persona" className="block text-sm font-medium mb-1">
                EA Persona
              </label>
              <Input
                id="persona"
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                placeholder="Enter EA persona (e.g., LispDoge)"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="player" className="block text-sm font-medium mb-1">
                MGHL Player
              </label>
              <select
                id="player"
                value={newPlayerId}
                onChange={(e) => setNewPlayerId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={addMapping} disabled={isSaving}>
                {isSaving ? "Adding..." : "Add Mapping"}
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EA Persona</TableHead>
                  <TableHead>MGHL Player</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Loading mappings...
                    </TableCell>
                  </TableRow>
                ) : mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No mappings found. Add your first mapping above.
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell>{mapping.persona}</TableCell>
                      <TableCell>{mapping.player_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMapping(mapping.id)}
                          title="Delete mapping"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
