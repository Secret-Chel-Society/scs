"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  AlertCircle,
  Edit,
  Trash2,
  Reply,
  Pin,
  PinOff,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"
import { createClient } from "@/lib/supabase/client"

interface ForumPost {
  id: string
  title: string
  content: string
  author: {
    id: string
    email: string
    gamer_tag: string
    avatar_url?: string
  }
  category: {
    id: string
    name: string
    color: string
  }
  pinned: boolean
  views: number
  like_count: number
  dislike_count: number
  reply_count: number
  user_votes: Array<{ vote_type: string; user_id: string }>
  created_at: string
}

interface ReplyType {
  id: string
  content: string
  author: {
    id: string
    email: string
    gamer_tag: string
    avatar_url?: string
  }
  like_count: number
  dislike_count: number
  user_votes: Array<{ vote_type: string; user_id: string }>
  created_at: string
}

export default function ForumPostPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useSupabase()
  const { toast } = useToast()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ReplyType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newReply, setNewReply] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Pin state
  const [isPinning, setIsPinning] = useState(false)

  const fetchPost = useCallback(async () => {
    if (!params.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/forum/posts/${params.id}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.post) {
        setPost(data.post)
        setReplies(data.replies || [])
        setEditTitle(data.post.title)
        setEditContent(data.post.content)
      } else {
        setError("Post not found")
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      setError("Failed to load post. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  const fetchUserRole = useCallback(async () => {
    if (!session?.user?.id) {
      setIsRoleLoading(false)
      return
    }

    setIsRoleLoading(true)
    try {
      const response = await fetch(`/api/admin/check-admin-status`)
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role)
        console.log("User role:", data.role) // Debug log
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    } finally {
      setIsRoleLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  useEffect(() => {
    fetchUserRole()
  }, [fetchUserRole])

  const handleVote = async (type: "like" | "dislike", targetId: string, isReply = false) => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const response = await fetch("/api/forum/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [isReply ? "reply_id" : "post_id"]: targetId,
          vote_type: type,
        }),
      })

      if (response.ok) {
        // Refresh data
        await fetchPost()
        toast({
          title: "Success",
          description: "Vote recorded",
        })
      } else {
        throw new Error("Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitReply = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    if (!newReply.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/forum/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: params.id,
          content: newReply.trim(),
        }),
      })

      if (response.ok) {
        setNewReply("")
        await fetchPost() // Refresh to get new reply
        toast({
          title: "Success",
          description: "Reply posted successfully",
        })
      } else {
        throw new Error("Failed to post reply")
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePost = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/forum/posts/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
        }),
      })

      if (response.ok) {
        await fetchPost()
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Post updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update post")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTogglePin = async () => {
    if (!post) return

    setIsPinning(true)

    try {
      const response = await fetch(`/api/forum/posts/${params.id}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinned: !post.pinned,
        }),
      })

      if (response.ok) {
        await fetchPost()
        toast({
          title: "Success",
          description: post.pinned ? "Post unpinned" : "Post pinned to top",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to toggle pin")
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle pin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPinning(false)
    }
  }

  const handleDeletePost = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      console.log("Attempting to delete post:", params.id)

      // Try API first
      const response = await fetch(`/api/forum/posts/${params.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        router.push("/forum")
        return
      }

      // If API fails, try direct Supabase delete
      console.log("API delete failed, trying direct Supabase delete")
      const supabase = createClient()

      // Check permissions first
      if (!session?.user?.id) {
        throw new Error("Not authenticated")
      }

      // Get user role for permission check
      const { data: userData } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      const isAdmin = userData?.role === "admin"
      const isOwner = post?.author.id === session.user.id

      if (!isOwner && !isAdmin) {
        throw new Error("You don't have permission to delete this post")
      }

      // Delete the post directly
      const { error: deleteError } = await supabase.from("forum_posts").delete().eq("id", params.id)

      if (deleteError) {
        throw new Error(`Database error: ${deleteError.message}`)
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      router.push("/forum")
    } catch (error) {
      console.error("Error deleting post:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete post. Please try again."
      setDeleteError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getUserVote = (votes: Array<{ vote_type: string; user_id: string }>) => {
    if (!session?.user?.id) return null
    return votes.find((vote) => vote.user_id === session.user.id)?.vote_type || null
  }

  // Helper function to get display name (same as forum page)
  const getDisplayName = (author: any) => {
    if (!author) {
      return "Unknown User"
    }

    // Try gamer_tag first, then email, then fallback
    if (author.gamer_tag && author.gamer_tag.trim() !== "") {
      return author.gamer_tag
    }

    if (author.email) {
      // Extract username from email
      return author.email.split("@")[0]
    }

    return "Unknown User"
  }

  // Helper function to get avatar fallback
  const getAvatarFallback = (author: any) => {
    const displayName = getDisplayName(author)
    return displayName.charAt(0).toUpperCase()
  }

  // Check permissions with better logging
  const canEditPost = () => {
    if (!post || !session?.user?.id) {
      console.log("Cannot edit: no post or session", { post: !!post, session: !!session?.user?.id })
      return false
    }

    const isOwner = post.author.id === session.user.id
    const isAdmin = userRole === "admin"

    console.log("Edit permissions:", {
      isOwner,
      isAdmin,
      userRole,
      postAuthorId: post.author.id,
      sessionUserId: session.user.id,
    })

    return isOwner || isAdmin
  }

  const canDeletePost = () => {
    if (!post || !session?.user?.id) {
      console.log("Cannot delete: no post or session", { post: !!post, session: !!session?.user?.id })
      return false
    }

    const isOwner = post.author.id === session.user.id
    const isAdmin = userRole === "admin"

    console.log("Delete permissions:", {
      isOwner,
      isAdmin,
      userRole,
      postAuthorId: post.author.id,
      sessionUserId: session.user.id,
    })

    return isOwner || isAdmin
  }

  const canPinPost = () => {
    return userRole === "admin"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Post</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchPost}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Post Not Found</h3>
            <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/forum")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userVote = getUserVote(post.user_votes)
  const showEditButton = canEditPost()
  const showDeleteButton = canDeletePost()
  const showPinButton = canPinPost()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push("/forum")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Forum
      </Button>

      {/* Post */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              {post.pinned && <Pin className="w-4 h-4 text-yellow-500" />}
              <Badge style={{ backgroundColor: post.category?.color + "20", color: post.category?.color }}>
                {post.category?.name}
              </Badge>
            </div>
            {(showEditButton || showDeleteButton || showPinButton) && (
              <div className="flex gap-2">
                {showPinButton && (
                  <Button variant="outline" size="sm" onClick={handleTogglePin} disabled={isPinning}>
                    {post.pinned ? (
                      <>
                        <PinOff className="w-4 h-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4 mr-2" />
                        Pin
                      </>
                    )}
                  </Button>
                )}
                {showEditButton && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {showDeleteButton && (
                  <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{getAvatarFallback(post.author)}</AvatarFallback>
              </Avatar>
              <span>{getDisplayName(post.author)}</span>
            </div>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6 dark:prose-invert">
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <p className="whitespace-pre-wrap">{post.content}</p>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Button
              variant={userVote === "like" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("like", post.id)}
              className={userVote === "like" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {post.like_count || 0}
            </Button>
            <Button
              variant={userVote === "dislike" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("dislike", post.id)}
              className={userVote === "dislike" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              {post.dislike_count || 0}
            </Button>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{post.reply_count || 0} replies</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title" />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <RichTextEditor content={editContent} onChange={setEditContent} placeholder="Post content" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePost} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              {deleteError && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                  Error: {deleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteError(null)}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeletePost} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Replies ({replies.length})</h2>
        </CardHeader>
        <CardContent>
          {/* Add Reply Form */}
          {session ? (
            <div className="mb-6">
              <RichTextEditor content={newReply} onChange={setNewReply} placeholder="Write a reply..." />
              <div className="mt-3">
                <Button onClick={handleSubmitReply} disabled={isSubmitting || !newReply.trim()}>
                  <Reply className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 border rounded-lg text-center">
              <p className="text-muted-foreground mb-2">Please log in to post a reply</p>
              <Button onClick={() => router.push("/login")}>Log In</Button>
            </div>
          )}

          <Separator className="mb-6" />

          {/* Replies List */}
          {replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {replies.map((reply) => {
                const replyUserVote = getUserVote(reply.user_votes)

                return (
                  <div key={reply.id} className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={reply.author?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{getAvatarFallback(reply.author)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getDisplayName(reply.author)}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="prose dark:prose-invert max-w-none mb-3">
                        {reply.content ? (
                          <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                        ) : (
                          <p className="whitespace-pre-wrap">{reply.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={replyUserVote === "like" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote("like", reply.id, true)}
                          className={replyUserVote === "like" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {reply.like_count || 0}
                        </Button>
                        <Button
                          variant={replyUserVote === "dislike" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote("dislike", reply.id, true)}
                          className={replyUserVote === "dislike" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          {reply.dislike_count || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
