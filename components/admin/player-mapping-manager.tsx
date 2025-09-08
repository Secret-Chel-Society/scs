"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Search, Loader2, Plus, RefreshCw, CheckCircle } from "lucide-react"

export default function PlayerMappingManager() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [mappings, setMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [eaPlayerId, setEaPlayerId] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [addingLispDoge, setAddingLispDoge] = useState(false)

  useEffect(() => {
    fetchMappings()
  }, [supabase])

  async function fetchMappings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ea_player_mappings")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setMappings(data || [])
    } catch (error: any) {
      console.error("Error fetching mappings:", error)
      toast({
        title: "Error",
        description: `Failed to load player mappings: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eaPlayerId || !playerId) {
      toast({
        title: "Missing Fields",
        description: "Both EA Player ID and Player ID are required",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch("/api/admin/player-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ea_player_id: eaPlayerId,
          player_id: playerId,
          player_name: playerName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add mapping")
      }

      toast({
        title: result.updated ? "Mapping Updated" : "Mapping Added",
        description: `Successfully ${result.updated ? "updated" : "added"} player mapping`,
      })

      setEaPlayerId("")
      setPlayerId("")
      setPlayerName("")
      fetchMappings()
    } catch (error: any) {
      console.error("Error adding mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add mapping",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function addLispDogeMapping() {
    try {
      setAddingLispDoge(true)

      const response = await fetch("/api/admin/player-mappings/add-lispdoge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add LispDoge mapping")
      }

      toast({
        title: "LispDoge Mapping Added",
        description: "Successfully added mapping for LispDoge",
      })

      fetchMappings()
    } catch (error: any) {
      console.error("Error adding LispDoge mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add LispDoge mapping",
        variant: "destructive",
      })
    } finally {
      setAddingLispDoge(false)
    }
  }

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.ea_player_id?.toString().includes(searchQuery) ||
      mapping.player_id?.includes(searchQuery),
  )

  const hasLispDogeMapping = mappings.some(
    (mapping) =>
      mapping.ea_player_id === "1005699228134" && mapping.player_id === "657dbb12-0db5-4a8b-94da-7dea7eba7409",
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>EA Player Mappings</CardTitle>
          <CardDescription>Manage mappings between EA player IDs and MGHL player IDs</CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={fetchMappings} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>

            <div className="flex items-center relative w-full max-w-xs">
              <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mappings..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="ml-auto">
              <Button
                variant={hasLispDogeMapping ? "outline" : "default"}
                size="sm"
                onClick={addLispDogeMapping}
                disabled={addingLispDoge || hasLispDogeMapping}
              >
                {addingLispDoge ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : hasLispDogeMapping ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {hasLispDogeMapping ? "LispDoge Mapped" : "Add LispDoge Mapping"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">EA Player ID</label>
              <Input
                placeholder="e.g., 1005699228134"
                value={eaPlayerId}
                onChange={(e) => setEaPlayerId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">MGHL Player ID (UUID)</label>
              <Input
                placeholder="e.g., 657dbb12-0db5-4a8b-94da-7dea7eba7409"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Player Name (Optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., LispDoge"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMappings.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EA Player ID</TableHead>
                    <TableHead>MGHL Player ID</TableHead>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-mono text-xs">{mapping.ea_player_id}</TableCell>
                      <TableCell className="font-mono text-xs">{mapping.player_id}</TableCell>
                      <TableCell>{mapping.player_name || "-"}</TableCell>
                      <TableCell>{new Date(mapping.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No player mappings found.
              {searchQuery && " Try adjusting your search query."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Required Mappings</CardTitle>
          <CardDescription>Configure key player mappings for the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${hasLispDogeMapping ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900" : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900"}`}
            >
              <div className="flex items-start">
                <div className={`rounded-full p-1 ${hasLispDogeMapping ? "text-green-500" : "text-yellow-500"}`}>
                  {hasLispDogeMapping ? <CheckCircle className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">LispDoge Mapping</h3>
                  <div className="mt-1 text-xs">
                    {hasLispDogeMapping ? (
                      <p>LispDoge mapping is correctly configured.</p>
                    ) : (
                      <p>Click the "Add LispDoge Mapping" button above to create the mapping.</p>
                    )}
                  </div>
                  {hasLispDogeMapping && (
                    <div className="mt-2 text-xs">
                      <p>EA Player ID: 1005699228134</p>
                      <p>MGHL Player ID: 657dbb12-0db5-4a8b-94da-7dea7eba7409</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
