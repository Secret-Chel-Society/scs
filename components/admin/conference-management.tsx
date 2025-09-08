"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Pencil, Plus, Trash2, Save, X } from "lucide-react"

interface Conference {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

interface ConferenceManagementProps {
  conferences: Conference[]
  onConferencesUpdated: () => void
}

export function ConferenceManagement({ conferences, onConferencesUpdated }: ConferenceManagementProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editingConference, setEditingConference] = useState<Conference | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (conference: Conference) => {
    setEditingConference(conference)
    setFormData({
      name: conference.name,
      description: conference.description || "",
      color: conference.color
    })
    setIsEditing(true)
  }

  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6"
    })
    setIsAdding(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Conference name is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingConference) {
        // Update existing conference
        const { error } = await supabase
          .from("conferences")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingConference.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Conference updated successfully",
        })
      } else {
        // Create new conference
        const { error } = await supabase
          .from("conferences")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Conference created successfully",
        })
      }

      setIsEditing(false)
      setIsAdding(false)
      setEditingConference(null)
      onConferencesUpdated()
    } catch (error: any) {
      console.error("Error saving conference:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save conference",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (conference: Conference) => {
    if (!confirm(`Are you sure you want to delete "${conference.name}"? This will remove all team assignments to this conference.`)) {
      return
    }

    try {
      // First, remove conference assignments from teams
      const { error: teamError } = await supabase
        .from("teams")
        .update({ conference_id: null })
        .eq("conference_id", conference.id)

      if (teamError) throw teamError

      // Then delete the conference
      const { error } = await supabase
        .from("conferences")
        .delete()
        .eq("id", conference.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Conference deleted successfully",
      })

      onConferencesUpdated()
    } catch (error: any) {
      console.error("Error deleting conference:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete conference",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAdding(false)
    setEditingConference(null)
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
            Conference Management
          </h3>
          <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
            Manage conference names and colors for standings display
          </p>
        </div>
        <Button onClick={handleAdd} className="hockey-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Conference
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {conferences.map((conference) => (
          <Card key={conference.id} className="hockey-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: conference.color }}
                  >
                    <span className="text-white font-bold text-sm">
                      {conference.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{conference.name}</CardTitle>
                    {conference.description && (
                      <CardDescription className="text-xs">
                        {conference.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(conference)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(conference)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isEditing || isAdding} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConference ? "Edit Conference" : "Add Conference"}
            </DialogTitle>
            <DialogDescription>
              {editingConference 
                ? "Update the conference information below."
                : "Create a new conference for team organization."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Conference Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Eastern Conference"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the conference"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="hockey-button">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingConference ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
