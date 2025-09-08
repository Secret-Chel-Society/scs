"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Search, Loader2, Plus, RefreshCw, CheckCircle, Link, Database, Users, Settings, Target, Zap, Shield, Activity } from "lucide-react"

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
  const [addingDarkWolf, setAddingDarkWolf] = useState(false)

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

  async function addDarkWolfMapping() {
    try {
      setAddingDarkWolf(true)

      const response = await fetch("/api/admin/player-mappings/add-lispdoge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add DarkWolf mapping")
      }

      toast({
        title: "DarkWolf Mapping Added",
        description: "Successfully added mapping for DarkWolf",
      })

      fetchMappings()
    } catch (error: any) {
      console.error("Error adding DarkWolf mapping:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add DarkWolf mapping",
        variant: "destructive",
      })
    } finally {
      setAddingDarkWolf(false)
    }
  }

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.ea_player_id?.toString().includes(searchQuery) ||
      mapping.player_id?.includes(searchQuery),
  )

  const hasDarkWolfMapping = mappings.some(
    (mapping) =>
      mapping.ea_player_id === "1005699228134" && mapping.player_id === "657dbb12-0db5-4a8b-94da-7dea7eba7409",
  )

  return (
    <div className="space-y-8">
      {/* Enhanced Main Mapping Card */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardHeader className="enhanced-card-header">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
              <Link className="h-5 w-5 text-white" />
            </div>
            <span>EA Player Mappings</span>
          </CardTitle>
          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
            Manage critical connections between EA player IDs and SCS player profiles for seamless data synchronization
          </CardDescription>
          
          {/* Enhanced Action Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMappings} 
              disabled={loading}
              className="btn-ice hover:scale-105 transition-all duration-200"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>

            <div className="flex items-center relative w-full max-w-md">
              <Search className="absolute left-3 h-5 w-5 text-hockey-silver-400 z-10" />
              <Input
                placeholder="Search mappings by name, EA ID, or SCS ID..."
                className="pl-10 pr-4 py-2 hockey-search border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="ml-auto">
              <Button
                variant={hasDarkWolfMapping ? "outline" : "default"}
                size="sm"
                onClick={addDarkWolfMapping}
                disabled={addingDarkWolf || hasDarkWolfMapping}
                className={`${hasDarkWolfMapping ? 'btn-ice' : 'btn-championship'} hover:scale-105 transition-all duration-200`}
              >
                {addingDarkWolf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : hasDarkWolfMapping ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-assist-green-500" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {hasDarkWolfMapping ? "DarkWolf Mapped" : "Add DarkWolf Mapping"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Enhanced Form Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Add New Mapping</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Database className="h-4 w-4 text-ice-blue-600" />
                  EA Player ID
                </label>
                <Input
                  placeholder="e.g., 1005699228134"
                  value={eaPlayerId}
                  onChange={(e) => setEaPlayerId(e.target.value)}
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Users className="h-4 w-4 text-rink-blue-600" />
                  SCS Player ID (UUID)
                </label>
                <Input
                  placeholder="e.g., 657dbb12-0db5-4a8b-94da-7dea7eba7409"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-hockey-silver-700 dark:text-hockey-silver-300 flex items-center gap-2">
                  <Target className="h-4 w-4 text-assist-green-600" />
                  Player Name (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., DarkWolf"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="hockey-input border-2 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                  />
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="btn-championship hover:scale-105 transition-all duration-200"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Enhanced Data Display Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">Loading Mappings</h3>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Synchronizing player data...</p>
            </div>
          ) : filteredMappings.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-ice-blue-600" />
                  Active Mappings ({filteredMappings.length})
                </h3>
                {searchQuery && (
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    Filtered from {mappings.length} total mappings
                  </div>
                )}
              </div>
              
              <div className="rounded-xl border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 overflow-hidden bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-800 dark:to-rink-blue-900/10">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30">
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-ice-blue-600" />
                          EA Player ID
                        </div>
                      </TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-rink-blue-600" />
                          SCS Player ID
                        </div>
                      </TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-assist-green-600" />
                          Player Name
                        </div>
                      </TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-goal-red-600" />
                          Created At
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping, index) => (
                      <TableRow 
                        key={mapping.id} 
                        className={`hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white/50 dark:bg-hockey-silver-800/30' : 'bg-ice-blue-50/20 dark:bg-rink-blue-900/10'
                        }`}
                      >
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-ice-blue-500 rounded-full"></div>
                            {mapping.ea_player_id}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-rink-blue-500 rounded-full"></div>
                            {mapping.player_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {mapping.player_name ? (
                              <>
                                <div className="w-2 h-2 bg-assist-green-500 rounded-full"></div>
                                <span className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">
                                  {mapping.player_name}
                                </span>
                              </>
                            ) : (
                              <span className="text-hockey-silver-500 dark:text-hockey-silver-500 italic">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                          {new Date(mapping.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-hockey-silver-200 to-ice-blue-200 dark:from-hockey-silver-700 dark:to-ice-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-hockey-silver-500 dark:text-hockey-silver-400" />
              </div>
              <h3 className="text-xl font-semibold text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">
                No player mappings found
              </h3>
              <p className="text-hockey-silver-500 dark:text-hockey-silver-500 text-lg">
                {searchQuery ? "Try adjusting your search query or clear the search to see all mappings." : "Start by adding your first player mapping above."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Setup Required Mappings Card */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardHeader className="enhanced-card-header">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span>Setup Required Mappings</span>
          </CardTitle>
          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
            Configure essential player mappings for system functionality and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                hasDarkWolfMapping 
                  ? "bg-gradient-to-br from-assist-green-50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-800/10 border-assist-green-200 dark:border-assist-green-700 shadow-lg shadow-assist-green-500/10" 
                  : "bg-gradient-to-br from-goal-red-50 to-goal-red-100/50 dark:from-goal-red-900/20 dark:to-goal-red-800/10 border-goal-red-200 dark:border-goal-red-700 shadow-lg shadow-goal-red-500/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  hasDarkWolfMapping 
                    ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg shadow-assist-green-500/25" 
                    : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg shadow-goal-red-500/25"
                }`}>
                  {hasDarkWolfMapping ? <CheckCircle className="h-6 w-6" /> : <RefreshCw className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                    DarkWolf Mapping
                  </h3>
                  <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                    {hasDarkWolfMapping ? (
                      <p className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-assist-green-600" />
                        DarkWolf mapping is correctly configured and active.
                      </p>
                    ) : (
                      <p className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-goal-red-600" />
                        Click the "Add DarkWolf Mapping" button above to create the essential mapping.
                      </p>
                    )}
                  </div>
                  {hasDarkWolfMapping && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4 text-ice-blue-600" />
                        <span className="font-mono text-ice-blue-700 dark:text-ice-blue-300">
                          EA Player ID: 1005699228134
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-rink-blue-600" />
                        <span className="font-mono text-rink-blue-700 dark:text-rink-blue-300">
                          SCS Player ID: 657dbb12-0db5-4a8b-94da-7dea7eba7409
                        </span>
                      </div>
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
