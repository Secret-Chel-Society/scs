"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Building2, 
  Trophy,
  ArrowRight,
  Shield,
  Star,
  Zap
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Conference {
  id: string
  name: string
  description?: string
  color?: string
  created_at: string
  updated_at: string
}

interface Team {
  id: string
  name: string
  logo_url?: string
  conference_id?: string
  conference_name?: string
}

export default function ConferencesAdminPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  const [conferences, setConferences] = useState<Conference[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConference, setEditingConference] = useState<Conference | null>(null)
  const [newConference, setNewConference] = useState({ name: "", description: "", color: "#6366f1" })
  const [showNewConferenceDialog, setShowNewConferenceDialog] = useState(false)
  const [showEditConferenceDialog, setShowEditConferenceDialog] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch conferences
      const { data: conferencesData, error: conferencesError } = await supabase
        .from("conferences")
        .select("*")
        .order("name")

      if (conferencesError) throw conferencesError

      // Fetch teams with conference info
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          logo_url,
          conference_id,
          conferences!inner(name)
        `)
        .eq("is_active", true)
        .order("name")

      if (teamsError) throw teamsError

      // Process teams data
      const processedTeams = teamsData?.map(team => ({
        ...team,
        conference_name: team.conferences?.name
      })) || []

      setConferences(conferencesData || [])
      setTeams(processedTeams)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load conferences and teams.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createConference() {
    try {
      if (!newConference.name.trim()) {
        toast({
          title: "Error",
          description: "Conference name is required.",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("conferences")
        .insert([{
          name: newConference.name.trim(),
          description: newConference.description.trim() || null,
          color: newConference.color
        }])
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Conference created successfully.",
      })

      setNewConference({ name: "", description: "", color: "#6366f1" })
      setShowNewConferenceDialog(false)
      fetchData()
    } catch (error: any) {
      console.error("Error creating conference:", error)
      toast({
        title: "Error creating conference",
        description: error.message || "Failed to create conference.",
        variant: "destructive",
      })
    }
  }

  async function updateConference() {
    try {
      if (!editingConference || !editingConference.name.trim()) {
        toast({
          title: "Error",
          description: "Conference name is required.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("conferences")
        .update({
          name: editingConference.name.trim(),
          description: editingConference.description?.trim() || null,
          color: editingConference.color,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingConference.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Conference updated successfully.",
      })

      setEditingConference(null)
      setShowEditConferenceDialog(false)
      fetchData()
    } catch (error: any) {
      console.error("Error updating conference:", error)
      toast({
        title: "Error updating conference",
        description: error.message || "Failed to update conference.",
        variant: "destructive",
      })
    }
  }

  async function deleteConference(conferenceId: string) {
    try {
      // Check if conference has teams
      const teamsInConference = teams.filter(team => team.conference_id === conferenceId)
      if (teamsInConference.length > 0) {
        toast({
          title: "Cannot delete conference",
          description: `Conference has ${teamsInConference.length} team(s). Remove all teams first.`,
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("conferences")
        .delete()
        .eq("id", conferenceId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Conference deleted successfully.",
      })

      fetchData()
    } catch (error: any) {
      console.error("Error deleting conference:", error)
      toast({
        title: "Error deleting conference",
        description: error.message || "Failed to delete conference.",
        variant: "destructive",
      })
    }
  }

  async function updateTeamConference(teamId: string, conferenceId: string | null) {
    try {
      const { error } = await supabase
        .from("teams")
        .update({ conference_id: conferenceId })
        .eq("id", teamId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Team conference updated successfully.",
      })

      fetchData()
    } catch (error: any) {
      console.error("Error updating team conference:", error)
      toast({
        title: "Error updating team conference",
        description: error.message || "Failed to update team conference.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-3 mb-6 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Shield className="h-8 w-8 text-purple-300" />
              <span className="text-purple-300 font-medium">Admin Panel</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Conference Management
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Manage conference names, team assignments, and playoff structure for the league
            </p>
          </motion.div>

          {/* Conference Management Section */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">Conferences</CardTitle>
                    <CardDescription className="text-purple-200">
                      Manage conference names and settings
                    </CardDescription>
                  </div>
                  <Dialog open={showNewConferenceDialog} onOpenChange={setShowNewConferenceDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Conference
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-purple-400/30">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Conference</DialogTitle>
                        <DialogDescription className="text-purple-200">
                          Add a new conference to the league
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-white">Conference Name</Label>
                          <Input
                            id="name"
                            value={newConference.name}
                            onChange={(e) => setNewConference({ ...newConference, name: e.target.value })}
                            placeholder="e.g., Eastern Elites"
                            className="bg-white/10 border-purple-400/30 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                          <Input
                            id="description"
                            value={newConference.description}
                            onChange={(e) => setNewConference({ ...newConference, description: e.target.value })}
                            placeholder="Conference description"
                            className="bg-white/10 border-purple-400/30 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="color" className="text-white">Theme Color</Label>
                          <Input
                            id="color"
                            type="color"
                            value={newConference.color}
                            onChange={(e) => setNewConference({ ...newConference, color: e.target.value })}
                            className="h-12 w-full bg-white/10 border-purple-400/30"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewConferenceDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createConference} className="bg-gradient-to-r from-purple-500 to-pink-500">
                          Create Conference
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {conferences.map((conference) => (
                    <motion.div
                      key={conference.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/20"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: conference.color || "#6366f1" }}
                        />
                        <div>
                          <div className="text-white font-semibold text-lg">{conference.name}</div>
                          {conference.description && (
                            <div className="text-purple-300 text-sm">{conference.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingConference(conference)
                            setShowEditConferenceDialog(true)
                          }}
                          className="border-purple-400/30 text-purple-200 hover:bg-purple-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConference(conference.id)}
                          className="border-red-400/30 text-red-200 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Team Assignment Section */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Team Conference Assignment</CardTitle>
                <CardDescription className="text-purple-200">
                  Assign teams to conferences for playoff seeding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {teams.map((team) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                          <span className="text-purple-200 font-bold text-lg">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-lg">{team.name}</div>
                          <div className="text-purple-300 text-sm">
                            Current: {team.conference_name || "Unassigned"}
                          </div>
                        </div>
                      </div>
                      <Select
                        value={team.conference_id || ""}
                        onValueChange={(value) => updateTeamConference(team.id, value || null)}
                      >
                        <SelectTrigger className="w-48 bg-white/10 border-purple-400/30 text-white">
                          <SelectValue placeholder="Select Conference" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-purple-400/30">
                          <SelectItem value="">Unassigned</SelectItem>
                          {conferences.map((conference) => (
                            <SelectItem key={conference.id} value={conference.id}>
                              {conference.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Playoff Structure Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/30">
              <CardHeader>
                <CardTitle className="text-green-200 text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Playoff Structure
                </CardTitle>
                <CardDescription className="text-green-300">
                  Current playoff format and seeding rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-green-200 font-semibold text-lg">Conference Playoffs</h3>
                    <div className="space-y-2 text-green-300">
                      <div>• Top 4 teams from each conference qualify</div>
                      <div>• Bottom 2 teams from each conference are eliminated</div>
                      <div>• Quarterfinals: 1v4, 2v3 in each conference</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-green-200 font-semibold text-lg">Seeding Rules</h3>
                    <div className="space-y-2 text-green-300">
                      <div>• Teams ranked by points, then wins</div>
                      <div>• Goal differential as tiebreaker</div>
                      <div>• Goals for as final tiebreaker</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Conference Dialog */}
      <Dialog open={showEditConferenceDialog} onOpenChange={setShowEditConferenceDialog}>
        <DialogContent className="bg-slate-800 border-purple-400/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Conference</DialogTitle>
            <DialogDescription className="text-purple-200">
              Update conference information
            </DialogDescription>
          </DialogHeader>
          {editingConference && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-white">Conference Name</Label>
                <Input
                  id="edit-name"
                  value={editingConference.name}
                  onChange={(e) => setEditingConference({ ...editingConference, name: e.target.value })}
                  className="bg-white/10 border-purple-400/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-white">Description (Optional)</Label>
                <Input
                  id="edit-description"
                  value={editingConference.description || ""}
                  onChange={(e) => setEditingConference({ ...editingConference, description: e.target.value })}
                  className="bg-white/10 border-purple-400/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-color" className="text-white">Theme Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={editingConference.color || "#6366f1"}
                  onChange={(e) => setEditingConference({ ...editingConference, color: e.target.value })}
                  className="h-12 w-full bg-white/10 border-purple-400/30"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditConferenceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateConference} className="bg-gradient-to-r from-purple-500 to-pink-500">
              Update Conference
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
