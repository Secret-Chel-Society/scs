"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Conference, ConferenceWithTeamCount } from "@/lib/types/conferences"
import { ConferenceForm } from "@/components/admin/conference-form"

export function ConferenceList() {
  const [conferences, setConferences] = useState<ConferenceWithTeamCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingConference, setEditingConference] = useState<Conference | null>(null)
  const supabase = useSupabase()
  const { toast } = useToast()

  const loadConferences = async () => {
    if (!supabase) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('conferences')
        .select('*, teams:teams(count)', { count: 'exact' })
        .order('name', { ascending: true })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to include team_count
      const conferencesWithCount = (data || []).map(conf => ({
        ...conf,
        team_count: conf.teams?.[0]?.count || 0
      }))

      setConferences(conferencesWithCount)
    } catch (error) {
      console.error('Error loading conferences:', error)
      toast({
        title: "Error",
        description: "Failed to load conferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConferences()
  }, [search, supabase])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conference? This cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('conferences')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Conference deleted successfully",
      })
      
      loadConferences()
    } catch (error) {
      console.error('Error deleting conference:', error)
      toast({
        title: "Error",
        description: "Failed to delete conference. Make sure no teams are assigned to it.",
        variant: "destructive",
      })
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingConference(null)
    loadConferences()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conferences..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setEditingConference(null)
          setShowForm(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Conference
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conferences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No conferences found
                  </TableCell>
                </TableRow>
              ) : (
                conferences.map((conference) => (
                  <TableRow key={conference.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {conference.color && (
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: conference.color }}
                          />
                        )}
                        {conference.name}
                      </div>
                    </TableCell>
                    <TableCell>{conference.team_count} teams</TableCell>
                    <TableCell>
                      <Badge variant={conference.is_active ? 'default' : 'secondary'}>
                        {conference.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(conference.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingConference(conference)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(conference.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConferenceForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingConference(null)
        }}
        conference={editingConference}
        onSuccess={handleFormSubmit}
      />
    </div>
  )
}
