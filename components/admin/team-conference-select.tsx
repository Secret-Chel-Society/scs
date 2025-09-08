"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"

// Type definitions to prevent TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface TeamConferenceSelectProps {
  teamId: string
  currentConferenceId: string | null
  conferences: Array<{ id: string; name: string }>
  onSave?: (teamId: string, conferenceId: string | null) => void
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

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission if inside a form
    
    console.log('Saving conference change:', { teamId, selectedConferenceId });
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('Updating team in database...');
      const { data, error } = await supabase
        .from("teams")
        .update({ 
          conference_id: selectedConferenceId || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId)
        .select()
        .single();

      console.log('Update response:', { data, error });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team conference updated successfully",
      });
      
      setHasChanges(false);
      
      // Refresh the parent component if onSave is provided
      if (onSave) {
        console.log('Calling onSave callback');
        onSave(teamId, selectedConferenceId);
      }
    } catch (error: any) {
      console.error("Error updating team conference:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team conference",
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
          <SelectItem value="">No Conference</SelectItem>
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
