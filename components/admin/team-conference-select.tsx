"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"
import type { Conference, OnSaveConferenceCallback } from "@/lib/types/conferences"

interface TeamConferenceSelectProps {
  teamId: string
  currentConferenceId: string | null
  conferences: Pick<Conference, 'id' | 'name'>[]
  onSave?: OnSaveConferenceCallback
}

export function TeamConferenceSelect({
  teamId,
  currentConferenceId,
  conferences,
  onSave
}: TeamConferenceSelectProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [selectedConferenceId, setSelectedConferenceId] = useState<string>(currentConferenceId || "none")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSelectedConferenceId(currentConferenceId || "none")
    setHasChanges(false)
  }, [currentConferenceId])

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!supabase) {
      console.error('Supabase client not available');
      toast({
        title: "Error",
        description: "Unable to connect to the database",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("teams")
        .update({ 
          conference_id: selectedConferenceId === "none" ? null : selectedConferenceId,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId);

      if (error) throw error;

      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "Team conference updated successfully",
      });
      
      if (onSave) {
        await onSave(teamId, selectedConferenceId === "none" ? null : selectedConferenceId);
      }
    } catch (error) {
      console.error("Error updating team conference:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team conference",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedConferenceId}
        onValueChange={(value: string) => {
          setSelectedConferenceId(value)
          setHasChanges(true)
        }}
        disabled={isSaving}
      >
        <SelectTrigger className="w-48 bg-slate-800/50 border-white/20 text-white">
          <SelectValue placeholder="Select conference" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Conference</SelectItem>
          {conferences.map((conference) => (
            <SelectItem key={conference.id} value={conference.id}>
              {conference.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="h-8 px-2 min-w-[32px]"
        aria-label="Save conference changes"
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
