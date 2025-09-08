"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"
import type { Conference } from "@/lib/types/conferences"

interface ConferenceSelectProps {
  value: string | null
  onChange: (value: string | null) => void
  onSave: () => Promise<void>
  disabled?: boolean
  saving?: boolean
  className?: string
}

export function ConferenceSelect({
  value,
  onChange,
  onSave,
  disabled = false,
  saving = false,
  className = ""
}: ConferenceSelectProps) {
  const { toast } = useToast()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    const loadConferences = async () => {
      if (!supabase) return
      
      try {
        const { data, error } = await supabase
          .from('conferences')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) throw error
        setConferences(data || [])
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

    loadConferences()
  }, [supabase, toast])

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await onSave()
      toast({
        title: "Success",
        description: "Conference updated successfully",
      })
    } catch (error) {
      console.error('Error saving conference:', error)
      toast({
        title: "Error",
        description: "Failed to update conference",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2">
      <Select disabled>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
      <Button size="sm" variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    </div>
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={value || ""}
        onValueChange={(val) => onChange(val === "" ? null : val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
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
        disabled={disabled || saving}
        className="h-9 w-9 p-0"
        aria-label="Save conference"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
