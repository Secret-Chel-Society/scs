"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"

interface TeamConferenceSelectProps {
  teamId: string
  currentConferenceId: string | null
  conferences: Array<{ id: string; name: string }>
  onSave?: () => void
}

export function TeamConferenceSelect({
  teamId,
  currentConferenceId,
  conferences,
  onSave
}: TeamConferenceSelectProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [selectedConferenceId, setSelectedConferenceId] = useState<string>(currentConferenceId || "")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSelectedConferenceId(currentConferenceId || "")
    setHasChanges(false)
  }, [currentConferenceId])

  const handleSave = async () => {
    if (!supabase) return
    
    setIsSaving(true)
    
    try {
      const { error } = await supabase
        .from("teams")
        .update({ 
          conference_id: selectedConferenceId || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Team conference updated successfully",
      })
      
      setHasChanges(false)
      onSave?.()
    } catch (error: any) {
      console.error("Error updating team conference:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update team conference",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedConferenceId}
        onValueChange={(value) => {
          setSelectedConferenceId(value)
          setHasChanges(true)
        }}
        disabled={isSaving}
      >
        <SelectTrigger className="w-48 bg-slate-800/50 border-white/20 text-white">
          <SelectValue placeholder="Select conference" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No Conference</SelectItem>
          {conferences.map((conference) => (
            <SelectItem key={conference.id} value={conference.id}>
              {conference.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="h-8 w-8 p-0"
        variant="outline"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
