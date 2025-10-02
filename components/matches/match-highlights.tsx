"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Video, Camera, Image, Play, Pause, SkipForward, SkipBack, Trophy, Star, Medal, Crown, Target, Zap, Shield, Users, Clock, Calendar, Activity, TrendingUp, BarChart3, Award, BookOpen, FileText, Globe } from "lucide-react"
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
    <Card className={`hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center">
                Match Highlights
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">
                Video highlights from this match
              </CardDescription>
            </div>
          </div>
          {canEdit && !adding && (
            <Button 
              className="hockey-button hover:scale-105 transition-all duration-200" 
              onClick={() => setAdding(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Highlight
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-ice-blue-600 dark:text-ice-blue-400 mx-auto mb-4" />
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Loading highlights...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {adding && (
              <div className="hockey-alert p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Add New Highlight</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="highlight-title" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">Title</Label>
                    <Input
                      id="highlight-title"
                      placeholder="Goal Highlight, Game Winning Save, etc."
                      value={newHighlightTitle}
                      onChange={(e) => setNewHighlightTitle(e.target.value)}
                      className="hockey-search"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highlight-url" className="text-hockey-silver-700 dark:text-hockey-silver-300 font-medium">YouTube URL</Label>
                    <Input
                      id="highlight-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newHighlightUrl}
                      onChange={(e) => setNewHighlightUrl(e.target.value)}
                      className="hockey-search"
                    />
                    <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">
                      Paste a YouTube video URL (e.g., https://www.youtube.com/watch?v=abcdefg)
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setAdding(false)} 
                      disabled={submitting}
                      className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={addHighlight} 
                      disabled={submitting}
                      className="hockey-button hover:scale-105 transition-all duration-200"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {submitting ? "Adding..." : "Add Highlight"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {highlights.length > 0 ? (
              <div className="grid gap-8">
                {highlights.map((highlight) => (
                  <div key={highlight.id} className="hockey-card border-2 border-ice-blue-200 dark:border-ice-blue-700 overflow-hidden hover:scale-105 transition-all duration-300">
                    <div className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">{highlight.title}</h3>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHighlight(highlight.id)}
                            className="h-8 w-8 p-0 hover:bg-goal-red-100 dark:hover:bg-goal-red-900/30 hover:scale-110 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 text-hockey-silver-500 hover:text-goal-red-600 dark:hover:text-goal-red-400" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {renderYouTubeEmbed(highlight.embed_url)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">
                  No Highlights Yet
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-6">
                  No highlights have been added for this match yet.
                </p>
                {canEdit && !adding && (
                  <>
                    <Button 
                      className="hockey-button hover:scale-105 transition-all duration-200 mb-4" 
                      onClick={() => setAdding(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Highlight
                    </Button>
                    <p className="text-sm text-hockey-silver-500 dark:text-hockey-silver-500">
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
