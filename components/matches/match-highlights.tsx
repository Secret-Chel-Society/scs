"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Video } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"

interface MatchHighlightsProps {
  matchId: string
  canEdit: boolean
  className?: string
}

export function MatchHighlights({ matchId, canEdit, className }: MatchHighlightsProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [highlights, setHighlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newHighlightUrl, setNewHighlightUrl] = useState("")
  const [newHighlightTitle, setNewHighlightTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch highlights when component mounts
  useEffect(() => {
    async function fetchHighlights() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("match_highlights")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: false })

        if (error) {
          // Check specifically for the "relation does not exist" error
          if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
            console.warn("Match highlights table does not exist yet. Migration may need to be run.")
            // Set empty highlights array and don't show an error toast
            setHighlights([])
          } else {
            throw error
          }
        } else {
          setHighlights(data || [])
        }
      } catch (error: any) {
        console.error("Error fetching highlights:", error)
        toast({
          title: "Error",
          description: "Failed to load match highlights",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHighlights()
  }, [matchId, supabase, toast])

  const addHighlight = async () => {
    if (!newHighlightUrl || !newHighlightTitle) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and URL for the highlight",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // Validate URL (basic check)
      if (!newHighlightUrl.includes("youtube.com") && !newHighlightUrl.includes("youtu.be")) {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid YouTube URL",
          variant: "destructive",
        })
        return
      }

      // Extract video ID from YouTube URL
      let videoId = ""
      if (newHighlightUrl.includes("youtube.com/watch?v=")) {
        videoId = new URL(newHighlightUrl).searchParams.get("v") || ""
      } else if (newHighlightUrl.includes("youtu.be/")) {
        videoId = newHighlightUrl.split("youtu.be/")[1].split("?")[0]
      }

      if (!videoId) {
        toast({
          title: "Invalid YouTube URL",
          description: "Could not extract video ID from the provided URL",
          variant: "destructive",
        })
        return
      }

      const embedUrl = `https://www.youtube.com/embed/${videoId}`

      // First check if the table exists by doing a count query
      const { count, error: countError } = await supabase
        .from("match_highlights")
        .select("*", { count: "exact", head: true })

      if (countError) {
        // If the table doesn't exist, show a message to run the migration
        if (
          countError.message &&
          countError.message.includes("relation") &&
          countError.message.includes("does not exist")
        ) {
          toast({
            title: "Setup required",
            description: "The match highlights feature needs to be set up by an administrator first.",
            variant: "destructive",
          })
          return
        }
      }

      const { data, error } = await supabase
        .from("match_highlights")
        .insert({
          match_id: matchId,
          title: newHighlightTitle,
          video_url: newHighlightUrl,
          embed_url: embedUrl,
        })
        .select()

      if (error) throw error

      setHighlights([...(data || []), ...highlights])
      setNewHighlightUrl("")
      setNewHighlightTitle("")
      setAdding(false)

      toast({
        title: "Highlight added",
        description: "The match highlight has been added successfully",
      })
    } catch (error: any) {
      console.error("Error adding highlight:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add highlight",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteHighlight = async (id: string) => {
    try {
      const { error } = await supabase.from("match_highlights").delete().eq("id", id)

      if (error) throw error

      setHighlights(highlights.filter((h) => h.id !== id))
      toast({
        title: "Highlight removed",
        description: "The match highlight has been removed successfully",
      })
    } catch (error: any) {
      console.error("Error removing highlight:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove highlight",
        variant: "destructive",
      })
    }
  }

  // Function to render YouTube embed
  const renderYouTubeEmbed = (embedUrl: string) => {
    return (
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-md"
        ></iframe>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            Match Highlights
          </CardTitle>
          <CardDescription>Video highlights from this match</CardDescription>
        </div>
        {canEdit && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Highlight
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {adding && (
              <div className="border rounded-md p-4 mb-6 bg-muted/30">
                <h3 className="font-medium mb-4">Add New Highlight</h3>
                <div className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="highlight-title">Title</Label>
                    <Input
                      id="highlight-title"
                      placeholder="Goal Highlight, Game Winning Save, etc."
                      value={newHighlightTitle}
                      onChange={(e) => setNewHighlightTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="highlight-url">YouTube URL</Label>
                    <Input
                      id="highlight-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newHighlightUrl}
                      onChange={(e) => setNewHighlightUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a YouTube video URL (e.g., https://www.youtube.com/watch?v=abcdefg)
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setAdding(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={addHighlight} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {submitting ? "Adding..." : "Add Highlight"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {highlights.length > 0 ? (
              <div className="grid gap-6">
                {highlights.map((highlight) => (
                  <div key={highlight.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{highlight.title}</h3>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHighlight(highlight.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                    {renderYouTubeEmbed(highlight.embed_url)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No highlights have been added for this match yet.</p>
                {canEdit && !adding && (
                  <>
                    <Button variant="outline" className="mt-4" onClick={() => setAdding(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Highlight
                    </Button>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Note: If you encounter errors, the highlights feature may need to be set up by an administrator.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
